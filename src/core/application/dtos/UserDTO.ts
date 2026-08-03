/**
 * Data Transfer Objects for User-related operations
 * These are used to pass data between layers and with external systems
 */

import { User } from "../../domain/entities/User";

/**
 * Object for user registration (admin only)
 */
export interface RegisterUserDTO {
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "STAFF";
  password: string;
}

/**
 * Object for user login
 */
export interface LoginUserDTO {
  email: string;
  password: string;
}

/**
 * Object for user response
 * Excludes sensitive data
 */
export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "CLIENT" | "ADMIN" | "STAFF";
  profileImageUrl?: string;
  createdDate?: string;
  updatedDate?: string;
}

/**
 * Object for user list request parameters
 */
export interface UserListRequestDTO {
  take: number;
  skip: number;
  name?: string;
  email?: string;
  phone?: string;
  role?: "ADMIN" | "STAFF";
  sortBy?: "name" | "email" | "phone" | "role" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Object for user list response
 */
export interface UserListResponseDTO {
  users: UserResponseDTO[];
  totalCounts: number;
}

/**
 * Domain response DTO that uses User entities (for internal service layer)
 */
export interface UserDomainListResponseDTO {
  users: User[];
  totalCounts: number;
}

/**
 * Object for user update request
 */
export interface UpdateUserDTO {
  name?: string;
  email?: string;
  phone?: string;
  role?: "ADMIN" | "STAFF";
}

/**
 * Object for profile update request
 */
export interface UpdateProfileDTO {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * Object for user creation request
 */
export interface CreateUserDTO {
  name: string;
  email: string;
  phone?: string;
  role?: "ADMIN" | "STAFF";
}

// Utility functions for DTO conversion
export class UserDTOMapper {
  static toResponseDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      name: user.nickname || user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
    };
  }

  static toResponseDTOList(users: User[]): UserResponseDTO[] {
    return users.map((user) => this.toResponseDTO(user));
  }

  static toDomainListResponseDTO(
    users: User[],
    totalCounts: number
  ): UserDomainListResponseDTO {
    return {
      users,
      totalCounts,
    };
  }

  static fromCreateDTO(dto: CreateUserDTO): {
    nickname: string;
    email: string;
    phone?: string;
    role: "ADMIN" | "STAFF";
    profileImageUrl?: string;
  } {
    return {
      nickname: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role || "STAFF",
      profileImageUrl: undefined,
    };
  }

  static fromUpdateDTO(dto: UpdateUserDTO): Partial<{
    nickname: string;
    email: string;
    phone: string;
    role: "ADMIN" | "STAFF";
  }> {
    const updateData: Partial<{
      nickname: string;
      email: string;
      phone: string;
      role: "ADMIN" | "STAFF";
    }> = {};

    if (dto.name !== undefined) updateData.nickname = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.role !== undefined) updateData.role = dto.role;

    return updateData;
  }
}
