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

type VerifyPhoneState = {
  phone?: string;
  email?: string;
};

export function VerifyPhonePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as VerifyPhoneState | null) ?? {};
  const { sendPhoneOtp, verifyPhoneOtp, isLoading, error, clearError } =
    useAuth();

  const [phone, setPhone] = useState(state.phone || "");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSendOtp = async () => {
    setLocalError(null);
    setSuccessMessage(null);
    clearError();
    try {
      await sendPhoneOtp({ phone: phone.trim() });
      setSuccessMessage(t("auth.verifyPhone.otpSent"));
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : t("auth.verifyPhone.sendError")
      );
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);
    clearError();

    try {
      await verifyPhoneOtp({ phone: phone.trim(), code: code.trim() });
      setSuccessMessage(t("auth.verifyPhone.success"));
      navigate("/verify-email", {
        replace: true,
        state: { email: state.email, phone: phone.trim() },
      });
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : t("auth.verifyPhone.verifyError")
      );
    }
  };

  return (
    <AuthLayout
      title={t("auth.verifyPhone.title")}
      subtitle={t("auth.verifyPhone.subtitle")}
      footer={
        <div className="space-y-2">
          <p>
            <Link className="font-semibold text-brand" to="/verify-email">
              {t("auth.verifyPhone.skipToEmail")}
            </Link>
          </p>
          <Link className="font-semibold text-brand" to="/login">
            {t("auth.common.backToLogin")}
          </Link>
        </div>
      }
    >
      <form className="space-y-3" onSubmit={handleVerify}>
        <input
          className={authInputClassName}
          placeholder={t("auth.verifyPhone.phonePlaceholder")}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          inputMode="tel"
          required
        />
        <input
          className={authInputClassName}
          placeholder={t("auth.verifyPhone.codePlaceholder")}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          inputMode="numeric"
          autoComplete="one-time-code"
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
              void handleSendOtp();
            }}
          >
            {t("auth.verifyPhone.sendOtp")}
          </Button>
          <Button type="submit" fullWidth isLoading={isLoading}>
            {t("auth.verifyPhone.verify")}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
