import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AuthError,
  AuthLayout,
  authInputClassName,
} from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    if (password !== confirmPassword) {
      setLocalError(t("auth.register.passwordMismatch"));
      return;
    }

    try {
      await register({
        nickname: nickname.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
      navigate("/verify-phone", {
        replace: true,
        state: { phone: phone.trim(), email: email.trim() },
      });
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : t("auth.register.errorFallback")
      );
    }
  };

  return (
    <AuthLayout
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <p>
          {t("auth.register.hasAccount")}{" "}
          <Link className="font-semibold text-brand" to="/login">
            {t("auth.register.loginLink")}
          </Link>
        </p>
      }
    >
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          className={authInputClassName}
          placeholder={t("auth.register.nicknamePlaceholder")}
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          autoComplete="nickname"
          required
        />
        <input
          className={authInputClassName}
          placeholder={t("auth.register.phonePlaceholder")}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          inputMode="tel"
          required
        />
        <input
          className={authInputClassName}
          type="email"
          placeholder={t("auth.register.emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <input
          className={authInputClassName}
          type="password"
          placeholder={t("auth.register.passwordPlaceholder")}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          required
        />
        <input
          className={authInputClassName}
          type="password"
          placeholder={t("auth.register.confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          required
        />

        <AuthError message={localError || error} />

        <Button type="submit" fullWidth isLoading={isLoading}>
          {isLoading ? t("auth.register.submitting") : t("auth.register.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
