/**
 * Client auth DTOs — shapes match POST/GET /api/v1/client/auth/* contracts.
 */

export type RegisterClientDTO = {
  nickname: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/** Exactly one of phone or email must be provided with password. */
export type ClientLoginDTO =
  | { phone: string; password: string; email?: never }
  | { email: string; password: string; phone?: never };

export type ForgotPasswordDTO =
  | { phone: string; email?: never }
  | { email: string; phone?: never };

export type ResetPasswordDTO = {
  code: string;
  newPassword: string;
  confirmNewPassword: string;
} & ({ phone: string; email?: never } | { email: string; phone?: never });

export type SendPhoneOtpDTO = {
  phone: string;
};

export type VerifyPhoneOtpDTO = {
  phone: string;
  code: string;
};

export type SendEmailVerificationDTO = {
  email: string;
};

export type VerifyEmailTokenDTO = {
  email: string;
  token: string;
};

export type UpdateDateOfBirthDTO = {
  dateOfBirth: string;
};

export type AuthActionResultDTO = {
  success: boolean;
  action?: string;
};

export type ClientAuthUserDTO = {
  id: string;
  nickname: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  phoneVerifiedAt?: string | null;
  emailVerifiedAt?: string | null;
  dateOfBirth?: string | null;
  referralCode?: string | null;
  adminAccess?: {
    role?: string;
    isRootAdmin?: boolean;
    permissions?: string[];
  } | null;
  verificationTags?: Array<{
    type?: string;
    label?: string;
    value?: string | null;
    status?: string;
    isVerified?: boolean;
    canVerifyFromProfile?: boolean;
    action?: string | null;
    verifiedAt?: string | null;
  }>;
};

export type ClientLoginResponseDTO = {
  user: ClientAuthUserDTO;
  tokens: {
    accessToken: string;
  };
};

export type ApiEnvelopeDTO<T> = {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
  listingDisplayTimezone?: string;
  timestamp?: string;
};
