import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowRight, ArrowDown, ArrowLeft } from "lucide-react";
import type { Answer } from "@/lib/dataset";
import { iconForAnswer, shortLabel, DOMAIN_ICON } from "@/lib/icon-map";
import type { DomainId } from "@/lib/dataset";

type Dir = "up" | "right" | "down" | "left";
const DIRS: Dir[] = ["up", "right", "down", "left"];

const SWIPE_THRESHOLD = 90;

export interface SwipeCardProps {
  questionLabel: string;
  meta: string;
  domainId: DomainId;
  answers: Answer[]; // exactly 4
  current?: string;
  onPick: (answerId: string) => void | Promise<void>;
}

export function SwipeCard({
  questionLabel,
  meta,
  domainId,
  answers,
  current,
  onPick,
}: SwipeCardProps) {
  const DomainIcon = DOMAIN_ICON[domainId];
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);

  const [hovered, setHovered] = useState<Dir | null>(null);
  const [locked, setLocked] = useState(false);

  // Reset when question changes
  useEffect(() => {
    x.set(0);
    y.set(0);
    setHovered(null);
    setLocked(false);
  }, [questionLabel]);

  const mapping: Record<Dir, Answer> = {
    up: answers[0],
    right: answers[1],
    down: answers[2],
    left: answers[3],
  };

  const commit = async (dir: Dir) => {
    if (locked) return;
    setLocked(true);
    const a = mapping[dir];
    const offX = dir === "left" ? -500 : dir === "right" ? 500 : 0;
    const offY = dir === "up" ? -500 : dir === "down" ? 500 : 0;
    animate(x, offX, { duration: 0.28 });
    animate(y, offY, { duration: 0.28 });
    await new Promise((r) => setTimeout(r, 180));
    await onPick(a.id);
  };

  const onDrag = (_: any, info: PanInfo) => {
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

  const onDragEnd = (_: any, info: PanInfo) => {
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
    commit(dir);
  };

  return (
    <div className="flex w-full flex-col">
      {/* Top hint */}
      <Hint dir="up" answer={mapping.up} active={hovered === "up"} onTap={() => commit("up")} />

      {/* Middle row: left hint, card, right hint */}
      <div className="my-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <Hint dir="left" answer={mapping.left} active={hovered === "left"} onTap={() => commit("left")} compact />
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.55}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          style={{ x, y, rotate }}
          whileTap={{ cursor: "grabbing" }}
          className="relative aspect-[3/4] cursor-grab touch-none select-none rounded-3xl border border-border bg-card p-5 shadow-[0_30px_60px_-30px_rgba(40,20,10,0.25)]"
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-primary">
            <DomainIcon className="size-3.5" strokeWidth={1.7} />
            <span>{meta}</span>
          </div>
          <div className="mt-5 flex items-center justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary/70">
              <DomainIcon className="size-8 text-primary" strokeWidth={1.4} />
            </div>
          </div>
          <h2 className="mt-5 text-balance text-center font-serif text-[22px] leading-[1.15] text-foreground sm:text-2xl">
            {questionLabel}
          </h2>
          <SwipeCardHint current={current} />
        </motion.div>
        <Hint dir="right" answer={mapping.right} active={hovered === "right"} onTap={() => commit("right")} compact />
      </div>

      {/* Bottom hint */}
      <Hint dir="down" answer={mapping.down} active={hovered === "down"} onTap={() => commit("down")} />
    </div>
  );
}

function SwipeCardHint({ current }: { current?: string }) {
  const { t } = useTranslation("swipecard");
  return (
    <>
      <p className="absolute inset-x-5 bottom-4 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {t("hint")}
      </p>
      {current && (
        <div className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-[9px] uppercase tracking-wider text-primary-foreground">
          {t("modified")}
        </div>
      )}
    </>
  );
}

function Hint({
  dir,
  answer,
  active,
  onTap,
  compact = false,
}: {
  dir: Dir;
  answer: Answer;
  active: boolean;
  onTap: () => void;
  compact?: boolean;
}) {
  const Arrow = dir === "up" ? ArrowUp : dir === "right" ? ArrowRight : dir === "down" ? ArrowDown : ArrowLeft;
  const Icon = iconForAnswer(answer.id, answer.label);
  const short = shortLabel(answer.id, answer.label);

  if (compact) {
    return (
      <button
        type="button"
        onClick={onTap}
        className={`flex h-full w-14 flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-3 text-[10px] leading-tight transition ${
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card/60 text-foreground hover:border-primary/40"
        }`}
        aria-label={answer.label}
      >
        <Arrow className="size-3 opacity-70" />
        <Icon className="size-5" strokeWidth={1.6} />
        <span className="text-center text-[10px] leading-tight">{short}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onTap}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card/60 text-foreground hover:border-primary/40"
      }`}
      aria-label={answer.label}
    >
      <Arrow className="size-3.5 opacity-70" />
      <Icon className="size-4" strokeWidth={1.6} />
      <span className="truncate">{short}</span>
    </button>
  );
}