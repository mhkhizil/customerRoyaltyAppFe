import type {
  AuthActionResultDTO,
  ClientLoginDTO,
  ForgotPasswordDTO,
  RegisterClientDTO,
  ResetPasswordDTO,
  SendEmailVerificationDTO,
  SendPhoneOtpDTO,
  UpdateDateOfBirthDTO,
  VerifyEmailTokenDTO,
  VerifyPhoneOtpDTO,
} from "../dtos/AuthDTO";
import type { User } from "../../domain/entities/User";
import type { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import type { IAuthService } from "../../domain/services/IAuthService";

function isEmail(value: string): boolean {
  return value.includes("@");
}

function rethrowAuthError(error: unknown, fallback: string): never {
  if (error instanceof Error && error.message) {
    throw error;
  }
  throw new Error(fallback);
}

/**
 * Application service for client authentication use cases.
 */
export class AuthService implements IAuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  async register(payload: RegisterClientDTO): Promise<AuthActionResultDTO> {
    if (!payload.nickname?.trim()) {
      throw new Error("Nickname is required");
    }
    if (!payload.phone?.trim()) {
      throw new Error("Phone is required");
    }
    if (!payload.email?.trim() || !isEmail(payload.email)) {
      throw new Error("Valid email is required");
    }
    if (!payload.password) {
      throw new Error("Password is required");
    }
    if (payload.password !== payload.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    try {
      return await this.authRepository.register({
        nickname: payload.nickname.trim(),
        phone: payload.phone.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        confirmPassword: payload.confirmPassword,
      });
    } catch (error: unknown) {
      rethrowAuthError(error, "Registration failed. Please try again.");
    }
  }

  async login(payload: ClientLoginDTO): Promise<User> {
    const hasPhone = "phone" in payload && !!payload.phone?.trim();
    const hasEmail = "email" in payload && !!payload.email?.trim();

    if ((hasPhone && hasEmail) || (!hasPhone && !hasEmail)) {
      throw new Error("Provide exactly one identifier: phone or email");
    }
    if (!payload.password) {
      throw new Error("Password is required");
    }

    try {
      const normalizedPayload: ClientLoginDTO = hasPhone
        ? { phone: String(payload.phone).trim(), password: payload.password }
        : {
            email: String(payload.email).trim().toLowerCase(),
            password: payload.password,
          };

      const result = await this.authRepository.login(normalizedPayload);
      return result.user;
    } catch (error: unknown) {
      rethrowAuthError(error, "Login failed. Please try again.");
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authRepository.logout();
    } catch (error: unknown) {
      console.error("Error during logout:", error);
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      return await this.authRepository.refreshSession();
    } catch (error: unknown) {
      console.error("Error refreshing session:", error);
      return false;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await this.authRepository.getCurrentUser();
    } catch (error: unknown) {
      console.error("Error retrieving current user:", error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  async forgotPassword(
    payload: ForgotPasswordDTO
  ): Promise<AuthActionResultDTO> {
    const hasPhone = "phone" in payload && !!payload.phone?.trim();
    const hasEmail = "email" in payload && !!payload.email?.trim();

    if ((hasPhone && hasEmail) || (!hasPhone && !hasEmail)) {
      throw new Error("Provide exactly one identifier: phone or email");
    }

    try {
      return await this.authRepository.forgotPassword(
        hasPhone
          ? { phone: String(payload.phone).trim() }
          : { email: String(payload.email).trim().toLowerCase() }
      );
    } catch (error: unknown) {
      rethrowAuthError(error, "Unable to send password reset code.");
    }
  }

  async resetPassword(payload: ResetPasswordDTO): Promise<AuthActionResultDTO> {
    if (!payload.code?.trim()) {
      throw new Error("Reset code is required");
    }
    if (!payload.newPassword) {
      throw new Error("New password is required");
    }
    if (payload.newPassword !== payload.confirmNewPassword) {
      throw new Error("Passwords do not match");
    }

    const hasPhone = "phone" in payload && !!payload.phone?.trim();
    const hasEmail = "email" in payload && !!payload.email?.trim();

    if ((hasPhone && hasEmail) || (!hasPhone && !hasEmail)) {
      throw new Error("Provide exactly one identifier: phone or email");
    }

    try {
      const base = {
        code: payload.code.trim(),
        newPassword: payload.newPassword,
        confirmNewPassword: payload.confirmNewPassword,
      };

      return await this.authRepository.resetPassword(
        hasPhone
          ? { ...base, phone: String(payload.phone).trim() }
          : { ...base, email: String(payload.email).trim().toLowerCase() }
      );
    } catch (error: unknown) {
      rethrowAuthError(error, "Unable to reset password.");
    }
  }

  async sendPhoneOtp(payload: SendPhoneOtpDTO): Promise<AuthActionResultDTO> {
    if (!payload.phone?.trim()) {
      throw new Error("Phone is required");
    }

    try {
      return await this.authRepository.sendPhoneOtp({
        phone: payload.phone.trim(),
      });
    } catch (error: unknown) {
      rethrowAuthError(error, "Unable to send OTP.");
    }
  }

  async verifyPhoneOtp(
    payload: VerifyPhoneOtpDTO
  ): Promise<AuthActionResultDTO> {
    if (!payload.phone?.trim()) {
      throw new Error("Phone is required");
    }
    if (!payload.code?.trim()) {
      throw new Error("OTP code is required");
    }

    try {
      return await this.authRepository.verifyPhoneOtp({
        phone: payload.phone.trim(),
        code: payload.code.trim(),
      });
    } catch (error: unknown) {
      rethrowAuthError(error, "Unable to verify phone OTP.");
    }
  }

  async sendEmailVerification(
    payload: SendEmailVerificationDTO
  ): Promise<AuthActionResultDTO> {
    if (!payload.email?.trim() || !isEmail(payload.email)) {
      throw new Error("Valid email is required");
    }

    try {
      return await this.authRepository.sendEmailVerification({
        email: payload.email.trim().toLowerCase(),
      });
    } catch (error: unknown) {
      rethrowAuthError(error, "Unable to send email verification.");
    }
  }

  async verifyEmailToken(
    payload: VerifyEmailTokenDTO
  ): Promise<AuthActionResultDTO> {
    if (!payload.email?.trim() || !isEmail(payload.email)) {
      throw new Error("Valid email is required");
    }
    if (!payload.token?.trim()) {
      throw new Error("Verification token is required");
    }

    try {
      return await this.authRepository.verifyEmailToken({
        email: payload.email.trim().toLowerCase(),
        token: payload.token.trim(),
      });
    } catch (error: unknown) {
      rethrowAuthError(error, "Unable to verify email.");
    }
  }

  async updateDateOfBirth(payload: UpdateDateOfBirthDTO): Promise<User> {
    if (!payload.dateOfBirth?.trim()) {
      throw new Error("Date of birth is required");
    }

    try {
      return await this.authRepository.updateDateOfBirth({
        dateOfBirth: payload.dateOfBirth.trim(),
      });
    } catch (error: unknown) {
      rethrowAuthError(error, "Unable to update date of birth.");
    }
  }
}
