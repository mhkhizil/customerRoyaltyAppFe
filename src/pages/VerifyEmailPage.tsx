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

type VerifyEmailState = {
  email?: string;
};

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as VerifyEmailState | null) ?? {};
  const {
    sendEmailVerification,
    verifyEmailToken,
    isLoading,
    error,
    clearError,
  } = useAuth();

  const [email, setEmail] = useState(state.email || "");
  const [token, setToken] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSend = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
    try {
      await sendEmailVerification({ email: email.trim() });
      setSuccessMessage(t("auth.verifyEmail.tokenSent"));
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : t("auth.verifyEmail.sendError")
      );
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    try {
      await verifyEmailToken({
        email: email.trim(),
        token: token.trim(),
      });
      setSuccessMessage(t("auth.verifyEmail.success"));
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : t("auth.verifyEmail.verifyError")
      );
    }
  };

  return (
    <AuthLayout
      title={t("auth.verifyEmail.title")}
      subtitle={t("auth.verifyEmail.subtitle")}
      footer={
        <Link className="font-semibold text-brand" to="/login">
          {t("auth.common.backToLogin")}
        </Link>
      }
    >
      <form className="space-y-3" onSubmit={handleVerify}>
        <input
          className={authInputClassName}
          type="email"
          placeholder={t("auth.verifyEmail.emailPlaceholder")}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
        <input
          className={authInputClassName}
          placeholder={t("auth.verifyEmail.tokenPlaceholder")}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
        />
        <AuthError message={localError || error} />
        <AuthSuccess message={successMessage} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            isLoading={isLoading}
            onClick={() => {
              void handleSend();
            }}
          >
            {t("auth.verifyEmail.sendToken")}
          </Button>
          <Button type="submit" fullWidth isLoading={isLoading}>
            {t("auth.verifyEmail.verify")}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
