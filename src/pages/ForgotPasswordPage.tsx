import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  AuthError,
  AuthLayout,
  authInputClassName,
} from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";

function isEmail(value: string): boolean {
  return value.includes("@");
}

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { forgotPassword, isLoading, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    const trimmed = identifier.trim();
    if (!trimmed) {
      setLocalError(t("auth.forgotPassword.missingIdentifier"));
      return;
    }

    try {
      if (isEmail(trimmed)) {
        await forgotPassword({ email: trimmed });
      } else {
        await forgotPassword({ phone: trimmed });
      }
      navigate("/reset-password", {
        replace: true,
        state: isEmail(trimmed) ? { email: trimmed } : { phone: trimmed },
      });
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error
          ? err.message
          : t("auth.forgotPassword.errorFallback")
      );
    }
  };

  return (
    <AuthLayout
      title={t("auth.forgotPassword.title")}
      subtitle={t("auth.forgotPassword.subtitle")}
      footer={
        <Link className="font-semibold text-brand" to="/login">
          {t("auth.common.backToLogin")}
        </Link>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          className={authInputClassName}
          placeholder={t("auth.forgotPassword.identifierPlaceholder")}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
          required
        />
        <AuthError message={localError || error} />
        <Button type="submit" fullWidth isLoading={isLoading}>
          {isLoading
            ? t("auth.forgotPassword.submitting")
            : t("auth.forgotPassword.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
