import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { Partner, SessionRow } from "@/lib/session";

export function WaitingForJoin({
  session,
  code,
  partner,
}: {
  session: SessionRow;
  code: string;
  partner: Partner;
}) {
  const { t } = useTranslation("session");
  const myName = partner === "a" ? session.partner_a_name : session.partner_b_name;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-8 px-6 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-primary">
          {t("waiting.greeting", { name: myName })}
        </p>
        <h1 className="text-balance font-serif text-4xl leading-tight">
          {t("waiting.title")}
        </h1>
        <button
          onClick={copy}
          className="group relative rounded-3xl border border-border bg-card px-10 py-6 transition hover:border-primary"
        >
          <span className="font-serif text-6xl tracking-[0.3em] text-foreground">
            {code}
          </span>
          <span className="mt-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary">
            {copied ? t("waiting.copied") : t("waiting.tapToCopy")}
          </span>
        </button>
        <p className="text-balance text-sm text-muted-foreground">
          {t("waiting.instructions", { code })}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative h-2 w-2 rounded-full bg-primary" />
          </span>
          {t("waiting.waiting")}
        </div>
      </div>
    </main>
  );
}
