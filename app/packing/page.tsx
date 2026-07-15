"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  PACKING_CATEGORIES,
  PACKING_ITEMS,
  type PackingStatus,
  type PackingItem,
} from "@/lib/packing-data";
import { cn } from "@/lib/utils";

const KEY_CHECKED = "routePlanner_packing_v2";
const KEY_DELETED = "routePlanner_packing_deleted_v1";
const KEY_CUSTOM = "routePlanner_packing_custom_v1";

type Filter = "all" | "unpacked" | "have" | "need" | "buy";

interface Row extends PackingItem {
  id: string;
  builtin: boolean;
}

const STATUS_STYLE: Record<PackingStatus, string> = {
  have: "bg-health-good/15 text-health-good",
  need: "bg-health-warn/15 text-health-warn",
  buy: "bg-health-bad/15 text-health-bad-text",
};
const STATUS_LABEL: Record<PackingStatus, string> = {
  have: "Have",
  need: "Organise",
  buy: "Buy",
};

function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value, loaded]);
  return [value, setValue] as const;
}

export default function PackingPage() {
  const [checked, setChecked] = useLocalState<Record<string, boolean>>(
    KEY_CHECKED,
    {},
  );
  const [deleted, setDeleted] = useLocalState<Record<string, boolean>>(
    KEY_DELETED,
    {},
  );
  const [custom, setCustom] = useLocalState<Row[]>(KEY_CUSTOM, []);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [addingCat, setAddingCat] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const rows = useMemo<Row[]>(() => {
    const builtins: Row[] = PACKING_ITEMS.map((i) => ({
      ...i,
      id: `b:${i.name}`,
      builtin: true,
    }));
    return [...builtins.filter((r) => !deleted[r.id]), ...custom];
  }, [deleted, custom]);

  const toggleItem = (id: string) =>
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  const toggleCat = (cat: string) =>
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }));
  const deleteItem = (row: Row) => {
    if (row.builtin) setDeleted((d) => ({ ...d, [row.id]: true }));
    else setCustom((cs) => cs.filter((c) => c.id !== row.id));
  };
  const addItem = (cat: string) => {
    const name = newName.trim();
    if (!name) return;
    setCustom((cs) => [
      ...cs,
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `c:${name}:${cs.length}`,
        cat,
        name,
        loc: "Added",
        status: "need",
        builtin: false,
      },
    ]);
    setNewName("");
    setAddingCat(null);
  };
  const resetAll = () => {
    if (confirm("Reset every item to unpacked? (Kept and deleted items stay.)"))
      setChecked({});
  };

  const counts = useMemo(() => {
    const packed = rows.filter((r) => checked[r.id]).length;
    return {
      packed,
      total: rows.length,
      have: rows.filter((i) => i.status === "have").length,
      need: rows.filter((i) => i.status === "need").length,
      buy: rows.filter((i) => i.status === "buy").length,
    };
  }, [rows, checked]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((item) => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.cat.toLowerCase().includes(q) ||
        item.loc.toLowerCase().includes(q);
      const matchesFilter =
        filter === "all" ||
        (filter === "unpacked" && !checked[item.id]) ||
        filter === item.status;
      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter, checked]);

  // Categories that still have any rows (built-in order first, then any new).
  const categories = useMemo(() => {
    const present = new Set(rows.map((r) => r.cat));
    return PACKING_CATEGORIES.filter((c) => present.has(c));
  }, [rows]);

  const pct = counts.total ? Math.round((counts.packed / counts.total) * 100) : 0;

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/"
            aria-label="Back to trips"
            className="focus-ring flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="label text-muted-foreground">Packing</p>
            <h1 className="font-display truncate text-xl font-bold tracking-tight">
              Van packing list
            </h1>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="focus-ring flex min-h-[40px] items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 text-sm text-muted-foreground transition-colors hover:bg-white/[0.1] hover:text-foreground"
          >
            <RotateCcw className="size-4" /> Reset
          </button>
        </div>

        {/* Progress + counts */}
        <div className="glass mb-4 rounded-2xl border border-white/10 p-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="font-display text-3xl font-normal tabular-nums">
                {counts.packed}
              </span>
              <span className="font-display text-lg text-muted-foreground">
                {" "}
                / {counts.total} packed
              </span>
            </div>
            <span className="font-display text-lg tabular-nums text-volt-bright">
              {pct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-volt transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(
              [
                ["have", counts.have],
                ["need", counts.need],
                ["buy", counts.buy],
              ] as const
            ).map(([s, n]) => (
              <div key={s} className="rounded-lg bg-white/[0.04] px-3 py-2">
                <div className="font-display text-lg tabular-nums">{n}</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      s === "have"
                        ? "bg-health-good"
                        : s === "need"
                          ? "bg-health-warn"
                          : "bg-health-bad-text",
                    )}
                  />
                  {s === "have"
                    ? "Already own"
                    : s === "need"
                      ? "To organise"
                      : "To buy"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search + filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search packing items"
              placeholder="Search items, categories, locations…"
              className="focus-ring w-full rounded-lg border border-white/10 bg-white/[0.04] py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {(["all", "unpacked", "have", "need", "buy"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "focus-ring shrink-0 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-volt/20 text-volt-tint"
                    : "bg-white/[0.06] text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          {categories.map((cat) => {
            const items = filtered.filter((i) => i.cat === cat);
            const catRows = rows.filter((i) => i.cat === cat);
            const catPacked = catRows.filter((i) => checked[i.id]).length;
            const isCollapsed = collapsed[cat];
            // Hide categories with nothing matching the current filter/search
            // (unless we're actively adding to this one).
            if (items.length === 0 && addingCat !== cat) return null;
            return (
              <div
                key={cat}
                className="glass overflow-hidden rounded-2xl border border-white/10"
              >
                <button
                  type="button"
                  onClick={() => toggleCat(cat)}
                  aria-expanded={!isCollapsed}
                  className="focus-ring flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                  )}
                  <h2 className="font-display min-w-0 flex-1 truncate font-semibold">
                    {cat}
                  </h2>
                  <span className="font-display shrink-0 text-[13px] tabular-nums text-muted-foreground">
                    {catPacked}/{catRows.length}
                  </span>
                </button>
                {!isCollapsed && (
                  <ul className="border-t border-white/5">
                    {items.map((item) => {
                      const done = !!checked[item.id];
                      return (
                        <li
                          key={item.id}
                          className="flex items-stretch border-b border-white/5 last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(item.id)}
                            aria-pressed={done}
                            aria-label={`${item.name}${done ? " (packed)" : ""}`}
                            className="focus-ring flex min-w-0 flex-1 items-start gap-3 py-3 pl-4 text-left transition-colors hover:bg-white/[0.03]"
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors",
                                done ? "border-volt bg-volt" : "border-white/25",
                              )}
                            >
                              {done && (
                                <Check
                                  className="size-3 text-white"
                                  strokeWidth={3}
                                />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  "block text-sm",
                                  done && "text-muted-foreground line-through",
                                )}
                              >
                                {item.name}
                              </span>
                              <span className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <MapPin className="size-3" />
                                  {item.loc}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                                    STATUS_STYLE[item.status],
                                  )}
                                >
                                  {STATUS_LABEL[item.status]}
                                </span>
                              </span>
                              {item.note && (
                                <span className="mt-1 block text-[11px] italic text-foreground/70">
                                  {item.note}
                                </span>
                              )}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item)}
                            aria-label={`Remove ${item.name}`}
                            className="focus-ring flex w-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-health-bad-text"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      );
                    })}

                    {/* Add item */}
                    <li className="p-2">
                      {addingCat === cat ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            addItem(cat);
                          }}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="text"
                            value={newName}
                            autoFocus
                            onChange={(e) => setNewName(e.target.value)}
                            aria-label={`New item for ${cat}`}
                            placeholder="Add an item…"
                            className="focus-ring min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm placeholder:text-muted-foreground"
                          />
                          <button
                            type="submit"
                            className="focus-ring rounded-lg bg-volt px-3 py-2 text-sm font-semibold text-white hover:bg-volt-bright"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddingCat(null);
                              setNewName("");
                            }}
                            aria-label="Cancel"
                            className="focus-ring flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-4" />
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setAddingCat(cat);
                            setNewName("");
                          }}
                          className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Plus className="size-4" /> Add item
                        </button>
                      )}
                    </li>
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {counts.total} items · saved on this device · works offline
        </p>
      </div>
    </div>
  );
}
