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
  const otherName =
    partner === "a" ? session.partner_b_name : session.partner_a_name;
  const pct = otherProgress
    ? Math.round(
        ((otherProgress.current_index || 0) /
          Math.max(1, otherProgress.total || totalQuestions)) *
          100,
      )
    : 0;
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-8 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          Tu as terminé —
        </p>
        <h1 className="text-balance font-serif text-4xl leading-tight">
          On attend que {otherName} finisse.
        </h1>
        <div className="w-full">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {otherName} est à {pct}%
          </p>
        </div>
        <p className="max-w-xs text-balance text-sm text-muted-foreground">
          La page des résultats apparaîtra automatiquement quand vous aurez
          tous les deux fini.
        </p>
      </div>
    </main>
  );
}
