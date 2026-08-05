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
} from "../../application/dtos/AuthDTO";
import type { User } from "../entities/User";

/**
 * Client authentication use cases.
 */
export interface IAuthService {
  register(payload: RegisterClientDTO): Promise<AuthActionResultDTO>;
  login(payload: ClientLoginDTO): Promise<User>;
  refreshSession(): Promise<boolean>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
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
