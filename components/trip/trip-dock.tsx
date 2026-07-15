"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Gauge,
  List,
  Map as MapIcon,
  MoreHorizontal,
  Printer,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type TripView = "cockpit" | "itinerary" | "map";

interface TripDockProps {
  view: TripView;
  onViewChange: (view: TripView) => void;
  tripTitle: string;
  onPrint: () => void;
  onDelete: () => void;
  deleting: boolean;
}

const SEGMENTS: { key: TripView; label: string; icon: typeof Gauge }[] = [
  { key: "cockpit", label: "Cockpit", icon: Gauge },
  { key: "itinerary", label: "Itinerary", icon: List },
  { key: "map", label: "Map", icon: MapIcon },
];

/**
 * The trip screen's single piece of persistent chrome — a Tesla-style
 * floating dock. Left: back-to-garage. Centre: Cockpit·Itinerary·Map.
 * Right: an overflow kebab with Print + Delete.
 */
export function TripDock({
  view,
  onViewChange,
  tripTitle,
  onPrint,
  onDelete,
  deleting,
}: TripDockProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <nav className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 print:hidden">
      <div className="glass flex items-center gap-1 rounded-full border border-white/10 p-1 shadow-lg">
        {/* Back to garage */}
        <Link
          href="/"
          aria-label="Back to trips"
          className="focus-ring flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          <span className="font-display max-w-[7rem] truncate text-sm font-semibold">
            {tripTitle}
          </span>
        </Link>

        <span className="mx-0.5 h-6 w-px bg-white/10" aria-hidden="true" />

        {/* View switch */}
        {SEGMENTS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onViewChange(key)}
            aria-label={label}
            aria-pressed={view === key}
            className={cn(
              "focus-ring flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors",
              view === key
                ? "bg-highlight/15 text-volt-bright"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}

        <span className="mx-0.5 h-6 w-px bg-white/10" aria-hidden="true" />

        {/* Overflow: Print + Delete */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="More actions"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className={cn(
              "focus-ring flex size-11 items-center justify-center rounded-full transition-colors",
              menuOpen
                ? "bg-white/[0.1] text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="glass absolute bottom-[calc(100%+0.5rem)] right-0 flex min-w-[10rem] flex-col rounded-2xl border border-white/10 p-1 shadow-lg"
            >
              <button
                role="menuitem"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onPrint();
                }}
                className="focus-ring flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-white/[0.06]"
              >
                <Printer className="size-4" /> Print
              </button>
              <button
                role="menuitem"
                type="button"
                disabled={deleting}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="focus-ring flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
              >
                <Trash2 className="size-4" /> {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
