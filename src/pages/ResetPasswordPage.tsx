import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AuthError,
  AuthLayout,
  AuthSuccess,
  authInputClassName,
} from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";

type ResetLocationState = {
  phone?: string;
  email?: string;
};

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as ResetLocationState | null) ?? {};
  const { resetPassword, isLoading, error, clearError } = useAuth();

  const [identifier, setIdentifier] = useState(state.phone || state.email || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    const trimmed = identifier.trim();
    if (!trimmed) {
      setLocalError(t("auth.resetPassword.missingIdentifier"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setLocalError(t("auth.resetPassword.passwordMismatch"));
      return;
    }

    try {
      const payload = trimmed.includes("@")
        ? {
            email: trimmed,
            code: code.trim(),
            newPassword,
            confirmNewPassword,
          }
        : {
            phone: trimmed,
            code: code.trim(),
            newPassword,
            confirmNewPassword,
          };

      await resetPassword(payload);
      setSuccessMessage(t("auth.resetPassword.success"));
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error
          ? err.message
          : t("auth.resetPassword.errorFallback")
      );
    }
  };

  return (
    <AuthLayout
      title={t("auth.resetPassword.title")}
      subtitle={t("auth.resetPassword.subtitle")}
      footer={
        <Link className="font-semibold text-brand" to="/login">
          {t("auth.common.backToLogin")}
        </Link>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className={authInputClassName}
          placeholder={t("auth.resetPassword.identifierPlaceholder")}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
        <input
          className={authInputClassName}
          placeholder={t("auth.resetPassword.codePlaceholder")}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
          required
        />
        <input
          className={authInputClassName}
          type="password"
          placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <input
          className={authInputClassName}
          type="password"
          placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
          value={confirmNewPassword}
          onChange={(event) => setConfirmNewPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <AuthError message={localError || error} />
        <AuthSuccess message={successMessage} />
        <Button type="submit" fullWidth isLoading={isLoading}>
          {isLoading
            ? t("auth.resetPassword.submitting")
            : t("auth.resetPassword.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
