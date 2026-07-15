"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Detent = "peek" | "half" | "full";

const ORDER: Detent[] = ["peek", "half", "full"];
const PEEK_PX = 132;
const HALF_FRACTION = 0.52;
const FULL_FRACTION = 0.92;
// Clearance so the sheet rests above the floating dock (matches its height).
const CLEARANCE = 96; // px — dock pill (~52px) + its 1rem bottom gap + margin

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A single mobile bottom sheet with three snap detents (peek / half / full),
 * hand-rolled drag with scroll-vs-drag handoff. Mobile only (md:hidden) — the
 * desktop layout keeps its left/right rails. One surface owns the bottom edge.
 */
export function BottomSheet({
  detent,
  onDetentChange,
  header,
  children,
  bodyKey,
}: {
  detent: Detent;
  onDetentChange: (d: Detent) => void;
  /** Drag target — grab handle is added automatically above it. */
  header: ReactNode;
  children: ReactNode;
  /** Changes when the content mode changes, to reset body scroll. */
  bodyKey?: string;
}) {
  const [vh, setVh] = useState(0);
  const [safeBottom, setSafeBottom] = useState(0);
  const [dragY, setDragY] = useState<number | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    startY: number;
    base: number;
    lastY: number;
    lastT: number;
    v: number;
  } | null>(null);

  useEffect(() => {
    const measure = () =>
      setVh(window.visualViewport?.height ?? window.innerHeight);
    measure();
    window.visualViewport?.addEventListener("resize", measure);
    window.addEventListener("resize", measure);
    return () => {
      window.visualViewport?.removeEventListener("resize", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Measure the home-indicator inset once so the sheet clears it + the dock.
  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;bottom:0;left:0;height:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);
    setSafeBottom(probe.offsetHeight);
    probe.remove();
  }, []);

  // Reset scroll to top when the content mode changes.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [bodyKey]);

  const clearance = CLEARANCE + safeBottom;
  const availH = Math.max(0, vh - clearance);
  const heightFor = (d: Detent) =>
    d === "peek"
      ? PEEK_PX
      : Math.round(availH * (d === "half" ? HALF_FRACTION : FULL_FRACTION));
  const translateFor = (d: Detent) => Math.max(0, availH - heightFor(d));
  const resting = translateFor(detent);
  const translate = dragY ?? resting;

  const nearest = (y: number): Detent =>
    ORDER.reduce((best, d) =>
      Math.abs(translateFor(d) - y) < Math.abs(translateFor(best) - y)
        ? d
        : best,
    );
  const step = (d: Detent, dir: 1 | -1): Detent =>
    ORDER[clamp(ORDER.indexOf(d) + dir, 0, ORDER.length - 1)];

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = {
      startY: e.clientY,
      base: resting,
      lastY: e.clientY,
      lastT: e.timeStamp,
      v: 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    // Downward drag scrolls the body first; only move the sheet when at top.
    if (dy > 0 && (bodyRef.current?.scrollTop ?? 0) > 0) return;
    d.v = (e.clientY - d.lastY) / Math.max(1, e.timeStamp - d.lastT);
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    setDragY(clamp(d.base + dy, translateFor("full"), availH - 40));
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    const y = dragY ?? resting;
    // Snap to the nearest detent by position (so a long drag can cross more
    // than one). If it barely moved but was a fast flick, nudge one detent in
    // the fling direction (down = lower/peek, up = higher/full).
    let target = nearest(y);
    if (target === detent && Math.abs(d.v) > 0.6) {
      target = step(detent, d.v > 0 ? -1 : 1);
    }
    drag.current = null;
    setDragY(null);
    onDetentChange(target);
  };

  return (
    // Wrapper is clipped and ends at the dock line (bottom: clearance), so the
    // sheet never renders content behind the floating dock.
    <div
      className="pointer-events-none fixed inset-x-0 z-20 overflow-hidden md:hidden print:hidden"
      style={{ bottom: clearance, height: availH || undefined }}
    >
      <div
        data-detent={detent}
        className={cn(
          "glass pointer-events-auto absolute inset-x-0 top-0 flex h-full flex-col rounded-t-2xl border-t border-white/10",
          detent === "full" && "bg-background/95",
        )}
        style={{
          transform: `translateY(${translate}px)`,
          transition: dragY == null ? "transform 300ms ease-out" : "none",
        }}
      >
        {/* Drag handle + header (the whole strip is the drag target) */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="shrink-0 touch-none select-none"
        >
          <div className="flex justify-center py-2.5">
            <span className="h-1 w-9 rounded-full bg-muted-foreground/50" />
          </div>
          {header}
        </div>

        {/* Scrolling body */}
        <div
          ref={bodyRef}
          className="scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain pb-3"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
