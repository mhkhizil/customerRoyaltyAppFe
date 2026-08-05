import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
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
import type { User } from "../../domain/entities/User";
import type { IAuthService } from "../../domain/services/IAuthService";
import container from "../../infrastructure/di/container";
import { tokenCookies } from "@/lib/cookies";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: ClientLoginDTO) => Promise<void>;
  register: (payload: RegisterClientDTO) => Promise<AuthActionResultDTO>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  updateUser: (updatedUser: User) => void;
  forgotPassword: (payload: ForgotPasswordDTO) => Promise<AuthActionResultDTO>;
  resetPassword: (payload: ResetPasswordDTO) => Promise<AuthActionResultDTO>;
  sendPhoneOtp: (payload: SendPhoneOtpDTO) => Promise<AuthActionResultDTO>;
  verifyPhoneOtp: (payload: VerifyPhoneOtpDTO) => Promise<AuthActionResultDTO>;
  sendEmailVerification: (
    payload: SendEmailVerificationDTO
  ) => Promise<AuthActionResultDTO>;
  verifyEmailToken: (
    payload: VerifyEmailTokenDTO
  ) => Promise<AuthActionResultDTO>;
  updateDateOfBirth: (payload: UpdateDateOfBirthDTO) => Promise<User>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  service?: IAuthService;
}

export function AuthProvider({ children, service }: AuthProviderProps) {
  const authService = service || container.resolve<IAuthService>("authService");

  const [user, setUser] = useState<User | null>(null);
  /** Initial session check only — must not unmount authenticated routes. */
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err: unknown) {
        console.error("Auth check failed:", err);
      } finally {
        setIsBootstrapping(false);
      }
    };

    void checkAuth();
  }, [authService]);

  const clearError = () => setError(null);

  const withLoading = async <T,>(
    action: () => Promise<T>,
    fallbackMessage: string
  ): Promise<T> => {
    setIsActionLoading(true);
    setError(null);
    try {
      return await action();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : fallbackMessage;
      setError(message);
      throw err instanceof Error ? err : new Error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const login = async (payload: ClientLoginDTO) => {
    await withLoading(async () => {
      const loggedInUser = await authService.login(payload);
      setUser(loggedInUser);
    }, "An unexpected error occurred during login");
  };

  const register = async (payload: RegisterClientDTO) =>
    withLoading(
      () => authService.register(payload),
      "An unexpected error occurred during registration"
    );

  const logout = async () => {
    setIsActionLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } catch (err: unknown) {
      console.error("Logout error:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    return currentUser;
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    tokenCookies.setUser(JSON.stringify(updatedUser));
  };

  const forgotPassword = async (payload: ForgotPasswordDTO) =>
    withLoading(
      () => authService.forgotPassword(payload),
      "Unable to send password reset code"
    );

  const resetPassword = async (payload: ResetPasswordDTO) =>
    withLoading(
      () => authService.resetPassword(payload),
      "Unable to reset password"
    );

  const sendPhoneOtp = async (payload: SendPhoneOtpDTO) =>
    withLoading(() => authService.sendPhoneOtp(payload), "Unable to send OTP");

  const verifyPhoneOtp = async (payload: VerifyPhoneOtpDTO) =>
    withLoading(
      () => authService.verifyPhoneOtp(payload),
      "Unable to verify phone OTP"
    );

  const sendEmailVerification = async (payload: SendEmailVerificationDTO) =>
    withLoading(
      () => authService.sendEmailVerification(payload),
      "Unable to send email verification"
    );

  const verifyEmailToken = async (payload: VerifyEmailTokenDTO) =>
    withLoading(
      () => authService.verifyEmailToken(payload),
      "Unable to verify email"
    );

  const updateDateOfBirth = async (payload: UpdateDateOfBirthDTO) =>
    withLoading(async () => {
      const updated = await authService.updateDateOfBirth(payload);
      setUser(updated);
      return updated;
    }, "Unable to update date of birth");

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: isBootstrapping || isActionLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    forgotPassword,
    resetPassword,
    sendPhoneOtp,
    verifyPhoneOtp,
    sendEmailVerification,
    verifyEmailToken,
    updateDateOfBirth,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Provider + hook in one module (same pattern as existing codebase)
// eslint-disable-next-line react-refresh/only-export-components -- useAuth + AuthProvider
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
