import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

/**
 * Placeholder rewards surface for the customer loyalty app.
 * Wire to rewards/catalog APIs when the backend contract is ready.
 */
export function RewardsPage() {
  const { t } = useTranslation();

  return (
    <section className="w-full space-y-5 pb-4 md:space-y-6 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {t("rewards.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-muted md:text-base">
          {t("rewards.subtitle")}
        </p>
      </header>

      <div className="rounded-2xl border border-dashed border-line bg-surface p-6 text-center md:p-10">
        <p className="text-base font-semibold text-ink md:text-lg">
          {t("rewards.emptyTitle")}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted md:text-base">
          {t("rewards.emptyText")}
        </p>
        <Link className="mt-5 inline-block" to="/home">
          <Button variant="secondary" className="min-h-11 md:min-h-12">
            {t("rewards.backHome")}
          </Button>
        </Link>
      </div>
    </section>
  );
}
