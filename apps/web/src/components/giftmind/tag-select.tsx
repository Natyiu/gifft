"use client";

import { Check } from "lucide-react";

import type { OptionDef } from "@/lib/giftmind/constants";
import { cn } from "@/lib/utils";

export function TagSelect({
  options,
  values,
  onChange,
  max = 12,
}: {
  options: OptionDef[];
  values: string[];
  onChange: (values: string[]) => void;
  max?: number;
}) {
  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else if (values.length < max) {
      onChange([...values, value]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = values.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm transition-all whitespace-nowrap",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40",
            )}
          >
            {active ? <Check className="h-3.5 w-3.5" /> : opt.emoji && <span>{opt.emoji}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
