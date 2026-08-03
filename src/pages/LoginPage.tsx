import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
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

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated, isLoading, error, clearError } =
    useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from
    ?.pathname;

  if (isAuthenticated && user) {
    return <Navigate to={from || "/home"} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    clearError();

    const trimmed = identifier.trim();
    if (!trimmed || !password) {
      setLocalError(t("auth.login.missingFields"));
      return;
    }

    try {
      if (isEmail(trimmed)) {
        await login({ email: trimmed, password });
      } else {
        await login({ phone: trimmed, password });
      }
      navigate(from || "/home", { replace: true });
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : t("auth.login.errorFallback")
      );
    }
  };

  return (
    <AuthLayout
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <div className="space-y-2">
          <p>
            {t("auth.login.noAccount")}{" "}
            <Link className="font-semibold text-brand" to="/register">
              {t("auth.login.registerLink")}
            </Link>
          </p>
          <p>
            <Link className="font-semibold text-brand" to="/forgot-password">
              {t("auth.login.forgotPasswordLink")}
            </Link>
          </p>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-ink"
            htmlFor="identifier"
          >
            {t("auth.login.identifierLabel")}
          </label>
          <input
            id="identifier"
            className={authInputClassName}
            type="text"
            autoComplete="username"
            inputMode="email"
            placeholder={t("auth.login.identifierPlaceholder")}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium text-ink"
            htmlFor="password"
          >
            {t("auth.login.passwordLabel")}
          </label>
          <div className="relative">
            <input
              id="password"
              className={`${authInputClassName} pr-16`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("auth.login.passwordPlaceholder")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 min-h-11 -translate-y-1/2 rounded-md px-2 text-xs font-semibold text-ink-muted"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword
                ? t("auth.common.hidePassword")
                : t("auth.common.showPassword")}
            </button>
          </div>
        </div>

        <AuthError message={localError || error} />

        <Button type="submit" fullWidth isLoading={isLoading}>
          {isLoading ? t("auth.login.submitting") : t("auth.login.submit")}
        </Button>
      </form>
    </AuthLayout>
  );
}
