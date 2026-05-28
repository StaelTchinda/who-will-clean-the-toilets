import { useTranslation } from "react-i18next";
import type { Partner, ProgressRow, SessionRow } from "@/lib/session";

export function WaitingForFinish({
  session,
  partner,
  otherProgress,
  totalQuestions,
}: {
  session: SessionRow;
  partner: Partner;
  otherProgress?: ProgressRow;
  totalQuestions: number;
}) {
  const { t } = useTranslation("session");
  const otherName = partner === "a" ? session.partner_b_name : session.partner_a_name;
  const pct = otherProgress
    ? Math.round(
        ((otherProgress.current_index || 0) / Math.max(1, otherProgress.total || totalQuestions)) *
          100,
      )
    : 0;
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-8 px-6 text-center md:justify-start md:pt-[15vh]">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          {t("waitingFinish.done")}
        </p>
        <h1 className="text-balance font-serif text-4xl leading-tight">
          {t("waitingFinish.title", { name: otherName })}
        </h1>
        <div className="w-full">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("waitingFinish.progress", { name: otherName, pct })}
          </p>
        </div>
        <p className="max-w-xs text-balance text-sm text-muted-foreground">
          {t("waitingFinish.autoReveal")}
        </p>
      </div>
    </main>
  );
}
