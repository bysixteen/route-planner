"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Detent = "peek" | "half" | "full";

const ORDER: Detent[] = ["peek", "half", "full"];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A single mobile bottom sheet anchored flush to the bottom edge, with three
 * snap detents (peek / half / full) driven by CARD HEIGHT (not a translated
 * full-height card — that broke scrolling at partial detents). The body scrolls
 * and is padded above the floating dock. Hand-rolled drag on the handle only.
 * Mobile only (md:hidden); desktop keeps its rails.
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
  header: ReactNode;
  children: ReactNode;
  bodyKey?: string;
}) {
  const [vh, setVh] = useState(0);
  const [safeBottom, setSafeBottom] = useState(0);
  const [dragH, setDragH] = useState<number | null>(null);
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

  useEffect(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;bottom:0;left:0;height:env(safe-area-inset-bottom);visibility:hidden;pointer-events:none;";
    document.body.appendChild(probe);
    setSafeBottom(probe.offsetHeight);
    probe.remove();
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [bodyKey]);

  // The floating dock occupies the bottom band; keep body content above it.
  const dockGap = 68 + safeBottom;
  const heightFor = (d: Detent) =>
    d === "peek"
      ? 168 + safeBottom
      : Math.round((vh || 800) * (d === "half" ? 0.56 : 0.94));
  const cur = dragH ?? heightFor(detent);

  const nearest = (h: number): Detent =>
    ORDER.reduce((best, d) =>
      Math.abs(heightFor(d) - h) < Math.abs(heightFor(best) - h) ? d : best,
    );
  const stepDetent = (d: Detent, dir: 1 | -1): Detent =>
    ORDER[clamp(ORDER.indexOf(d) + dir, 0, ORDER.length - 1)];

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = {
      startY: e.clientY,
      base: heightFor(detent),
      lastY: e.clientY,
      lastT: e.timeStamp,
      v: 0,
    };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.startY; // + when dragging down (shrink)
    d.v = (e.clientY - d.lastY) / Math.max(1, e.timeStamp - d.lastT);
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    setDragH(clamp(d.base - dy, heightFor("peek"), heightFor("full")));
  };
  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    const h = dragH ?? heightFor(detent);
    let target = nearest(h);
    // Barely moved but a fast flick → nudge one detent (down = smaller/peek).
    if (target === detent && Math.abs(d.v) > 0.6) {
      target = stepDetent(detent, d.v > 0 ? -1 : 1);
    }
    drag.current = null;
    setDragH(null);
    onDetentChange(target);
  };

  // Body drag — only engages when native scroll isn't in play, so the list
  // still scrolls at half: drag DOWN at the top collapses; drag UP expands
  // when the content doesn't overflow. Otherwise the body scrolls normally.
  const bodyDrag = useRef<{
    startY: number;
    base: number;
    committed: boolean;
    atTop: boolean;
    canScroll: boolean;
    lastY: number;
    lastT: number;
    v: number;
  } | null>(null);
  const onBodyDown = (e: React.PointerEvent) => {
    const el = bodyRef.current;
    bodyDrag.current = {
      startY: e.clientY,
      base: heightFor(detent),
      committed: false,
      atTop: (el?.scrollTop ?? 0) <= 0,
      canScroll: el ? el.scrollHeight > el.clientHeight + 1 : false,
      lastY: e.clientY,
      lastT: e.timeStamp,
      v: 0,
    };
  };
  const onBodyMove = (e: React.PointerEvent) => {
    const d = bodyDrag.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    if (!d.committed) {
      const wantExpand = dy < -8 && detent !== "full" && !d.canScroll;
      const wantCollapse = dy > 8 && d.atTop;
      if (wantExpand || wantCollapse) {
        d.committed = true;
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      } else return;
    }
    d.v = (e.clientY - d.lastY) / Math.max(1, e.timeStamp - d.lastT);
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    setDragH(clamp(d.base - dy, heightFor("peek"), heightFor("full")));
  };
  const onBodyUp = () => {
    const d = bodyDrag.current;
    if (d?.committed) {
      const h = dragH ?? heightFor(detent);
      let target = nearest(h);
      if (target === detent && Math.abs(d.v) > 0.6) {
        target = stepDetent(detent, d.v > 0 ? -1 : 1);
      }
      setDragH(null);
      onDetentChange(target);
    }
    bodyDrag.current = null;
  };

  return (
    <div
      data-detent={detent}
      className={cn(
        "glass pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-white/10 md:hidden print:hidden",
        // Near-opaque at half + full so map markers/lines don't bleed behind
        // the content; keep peek glassy over the map.
        detent !== "peek" && "bg-background/95",
      )}
      style={{
        height: cur || undefined,
        transition: dragH == null ? "height 300ms ease-out" : "none",
      }}
    >
      {/* Drag handle + header — the whole strip is the drag target */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="shrink-0 touch-none select-none"
      >
        <div className="flex justify-center py-2.5">
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/50" />
        </div>
        {header}
      </div>

      {/* Scrolling body — padded so the last row clears the floating dock */}
      <div
        ref={bodyRef}
        onPointerDown={onBodyDown}
        onPointerMove={onBodyMove}
        onPointerUp={onBodyUp}
        onPointerCancel={onBodyUp}
        className="scroll-fade min-h-0 flex-1 overflow-y-auto overscroll-contain"
        style={{ paddingBottom: dockGap + 12 }}
      >
        {children}
      </div>
    </div>
  );
}
