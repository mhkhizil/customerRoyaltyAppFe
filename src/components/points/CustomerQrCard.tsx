import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import type { PointQrToken } from "@/core/domain/entities/PointQrToken";

type CustomerQrCardProps = {
  qrToken: PointQrToken | null;
  isLoading: boolean;
  onRefresh: () => void;
};

function formatExpiry(expiresAt: string, locale: string): string {
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CustomerQrCard({
  qrToken,
  isLoading,
  onRefresh,
}: CustomerQrCardProps) {
  const { t, i18n } = useTranslation();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const tokenValue = qrToken?.qrToken ?? "";

  useEffect(() => {
    let cancelled = false;

    if (!tokenValue) {
      setDataUrl(null);
      setQrError(null);
      return;
    }

    void QRCode.toDataURL(tokenValue, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url);
          setQrError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl(null);
          setQrError("Could not render QR code.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tokenValue]);

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">{t("points.qrTitle")}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t("points.qrSubtitle")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-11 shrink-0"
          isLoading={isLoading}
          onClick={onRefresh}
        >
          {t("points.refreshQr")}
        </Button>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <div className="flex h-60 w-60 items-center justify-center rounded-2xl border border-line bg-white p-3">
          {isLoading && !dataUrl ? (
            <p className="text-sm text-ink-muted">{t("common.loading")}</p>
          ) : dataUrl ? (
            <img
              key={tokenValue}
              src={dataUrl}
              alt={t("points.qrAlt")}
              className="h-full w-full object-contain"
            />
          ) : (
            <p className="px-4 text-center text-sm text-ink-muted">
              {qrError || t("points.qrUnavailable")}
            </p>
          )}
        </div>

        {qrToken ? (
          <p className="text-center text-xs text-ink-muted">
            {qrToken.isExpired
              ? t("points.qrExpired")
              : t("points.qrExpiresAt", {
                  time: formatExpiry(qrToken.expiresAt, i18n.language),
                })}
          </p>
        ) : null}
      </div>
    </article>
  );
}
