import { useState } from "react";
import { MOBILE_BREAKPOINT } from "@/hooks/use-mobile";

/**
 * "swipe" = cross with a draggable centre cell that mirrors the answer you
 *           are previewing (tap an outer cell, or swipe from the centre).
 * "form"  = four stacked pills, tap only.
 *
 * The route swaps the answer surface based on this mode while keeping the
 * same `onPick(answerId)` contract.
 */
export type InputMode = "swipe" | "form";

function defaultMode(): InputMode {
  if (typeof window === "undefined") return "form";
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches ? "swipe" : "form";
}

export function useInputMode(initial?: InputMode): [InputMode, (m: InputMode) => void] {
  const [mode, setMode] = useState<InputMode>(() => initial ?? defaultMode());
  return [mode, setMode];
}
