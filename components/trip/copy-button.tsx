"use client";

import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

interface CopyButtonProps {
  /** Text placed on the clipboard. */
  value: string;
  /** Visible label (defaults to the value). */
  label?: string;
  /** Screen-reader/aria description of what's being copied. */
  title?: string;
  className?: string;
}

/**
 * Small inline copy control — swaps the icon to a tick for 2s on success.
 * Used for booking references and satnav coordinates.
 */
export function CopyButton({ value, label, title, className }: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const copied = state === "copied";

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        navigator.vibrate?.(10);
        setState("copied");
        setTimeout(() => setState("idle"), 2000);
      } catch {
        // Clipboard unavailable (e.g. insecure context) — surface it.
        setState("failed");
        setTimeout(() => setState("idle"), 2500);
      }
    },
    [value],
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title ?? `Copy ${value}`}
      className={cn(
        "focus-ring inline-flex min-h-[44px] items-center gap-1 rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-foreground transition-colors hover:bg-white/[0.11] sm:min-h-[32px]",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3 text-health-good" />
      ) : (
        <Copy className="size-3" />
      )}
      <span
        className={cn(
          copied && "text-health-good",
          state === "failed" && "text-health-warn",
        )}
      >
        {copied
          ? "Copied"
          : state === "failed"
            ? "Couldn't copy"
            : (label ?? value)}
      </span>
    </button>
  );
}
