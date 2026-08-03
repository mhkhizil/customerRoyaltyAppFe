import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <section className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-8 sm:py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <Link
            to="/login"
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-lg font-bold text-white"
            aria-label={t("shell.brandTitle")}
          >
            {t("shell.brandTitle").slice(0, 1)}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
        {children}
        {footer ? <div className="mt-6 text-center text-sm text-ink-muted">{footer}</div> : null}
      </div>
    </section>
  );
}

export const authInputClassName =
  "min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

export function AuthSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
      {message}
    </p>
  );
}
