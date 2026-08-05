import axios from "axios";
import type {
  ApiEnvelopeDTO,
  AuthActionResultDTO,
  AuthTokensDTO,
  ClientAuthUserDTO,
  ClientLoginDTO,
  ClientLoginResponseDTO,
  ForgotPasswordDTO,
  LogoutRequestDTO,
  LogoutResultDTO,
  RegisterClientDTO,
  ResetPasswordDTO,
  SendEmailVerificationDTO,
  SendPhoneOtpDTO,
  UpdateDateOfBirthDTO,
  VerifyEmailTokenDTO,
  VerifyPhoneOtpDTO,
} from "../../application/dtos/AuthDTO";
import type { AdminAccess, UserRole, VerificationTag } from "../../domain/entities/User";
import { User } from "../../domain/entities/User";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import { isTokenExpired, tokenCookies } from "@/lib/cookies";
import {
  persistAuthTokens,
  refreshAccessToken,
} from "../auth/sessionTokenRefresh";
import { API_CONFIG, API_ENDPOINTS } from "../api/constants";
import { HttpClient } from "../api/HttpClient";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return fallback;
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  return String(value);
}

function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = asRecord(error.response?.data);
    const message = data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/**
 * Client auth API repository — implements /api/v1/client/auth/*
 */
export class ApiAuthRepository implements IAuthRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async register(payload: RegisterClientDTO): Promise<AuthActionResultDTO> {
    try {
      const response = await this.httpClient.post<
        ApiEnvelopeDTO<AuthActionResultDTO>
      >(API_ENDPOINTS.AUTH.REGISTER, payload);
      return this.parseActionResult(response.data);
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, "Registration failed"));
    }
  }

  async login(
    payload: ClientLoginDTO
  ): Promise<{ user: User; tokens: AuthTokensDTO }> {
    try {
      this.clearPersistedAuthenticatedSession();

      const response = await this.httpClient.post<
        ApiEnvelopeDTO<ClientLoginResponseDTO>
      >(API_ENDPOINTS.AUTH.LOGIN, payload);

      const data = this.unwrapData(response.data);
      const tokensRecord = asRecord(data.tokens);
      const accessToken = asString(tokensRecord?.accessToken);
      const refreshToken = asString(tokensRecord?.refreshToken);

      if (!accessToken) {
        throw new Error("Login response did not include an access token");
      }
      if (!refreshToken) {
        throw new Error("Login response did not include a refresh token");
      }

      const tokens: AuthTokensDTO = {
        accessToken,
        refreshToken,
        expiresIn: asString(tokensRecord?.expiresIn) || undefined,
        refreshExpiresIn: asString(tokensRecord?.refreshExpiresIn) || undefined,
      };

      const userDto = asRecord(data.user) as ClientAuthUserDTO | null;
      if (!userDto?.id) {
        throw new Error("Login response did not include a user");
      }

      const user = this.mapClientUserToEntity(userDto);
      this.persistAuthenticatedSession(tokens, user);
      return { user, tokens };
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, "Invalid credentials"));
    }
  }

  async refreshSession(): Promise<boolean> {
    return refreshAccessToken();
  }

  async logout(): Promise<LogoutResultDTO | null> {
    const refreshToken = tokenCookies.getRefreshToken();

    try {
      if (refreshToken) {
        const response = await this.httpClient.post<
          ApiEnvelopeDTO<LogoutResultDTO>
        >(API_ENDPOINTS.AUTH.LOGOUT, {
          refreshToken,
        } satisfies LogoutRequestDTO);
        const result = this.unwrapData(response.data);
        return {
          revoked: Boolean(asRecord(result)?.revoked),
        };
      }
      return null;
    } catch (error: unknown) {
      console.error("Error during logout:", error);
      return null;
    } finally {
      this.httpClient.clearCsrfToken();
      this.clearPersistedAuthenticatedSession();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = tokenCookies.getToken();
      if (!token || isTokenExpired(token)) {
        const refreshed = await refreshAccessToken();
        if (!refreshed) {
          this.clearPersistedAuthenticatedSession();
          return null;
        }
      }

      try {
        const response = await this.httpClient.get<
          ApiEnvelopeDTO<ClientAuthUserDTO>
        >(API_ENDPOINTS.AUTH.ME);
        const userDto = this.unwrapData(response.data);
        const user = this.mapClientUserToEntity(userDto);
        tokenCookies.setUser(JSON.stringify(user));
        return user;
      } catch {
        // Offline / network failure: fall back to cached session user
        const userJson = tokenCookies.getUser();
        if (!userJson) {
          this.clearPersistedAuthenticatedSession();
          return null;
        }
        const cached = JSON.parse(userJson) as ClientAuthUserDTO;
        return this.mapClientUserToEntity(cached);
      }
    } catch (error: unknown) {
      console.error("Error getting current user:", error);
      return null;
    }
  }

  async forgotPassword(
    payload: ForgotPasswordDTO
  ): Promise<AuthActionResultDTO> {
    try {
      const response = await this.httpClient.post<
        ApiEnvelopeDTO<AuthActionResultDTO>
      >(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
      return this.parseActionResult(response.data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to send password reset code")
      );
    }
  }

  async resetPassword(payload: ResetPasswordDTO): Promise<AuthActionResultDTO> {
    try {
      const response = await this.httpClient.post<
        ApiEnvelopeDTO<AuthActionResultDTO>
      >(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
      return this.parseActionResult(response.data);
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, "Unable to reset password"));
    }
  }

  async sendPhoneOtp(payload: SendPhoneOtpDTO): Promise<AuthActionResultDTO> {
    try {
      const response = await this.httpClient.post<
        ApiEnvelopeDTO<AuthActionResultDTO>
      >(API_ENDPOINTS.AUTH.OTP_SEND, payload);
      return this.parseActionResult(response.data);
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, "Unable to send OTP"));
    }
  }

  async verifyPhoneOtp(
    payload: VerifyPhoneOtpDTO
  ): Promise<AuthActionResultDTO> {
    try {
      const response = await this.httpClient.post<
        ApiEnvelopeDTO<AuthActionResultDTO>
      >(API_ENDPOINTS.AUTH.OTP_VERIFY, payload);
      return this.parseActionResult(response.data);
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, "Unable to verify OTP"));
    }
  }

  async sendEmailVerification(
    payload: SendEmailVerificationDTO
  ): Promise<AuthActionResultDTO> {
    try {
      const response = await this.httpClient.post<
        ApiEnvelopeDTO<AuthActionResultDTO>
      >(API_ENDPOINTS.AUTH.EMAIL_SEND_VERIFICATION, payload);
      return this.parseActionResult(response.data);
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to send email verification")
      );
    }
  }

  async verifyEmailToken(
    payload: VerifyEmailTokenDTO
  ): Promise<AuthActionResultDTO> {
    try {
      const response = await this.httpClient.post<
        ApiEnvelopeDTO<AuthActionResultDTO>
      >(API_ENDPOINTS.AUTH.EMAIL_VERIFY, payload);
      return this.parseActionResult(response.data);
    } catch (error: unknown) {
      throw new Error(extractApiErrorMessage(error, "Unable to verify email"));
    }
  }

  async updateDateOfBirth(payload: UpdateDateOfBirthDTO): Promise<User> {
    try {
      const response = await this.httpClient.patch<
        ApiEnvelopeDTO<{ id: string; dateOfBirth: string }>
      >(API_ENDPOINTS.AUTH.UPDATE_DATE_OF_BIRTH, payload);

      const updated = this.unwrapData(response.data);
      const current = await this.getCurrentUser();
      if (!current) {
        throw new Error("Not authenticated");
      }

      const nextUser = new User({
        ...current,
        dateOfBirth: asNullableString(updated.dateOfBirth),
      });
      tokenCookies.setUser(JSON.stringify(nextUser));
      return nextUser;
    } catch (error: unknown) {
      throw new Error(
        extractApiErrorMessage(error, "Unable to update date of birth")
      );
    }
  }

  private unwrapData<T>(envelope: ApiEnvelopeDTO<T> | T): T {
    const record = asRecord(envelope);
    if (record && "data" in record) {
      return record.data as T;
    }
    return envelope as T;
  }

  private parseActionResult(
    envelope: ApiEnvelopeDTO<AuthActionResultDTO> | AuthActionResultDTO
  ): AuthActionResultDTO {
    const data = this.unwrapData(envelope);
    const record = asRecord(data);
    const action = asString(record?.action);
    return {
      success: Boolean(record?.success ?? true),
      action: action || undefined,
    };
  }

  private mapClientUserToEntity(apiUser: ClientAuthUserDTO): User {
    const adminAccess = this.mapAdminAccess(apiUser.adminAccess);
    const role: UserRole = adminAccess ? "ADMIN" : "CLIENT";

    return new User({
      id: asString(apiUser.id),
      nickname: asString(apiUser.nickname),
      email: asString(apiUser.email),
      phone: asString(apiUser.phone),
      avatar: asNullableString(apiUser.avatar),
      isPhoneVerified: Boolean(apiUser.isPhoneVerified),
      isEmailVerified: Boolean(apiUser.isEmailVerified),
      phoneVerifiedAt: asNullableString(apiUser.phoneVerifiedAt),
      emailVerifiedAt: asNullableString(apiUser.emailVerifiedAt),
      dateOfBirth: asNullableString(apiUser.dateOfBirth),
      referralCode: asNullableString(apiUser.referralCode),
      adminAccess,
      verificationTags: this.mapVerificationTags(apiUser.verificationTags),
      role,
      adminRoleName: adminAccess?.role,
      permissions: adminAccess?.permissions ?? [],
      profileImageUrl: this.convertToFullUrl(
        asNullableString(apiUser.avatar) ?? undefined
      ),
    });
  }

  private mapAdminAccess(
    value: ClientAuthUserDTO["adminAccess"]
  ): AdminAccess | null {
    if (!value || typeof value !== "object") return null;
    const role = asString(value.role);
    if (!role) return null;

    const permissions = Array.isArray(value.permissions)
      ? value.permissions
          .filter((entry): entry is string => typeof entry === "string")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : [];

    return {
      role,
      isRootAdmin: Boolean(value.isRootAdmin),
      permissions,
    };
  }

  private mapVerificationTags(
    tags: ClientAuthUserDTO["verificationTags"]
  ): VerificationTag[] {
    if (!Array.isArray(tags)) return [];

    return tags.map((tag) => ({
      type: asString(tag?.type, "UNKNOWN"),
      label: asString(tag?.label),
      value: asNullableString(tag?.value),
      status: asString(tag?.status, "UNVERIFIED"),
      isVerified: Boolean(tag?.isVerified),
      canVerifyFromProfile: Boolean(tag?.canVerifyFromProfile),
      action: asNullableString(tag?.action),
      verifiedAt: asNullableString(tag?.verifiedAt),
    }));
  }

  private convertToFullUrl(url?: string): string | undefined {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${API_CONFIG.BASE_URL}${url}`;
  }

  private persistAuthenticatedSession(tokens: AuthTokensDTO, user: User): void {
    persistAuthTokens(tokens);
    tokenCookies.setUser(JSON.stringify(user));
  }

  private clearPersistedAuthenticatedSession(): void {
    tokenCookies.clearAll();
  }
}
