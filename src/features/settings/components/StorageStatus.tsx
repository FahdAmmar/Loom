import { HardDrive, Wifi, WifiOff } from "lucide-react";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useStorageEstimate } from "@/hooks/useStorageEstimate";
import { useT } from "@/i18n/useT";
import { formatBytes } from "@/lib/formatBytes";
import { useSettingsStore } from "@/stores/useSettingsStore";

const BACKUP_STALE_DAYS = 30;
const STORAGE_WARN_PERCENT = 80;
const STORAGE_CRITICAL_PERCENT = 95;
const MS_PER_DAY = 86_400_000;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / MS_PER_DAY);
}

export function StorageStatus() {
  const t = useT();
  const isOnline = useOnlineStatus();
  const storage = useStorageEstimate();
  const lastBackupAt = useSettingsStore((s) => s.lastBackupAt);
  const direction = useSettingsStore((s) => s.direction);

  const usedPercent = storage ? Math.min(100, (storage.usage / storage.quota) * 100) : 0;
  const barColor =
    usedPercent >= STORAGE_CRITICAL_PERCENT
      ? "bg-destructive"
      : usedPercent >= STORAGE_WARN_PERCENT
        ? "bg-brand-gold"
        : "bg-brand-mint";
  const isStale = lastBackupAt === null || daysSince(lastBackupAt) >= BACKUP_STALE_DAYS;
  const locale = direction === "rtl" ? "ar" : "en";

  return (
    <section className="border-border mt-8 border-t pt-8">
      <h2 className="text-foreground text-sm font-medium">{t("status.title")}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{t("status.help")}</p>

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-6">
        <dt className="text-muted-foreground flex items-center gap-2">
          {isOnline ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
          {t("status.connection")}
        </dt>
        <dd>{isOnline ? t("status.online") : t("status.offline")}</dd>

        <dt className="text-muted-foreground flex items-center gap-2">
          <HardDrive className="size-3.5" />
          {t("status.storage")}
        </dt>
        <dd>
          {storage ? (
            <div className="flex flex-col gap-1.5">
              <span>
                {t("status.storageUsed", {
                  used: formatBytes(storage.usage),
                  total: formatBytes(storage.quota),
                })}
              </span>
              <div
                aria-hidden="true"
                className="bg-muted h-1.5 w-full max-w-xs overflow-hidden rounded-full"
              >
                <div
                  className={`h-full rounded-full ${barColor}`}
                  style={{ width: `${Math.max(usedPercent, 1)}%` }}
                />
              </div>
            </div>
          ) : (
            t("status.unknown")
          )}
        </dd>

        <dt className="text-muted-foreground">{t("status.lastBackup")}</dt>
        <dd>
          {lastBackupAt
            ? new Date(lastBackupAt).toLocaleDateString(locale, { dateStyle: "medium" })
            : t("status.never")}
          {isStale && <span className="text-brand-gold ms-2">{t("status.backupAdvice")}</span>}
        </dd>
      </dl>
    </section>
  );
}
