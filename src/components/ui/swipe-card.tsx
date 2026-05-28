import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Answer, AnswerPosition, DomainId } from "@/lib/dataset";
import { DOMAIN_BY_ID } from "@/lib/dataset";
import { iconByName } from "@/lib/icon-map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InputMode } from "@/hooks/use-input-mode";

type Dir = AnswerPosition;
const SWIPE_THRESHOLD = 90;

// Direction → answer mapping. Driven by `answer.position` in the JSON data
// (see src/data/questions.json), so the visual layout and the drag handler
// can't disagree and the data file is the single source of truth.
function mapAnswers(answers: Answer[]): Record<Dir, Answer> {
  const m: Partial<Record<Dir, Answer>> = {};
  for (const a of answers) {
    m[a.position] = a;
  }
  // Surface data bugs loudly in dev: every question must declare exactly one
  // answer per direction. In prod the missing slot would fall through to
  // undefined and crash later inside <SwipeCell />.
  for (const d of ["up", "right", "down", "left"] as Dir[]) {
    if (!m[d]) {
      throw new Error(
        `[SwipeStage] missing answer at position "${d}". ` +
          `Got positions: ${answers.map((a) => a.position).join(", ")}`,
      );
    }
  }
  return m as Record<Dir, Answer>;
}

// ---------------------------------------------------------------------------
// QuestionHeader — category + question, lifted out of the answer surface so
// the user reads them once, calmly, before scanning options. Used by both
// SwipeStage and FormStage.
// ---------------------------------------------------------------------------

export interface QuestionHeaderProps {
  questionLabel: string;
  meta: string;
  domainId: DomainId;
  /** When set, the question was already answered — show a small "modifié" chip. */
  modified?: boolean;
}

export function QuestionHeader({
  questionLabel,
  meta,
  domainId,
  modified = false,
}: QuestionHeaderProps) {
  const { t } = useTranslation("swipecard");
  const DomainIcon = iconByName(DOMAIN_BY_ID[domainId].icon);
  return (
    <div className="relative px-1 pb-4 pt-1 text-center">
      <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-primary">
        <DomainIcon className="size-3.5" strokeWidth={1.7} />
        <span>{meta}</span>
      </div>
      <h2 className="mt-2 text-balance font-serif text-[22px] leading-[1.15] text-foreground sm:text-2xl">
        {questionLabel}
      </h2>
      {modified && (
        <span className="absolute right-0 top-0 rounded-full bg-primary px-2 py-0.5 text-[9px] uppercase tracking-wider text-primary-foreground">
          {t("modified")}
        </span>
      )}
    </div>
  );
}

// Shared props for both answer surfaces. Both call `onPick(answerId)` so the
// route's handlePick flow is mode-agnostic.
export interface StageProps {
  domainId: DomainId;
  answers: Answer[]; // exactly 4
  current?: string;
  onPick: (answerId: string) => void | Promise<void>;
}

// ---------------------------------------------------------------------------
// SwipeStage — cross layout with a central swipeable cell.
//
// 3×3 grid: up / left / centre / right / down. The four outer cells are
// real buttons. The centre is a draggable cell that mirrors the answer
// being picked — empty state shows the domain icon as a visual anchor;
// during a swipe or after a tap, it morphs to the target answer (icon +
// label).
//
// Commit timing:
//   - Tap on an outer cell:    brief preview flash (~220ms), then onPick.
//   - Swipe past threshold:    centre locks to that direction, then onPick.
// The lock window matters for the existing E2E retry loop in
// tests/e2e/helpers/flow.ts.
// ---------------------------------------------------------------------------

export function SwipeStage({ domainId, answers, current, onPick }: StageProps) {
  const { t } = useTranslation("swipecard");
  const DomainIcon = iconByName(DOMAIN_BY_ID[domainId].icon);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-6, 6]);

  // `hovered` reflects drag direction; `previewing` reflects a freshly
  // tapped outer cell. They're separate so a tap-flash isn't clobbered if
  // the user happens to still be dragging.
  const [hovered, setHovered] = useState<Dir | null>(null);
  const [previewing, setPreviewing] = useState<Dir | null>(null);
  const [locked, setLocked] = useState(false);

  const mapping = mapAnswers(answers);

  // Reset all transient state whenever the answer *set* changes — i.e. a new
  // question arrived. We can't rely on `answers[0].id` alone: many questions
  // share their first answer id (e.g. "mother" appears as answers[0] across
  // 11 different questions in the dataset), and if `locked` doesn't reset on
  // those transitions, the next swipe/tap on the new card is a silent no-op.
  // Joining all four ids gives us a stable per-question fingerprint without
  // requiring the parent to thread a question id through.
  const answersKey = answers.map((a) => a.id).join("|");
  useEffect(() => {
    x.set(0);
    y.set(0);
    setHovered(null);
    setPreviewing(null);
    setLocked(false);
  }, [answersKey, x, y]);

  // Resolve which direction (if any) the center should mirror. Priority:
  // drag-hovered > tap-preview > previously-saved selection > none.
  const dirForCurrent: Dir | null = current
    ? ((Object.keys(mapping) as Dir[]).find((d) => mapping[d].id === current) ?? null)
    : null;
  const centerDir = hovered ?? previewing ?? dirForCurrent;
  const centerAnswer = centerDir ? mapping[centerDir] : null;
  const CenterIcon = centerAnswer ? iconByName(centerAnswer.icon) : DomainIcon;
  const centerFilled = !!hovered || !!previewing || !!centerAnswer;

  const commit = async (dir: Dir, viaSwipe: boolean) => {
    if (locked) return;
    setLocked(true);
    setPreviewing(dir);
    if (viaSwipe) {
      // Snap the puck back to centre so the swipe ends with the morphed
      // cell filling the centre, not the puck drifting off-screen.
      animate(x, 0, { duration: 0.2 });
      animate(y, 0, { duration: 0.2 });
    }
    // Brief flash so the user sees the centre fill before the question
    // advances.
    await new Promise((r) => setTimeout(r, 220));
    await onPick(mapping[dir].id);
  };

  const onDrag = (_: unknown, info: PanInfo) => {
    const { offset } = info;
    const ax = Math.abs(offset.x);
    const ay = Math.abs(offset.y);
    if (Math.max(ax, ay) < 30) {
      setHovered(null);
      return;
    }
    if (ax > ay) setHovered(offset.x > 0 ? "right" : "left");
    else setHovered(offset.y > 0 ? "down" : "up");
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { offset } = info;
    const ax = Math.abs(offset.x);
    const ay = Math.abs(offset.y);
    if (Math.max(ax, ay) < SWIPE_THRESHOLD) {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
      animate(y, 0, { type: "spring", stiffness: 300, damping: 25 });
      setHovered(null);
      return;
    }
    const dir: Dir = ax > ay ? (offset.x > 0 ? "right" : "left") : offset.y > 0 ? "down" : "up";
    commit(dir, true);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid min-h-[280px] grid-cols-[1fr_1.15fr_1fr] grid-rows-[auto_1fr_auto] gap-2.5 md:min-h-[360px] md:gap-3">
        <SwipeCell
          position="up"
          answer={mapping.up}
          active={hovered === "up" || previewing === "up" || dirForCurrent === "up"}
          onTap={() => commit("up", false)}
        />
        <SwipeCell
          position="left"
          answer={mapping.left}
          active={hovered === "left" || previewing === "left" || dirForCurrent === "left"}
          onTap={() => commit("left", false)}
        />

        {/* Centre cell — draggable; mirrors the picked answer. */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.55}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          style={{ x, y, rotate }}
          whileTap={{ cursor: "grabbing" }}
          aria-live="polite"
          aria-label={
            centerAnswer
              ? t("swipe.previewAria", { label: centerAnswer.label })
              : t("swipe.previewEmptyAria")
          }
          className={`col-start-2 row-start-2 flex cursor-grab touch-none select-none flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-5 text-center text-[14px] leading-[1.15] transition ${
            centerFilled
              ? "border-primary bg-primary text-primary-foreground shadow-[0_12px_30px_-12px_rgba(40,20,10,0.35)]"
              : "border-dashed border-border bg-secondary/60 text-muted-foreground"
          }`}
        >
          <CenterIcon className="size-7 shrink-0" strokeWidth={1.6} />
          <span className="px-1 text-[14px]">
            {centerAnswer ? centerAnswer.label : t("swipe.placeholder")}
          </span>
        </motion.div>

        <SwipeCell
          position="right"
          answer={mapping.right}
          active={hovered === "right" || previewing === "right" || dirForCurrent === "right"}
          onTap={() => commit("right", false)}
        />
        <SwipeCell
          position="down"
          answer={mapping.down}
          active={hovered === "down" || previewing === "down" || dirForCurrent === "down"}
          onTap={() => commit("down", false)}
        />
      </div>

      <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {t("swipe.hint")}
      </p>
    </div>
  );
}

function SwipeCell({
  position,
  answer,
  active,
  onTap,
}: {
  position: Dir;
  answer: Answer;
  active: boolean;
  onTap: () => void;
}) {
  const Icon = iconByName(answer.icon);
  // Place each outer cell in the 3×3 grid via Tailwind utilities so the
  // visual cross matches the direction → answer mapping above.
  const placement = {
    up: "col-start-2 row-start-1",
    left: "col-start-1 row-start-2",
    right: "col-start-3 row-start-2",
    down: "col-start-2 row-start-3",
  }[position];
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={answer.label}
      aria-pressed={active}
      className={`${placement} flex h-full flex-col items-center justify-center gap-2 rounded-2xl border px-3 py-4 text-center text-[14px] leading-[1.15] transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40"
      }`}
    >
      <Icon className="size-5 opacity-85" strokeWidth={1.6} />
      <span className="px-1">{answer.label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// FormStage (Design B — Pilules pleine largeur)
//
// Four stacked pills, icon + label only. No arrows, no center puck, no
// category icon — the user just taps. The accessible name on each button
// is the full answer label so E2E helpers and screen readers both pick it
// up cleanly.
// ---------------------------------------------------------------------------

export function FormStage({ answers, current, onPick }: Omit<StageProps, "domainId">) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      {answers.map((a) => {
        const Icon = iconByName(a.icon);
        const selected = current === a.id;
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onPick(a.id)}
            aria-label={a.label}
            aria-pressed={selected}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left text-[15px] leading-tight transition ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            <Icon className="size-5 shrink-0 opacity-85" strokeWidth={1.6} />
            <span className="flex-1">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModeSelect — subtle inline picker that swaps between the swipe and form
// answer surfaces. No background, no box border, just a solid bottom underline
// + a small chevron, so it reads as a quiet preference rather than a primary
// control. Shared by the session route and the home-page experience preview.
// ---------------------------------------------------------------------------

export function ModeSelect({
  mode,
  onChange,
}: {
  mode: InputMode;
  onChange: (m: InputMode) => void;
}) {
  const { t } = useTranslation("session");
  return (
    <Select value={mode} onValueChange={(value) => onChange(value as InputMode)}>
      <SelectTrigger
        aria-label={t("mode.aria")}
        className="h-6 w-auto gap-1.5 rounded-none border-0 border-b border-solid border-muted-foreground/40 bg-transparent px-0 pb-0.5 text-xs text-muted-foreground shadow-none ring-0 transition hover:text-foreground focus:ring-0 focus-visible:border-foreground/60 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-50"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="swipe">{t("mode.swipe")}</SelectItem>
        <SelectItem value="form">{t("mode.form")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
