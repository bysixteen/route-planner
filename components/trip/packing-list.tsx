"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
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

// One verb per state across chip / badge / tile.
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
const FILTER_LABEL: Record<Filter, string> = {
  all: "All",
  unpacked: "Unpacked",
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

/**
 * The van packing checklist body. Rendered two ways from one component: a
 * standalone /packing route (desktop pre-trip prep) and an in-trip "Pack"
 * overlay. `onBack` returns to wherever it was opened from.
 */
export function PackingList({ onBack }: { onBack: () => void }) {
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
  const [groupBy, setGroupBy] = useState<"category" | "location">("category");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [addingCat, setAddingCat] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [lastDeleted, setLastDeleted] = useState<Row | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rows = useMemo<Row[]>(() => {
    const builtins: Row[] = PACKING_ITEMS.map((i) => ({
      ...i,
      id: `b:${i.name}`,
      builtin: true,
    }));
    return [...builtins.filter((r) => !deleted[r.id]), ...custom];
  }, [deleted, custom]);

  const groupKeyOf = (r: Row) => (groupBy === "category" ? r.cat : r.loc);

  const toggleItem = (id: string) =>
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  const toggleCat = (grp: string) =>
    setCollapsed((c) => ({ ...c, [grp]: !c[grp] }));
  const deleteItem = (row: Row) => {
    if (row.builtin) setDeleted((d) => ({ ...d, [row.id]: true }));
    else setCustom((cs) => cs.filter((c) => c.id !== row.id));
    setLastDeleted(row);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setLastDeleted(null), 6000);
  };
  const undoDelete = () => {
    const row = lastDeleted;
    if (!row) return;
    if (row.builtin)
      setDeleted((d) => {
        const n = { ...d };
        delete n[row.id];
        return n;
      });
    else setCustom((cs) => [...cs, row]);
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };
  const addItem = (grp: string) => {
    const name = newName.trim();
    if (!name) return;
    setCustom((cs) => [
      ...cs,
      {
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `c:${name}:${cs.length}`,
        cat: groupBy === "category" ? grp : "Miscellaneous",
        loc: groupBy === "location" ? grp : "Added",
        name,
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

  const groups = useMemo(() => {
    const present = [
      ...new Set(rows.map((r) => (groupBy === "category" ? r.cat : r.loc))),
    ];
    return groupBy === "category"
      ? PACKING_CATEGORIES.filter((c) => present.includes(c))
      : present.sort((a, b) => a.localeCompare(b));
  }, [rows, groupBy]);

  const pct = counts.total ? Math.round((counts.packed / counts.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="focus-ring flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="label text-muted-foreground">Packing</p>
          <h1 className="font-display truncate text-xl font-bold tracking-tight">
            Van packing list
          </h1>
        </div>
        <button
          type="button"
          onClick={resetAll}
          className="focus-ring flex min-h-[44px] items-center gap-1.5 rounded-lg surface-2 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            <div key={s} className="surface-1 rounded-lg px-3 py-2">
              <div className="font-display text-lg tabular-nums">{n}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    s === "have"
                      ? "bg-health-good"
                      : s === "need"
                        ? "bg-health-warn"
                        : "bg-health-bad",
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

      {/* Search + filters — sticky so 'show me the Buy items' is one tap */}
      <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 mb-4 flex flex-col gap-3 bg-background px-4 py-2 sm:-mx-6 sm:flex-row sm:px-6">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search packing items"
            placeholder="Search items, categories, locations…"
            className="focus-ring surface-1 w-full rounded-lg border border-white/10 py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground"
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
                "focus-ring flex min-h-[44px] shrink-0 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                filter === f
                  ? "bg-highlight/20 text-volt-tint"
                  : "surface-2 text-muted-foreground hover:text-foreground",
              )}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Group-by toggle — load the van cupboard-by-cupboard, or by category */}
      <div className="mb-3 flex items-center gap-2">
        <span className="label text-muted-foreground">Group by</span>
        <div className="surface-2 flex gap-1 rounded-lg p-0.5 text-xs">
          {(["category", "location"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGroupBy(g)}
              aria-pressed={groupBy === g}
              className={cn(
                "focus-ring rounded-md px-2.5 py-1.5 font-medium capitalize transition-colors",
                groupBy === g
                  ? "bg-highlight/20 text-volt-tint"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {groups.map((grp) => {
          const items = filtered.filter((i) => groupKeyOf(i) === grp);
          const grpRows = rows.filter((i) => groupKeyOf(i) === grp);
          const grpPacked = grpRows.filter((i) => checked[i.id]).length;
          const isCollapsed = collapsed[grp];
          if (items.length === 0 && addingCat !== grp) return null;
          return (
            <div
              key={grp}
              className="glass overflow-hidden rounded-2xl border border-white/10"
            >
              <button
                type="button"
                onClick={() => toggleCat(grp)}
                aria-expanded={!isCollapsed}
                className="focus-ring flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.03]"
              >
                {isCollapsed ? (
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                )}
                <h2 className="font-display min-w-0 flex-1 truncate font-semibold">
                  {grp}
                </h2>
                <span className="font-display shrink-0 text-[13px] tabular-nums text-muted-foreground">
                  {grpPacked}/{grpRows.length}
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
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Buy ${item.name}`}
                            className="focus-ring flex shrink-0 items-center gap-1 self-center rounded-md px-2 text-xs font-medium text-volt-bright transition-colors hover:text-volt-tint"
                          >
                            Buy <ExternalLink className="size-3.5" />
                          </a>
                        )}
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

                  <li className="p-2">
                    {addingCat === grp ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          addItem(grp);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          value={newName}
                          autoFocus
                          onChange={(e) => setNewName(e.target.value)}
                          aria-label={`New item for ${grp}`}
                          placeholder="Add an item…"
                          className="focus-ring surface-1 min-w-0 flex-1 rounded-lg border border-white/10 px-3 py-2 text-sm placeholder:text-muted-foreground"
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
                          setAddingCat(grp);
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

      {/* Undo toast after a delete */}
      {lastDeleted && (
        <div className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 print:hidden">
          <div className="glass flex items-center gap-3 rounded-full border border-white/10 px-4 py-2 text-sm shadow-lg">
            <span className="truncate text-muted-foreground">
              Removed{" "}
              <span className="text-foreground">{lastDeleted.name}</span>
            </span>
            <button
              type="button"
              onClick={undoDelete}
              className="focus-ring rounded-md font-semibold text-volt-bright transition-colors hover:text-volt-tint"
            >
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
