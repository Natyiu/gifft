"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold">Theme</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select your preferred color scheme.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => {
          const isActive = mounted && theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-5 transition-colors",
                isActive
                  ? "border-primary/40 bg-primary/10"
                  : "border-border hover:bg-secondary",
              )}
            >
              <t.icon
                className={cn(
                  "h-6 w-6",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
