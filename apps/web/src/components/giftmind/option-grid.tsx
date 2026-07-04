"use client";

import type { OptionDef } from "@/lib/giftmind/constants";
import { cn } from "@/lib/utils";

export function OptionGrid({
  options,
  value,
  onChange,
  columns = 3,
  allowDeselect = true,
}: {
  options: OptionDef[];
  value: string | null;
  onChange: (value: string | null) => void;
  columns?: 2 | 3 | 4;
  allowDeselect?: boolean;
}) {
  const cols = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4" }[columns];
  return (
    <div className={cn("grid gap-2", cols)}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(active && allowDeselect ? null : opt.value)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
              active
                ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/30"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {opt.emoji && <span className="text-base leading-none">{opt.emoji}</span>}
            <span className="font-medium leading-tight">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
