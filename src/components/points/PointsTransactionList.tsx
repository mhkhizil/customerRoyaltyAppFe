import { useTranslation } from "react-i18next";
import type { PointTransaction } from "@/core/domain/entities/PointTransaction";

type PointsTransactionListProps = {
  transactions: PointTransaction[];
  isLoading: boolean;
};

function formatWhen(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDescription(
  description: PointTransaction["description"]
): string | null {
  if (!description) return null;
  if (typeof description === "string") {
    const trimmed = description.trim();
    return trimmed || null;
  }

  const text =
    (typeof description.text === "string" && description.text) ||
    (typeof description.message === "string" && description.message) ||
    (typeof description.label === "string" && description.label);

  return text || null;
}

export function PointsTransactionList({
  transactions,
  isLoading,
}: PointsTransactionListProps) {
  const { t, i18n } = useTranslation();

  return (
    <article className="rounded-2xl border border-line bg-surface p-4 sm:p-5 md:p-6">
      <h2 className="text-lg font-semibold text-ink md:text-xl">
        {t("points.transactionsTitle")}
      </h2>
      <p className="mt-1 text-sm text-ink-muted md:text-base">
        {t("points.transactionsSubtitle")}
      </p>

      {isLoading && transactions.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">{t("common.loading")}</p>
      ) : null}

      {!isLoading && transactions.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-surface-muted px-4 py-6 text-center text-sm text-ink-muted">
          {t("points.transactionsEmpty")}
        </p>
      ) : null}

      {transactions.length > 0 ? (
        <ul className="mt-4 divide-y divide-line">
          {transactions.map((tx) => {
            const description = formatDescription(tx.description);
            const pointsLabel = tx.points > 0 ? `+${tx.points}` : String(tx.points);

            return (
              <li key={tx.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {tx.type || t("points.unknownType")}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {[tx.source, description].filter(Boolean).join(" · ") ||
                      formatWhen(tx.createdAt, i18n.language)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatWhen(tx.createdAt, i18n.language)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={[
                      "text-sm font-bold tabular-nums",
                      tx.isCredit ? "text-success" : "text-ink",
                    ].join(" ")}
                  >
                    {pointsLabel}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {t("points.balanceAfter", { balance: tx.balanceAfter })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </article>
  );
}
