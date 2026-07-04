"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive } from "lucide-react";

import { getVaultData } from "@/lib/loaders/vault";
import { VaultClient } from "@/components/giftmind/vault-client";

export function VaultPageView() {
  const { data } = useQuery({ queryKey: ["vault"], queryFn: () => getVaultData() });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Gift vault</p>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
          <Archive className="h-6 w-6 text-primary" /> Every gift, remembered
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you&apos;ve given or they&apos;ve received — searchable, so you never repeat a gift or forget what landed.
        </p>
      </div>

      {data ? (
        <VaultClient entries={data.rows} profiles={data.profiles} />
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}
    </div>
  );
}
