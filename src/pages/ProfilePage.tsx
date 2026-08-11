import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/core/presentation/hooks/useAuth";

function formatDisplayDob(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    user,
    updateDateOfBirth,
    isLoading,
    error,
    clearError,
    logout,
  } = useAuth();

  const savedDob = user?.dateOfBirth?.slice(0, 10) || "";
  const hasDob = Boolean(savedDob);

  const [isEditingDob, setIsEditingDob] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState(savedDob);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setDateOfBirth(savedDob);
    if (savedDob) {
      setIsEditingDob(false);
    }
  }, [savedDob]);

  const showDobForm = !hasDob || isEditingDob;

  const handleSaveDob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setSuccess(null);
    clearError();

    try {
      await updateDateOfBirth({ dateOfBirth: dateOfBirth.trim() });
      setSuccess(t("profile.dobSaved"));
      setIsEditingDob(false);
    } catch (err: unknown) {
      setLocalError(
        err instanceof Error ? err.message : t("profile.dobError")
      );
    }
  };

  const handleCancelEdit = () => {
    setDateOfBirth(savedDob);
    setLocalError(null);
    setSuccess(null);
    clearError();
    setIsEditingDob(false);
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
              <dd className="mt-0.5 font-semibold text-ink">
                {user?.phone || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">{t("profile.email")}</dt>
              <dd className="mt-0.5 font-semibold text-ink">
                {user?.email || "—"}
              </dd>
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink md:text-lg">
                {t("profile.dobTitle")}
              </h2>
              {!hasDob ? (
                <p className="mt-1 text-sm text-ink-muted">
                  {t("profile.dobSetupHint")}
                </p>
              ) : null}
            </div>
            {hasDob && !isEditingDob ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 shrink-0 md:min-h-12"
                onClick={() => {
                  setSuccess(null);
                  setLocalError(null);
                  clearError();
                  setIsEditingDob(true);
                }}
              >
                {t("profile.editDob")}
              </Button>
            ) : null}
          </div>

          {hasDob && !isEditingDob ? (
            <div className="mt-4 rounded-2xl bg-surface-muted px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {t("profile.dobSavedLabel")}
              </p>
              <p className="mt-1 text-base font-semibold text-ink md:text-lg">
                {formatDisplayDob(savedDob, i18n.language)}
              </p>
              {success ? (
                <p className="mt-2 text-sm text-success">{success}</p>
              ) : null}
            </div>
          ) : null}

          {showDobForm ? (
            <form className="mt-4 space-y-3" onSubmit={handleSaveDob}>
              <label className="block text-sm font-medium text-ink">
                {hasDob ? t("profile.dobEditLabel") : t("profile.dobSetupLabel")}
                <input
                  type="date"
                  className="mt-1.5 min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 md:min-h-12"
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  required
                />
              </label>
              {(localError || error) && (
                <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {localError || error}
                </p>
              )}
              {success && !hasDob ? (
                <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  {success}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  className="min-h-11 md:min-h-12"
                  isLoading={isLoading}
                >
                  {hasDob ? t("profile.updateDob") : t("profile.saveDob")}
                </Button>
                {hasDob ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11 md:min-h-12"
                    onClick={handleCancelEdit}
                  >
                    {t("common.cancel")}
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}
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
