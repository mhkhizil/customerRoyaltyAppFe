import type {
  AuthActionResultDTO,
  AuthTokensDTO,
  ClientLoginDTO,
  ForgotPasswordDTO,
  LogoutResultDTO,
  RegisterClientDTO,
  ResetPasswordDTO,
  SendEmailVerificationDTO,
  SendPhoneOtpDTO,
  UpdateDateOfBirthDTO,
  VerifyEmailTokenDTO,
  VerifyPhoneOtpDTO,
} from "../../application/dtos/AuthDTO";
import type { User } from "../entities/User";

export interface IAuthRepository {
  register(payload: RegisterClientDTO): Promise<AuthActionResultDTO>;
  login(payload: ClientLoginDTO): Promise<{ user: User; tokens: AuthTokensDTO }>;
  refreshSession(): Promise<boolean>;
  logout(): Promise<LogoutResultDTO | null>;
  getCurrentUser(): Promise<User | null>;
  forgotPassword(payload: ForgotPasswordDTO): Promise<AuthActionResultDTO>;
  resetPassword(payload: ResetPasswordDTO): Promise<AuthActionResultDTO>;
  sendPhoneOtp(payload: SendPhoneOtpDTO): Promise<AuthActionResultDTO>;
  verifyPhoneOtp(payload: VerifyPhoneOtpDTO): Promise<AuthActionResultDTO>;
  sendEmailVerification(
    payload: SendEmailVerificationDTO
  ): Promise<AuthActionResultDTO>;
  verifyEmailToken(
    payload: VerifyEmailTokenDTO
  ): Promise<AuthActionResultDTO>;
  updateDateOfBirth(payload: UpdateDateOfBirthDTO): Promise<User>;
}
