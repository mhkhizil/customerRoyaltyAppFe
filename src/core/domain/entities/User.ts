export type UserRole = "CLIENT" | "ADMIN" | "STAFF";

export type VerificationTagType = "PHONE" | "EMAIL" | string;

export type VerificationTagStatus = "VERIFIED" | "PENDING" | "UNVERIFIED" | string;

export type VerificationTag = {
  type: VerificationTagType;
  label: string;
  value?: string | null;
  status: VerificationTagStatus;
  isVerified: boolean;
  canVerifyFromProfile: boolean;
  action?: string | null;
  verifiedAt?: string | null;
};

export type AdminAccess = {
  role: string;
  isRootAdmin: boolean;
  permissions: string[];
};

/**
 * Authenticated client/user domain model.
 * Matches GET /api/v1/client/auth/me and login user payload.
 */
export class User {
  id!: string;
  nickname!: string;
  email!: string;
  phone!: string;
  avatar?: string | null;
  isPhoneVerified!: boolean;
  isEmailVerified!: boolean;
  phoneVerifiedAt?: string | null;
  emailVerifiedAt?: string | null;
  dateOfBirth?: string | null;
  referralCode?: string | null;
  adminAccess?: AdminAccess | null;
  verificationTags!: VerificationTag[];
  role!: UserRole;
  /** Convenience mirrors from adminAccess for permission helpers */
  adminRoleName?: string;
  permissions?: string[];
  profileImageUrl?: string;

  [key: string]: unknown;

  constructor(data: {
    id: string;
    nickname: string;
    email: string;
    phone: string;
    avatar?: string | null;
    isPhoneVerified?: boolean;
    isEmailVerified?: boolean;
    phoneVerifiedAt?: string | null;
    emailVerifiedAt?: string | null;
    dateOfBirth?: string | null;
    referralCode?: string | null;
    adminAccess?: AdminAccess | null;
    verificationTags?: VerificationTag[];
    role?: UserRole;
    adminRoleName?: string;
    permissions?: string[];
    profileImageUrl?: string;
  }) {
    this.id = data.id;
    this.nickname = data.nickname;
    this.email = data.email;
    this.phone = data.phone;
    this.avatar = data.avatar ?? null;
    this.isPhoneVerified = data.isPhoneVerified ?? false;
    this.isEmailVerified = data.isEmailVerified ?? false;
    this.phoneVerifiedAt = data.phoneVerifiedAt ?? null;
    this.emailVerifiedAt = data.emailVerifiedAt ?? null;
    this.dateOfBirth = data.dateOfBirth ?? null;
    this.referralCode = data.referralCode ?? null;
    this.adminAccess = data.adminAccess ?? null;
    this.verificationTags = data.verificationTags ?? [];
    this.role = data.role ?? (data.adminAccess ? "ADMIN" : "CLIENT");
    this.adminRoleName = data.adminRoleName ?? data.adminAccess?.role;
    this.permissions =
      data.permissions ?? data.adminAccess?.permissions ?? [];
    this.profileImageUrl = data.profileImageUrl ?? data.avatar ?? undefined;
  }

  /** Display name used across the shell */
  get name(): string {
    return this.nickname || this.email || this.phone || "";
  }

  isValid(): boolean {
    return !!this.id && (!!this.email || !!this.phone);
  }

  isAdmin(): boolean {
    return this.role === "ADMIN" || !!this.adminAccess;
  }

  isClient(): boolean {
    return this.role === "CLIENT" && !this.adminAccess;
  }
}
