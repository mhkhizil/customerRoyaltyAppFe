import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";

export function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    updateDateOfBirth,
    isLoading,
    error,
    clearError,
    logout,
  } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState(
    user?.dateOfBirth?.slice(0, 10) || ""
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSaveDob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSuccess(null);
    clearError();

    try {
      await updateDateOfBirth({ dateOfBirth: dateOfBirth.trim() });
      setSuccess(t("profile.dobSaved"));
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : t("profile.dobError")
      );
    }
  };

  return (
    <section className="w-full space-y-5 pb-4 md:space-y-6 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {t("profile.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted md:text-base">
          {t("profile.subtitle")}
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 md:items-start md:gap-6">
      <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5 md:p-6">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-muted">{t("profile.nickname")}</dt>
            <dd className="mt-0.5 font-semibold text-ink">
              {user?.nickname || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("profile.phone")}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{user?.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("profile.email")}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{user?.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{t("profile.referralCode")}</dt>
            <dd className="mt-0.5 font-semibold text-ink">
              {user?.referralCode || "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {!user?.isPhoneVerified ? (
            <Link
              className="font-semibold text-brand"
              to="/verify-phone"
              state={{ phone: user?.phone, email: user?.email }}
            >
              {t("profile.verifyPhone")}
            </Link>
          ) : (
            <span className="text-success">{t("profile.phoneVerified")}</span>
          )}
          {!user?.isEmailVerified ? (
            <Link
              className="font-semibold text-brand"
              to="/verify-email"
              state={{ email: user?.email }}
            >
              {t("profile.verifyEmail")}
            </Link>
          ) : (
            <span className="text-success">{t("profile.emailVerified")}</span>
          )}
        </div>
      </article>

      <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5 md:p-6">
        <h2 className="text-base font-semibold text-ink md:text-lg">
          {t("profile.dobTitle")}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t("profile.dobHint")}</p>
        <form className="mt-4 space-y-3" onSubmit={handleSaveDob}>
          <input
            type="date"
            className="min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 md:min-h-12"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            required
          />
          {(localError || error) && (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {localError || error}
            </p>
          )}
          {success ? (
            <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              {success}
            </p>
          ) : null}
          <Button
            type="submit"
            className="min-h-11 md:min-h-12"
            isLoading={isLoading}
          >
            {t("profile.saveDob")}
          </Button>
        </form>
      </article>
      </div>

      <Button
        variant="secondary"
        className="min-h-11 w-full md:min-h-12 md:max-w-sm"
        onClick={() => {
          void logout().then(() => navigate("/login", { replace: true }));
        }}
      >
        {t("shell.logout")}
      </Button>
    </section>
  );
}
