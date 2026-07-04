"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarRange } from "lucide-react";

import { getPlannerData } from "@/lib/loaders/planner";
import { PlannerClient } from "@/components/giftmind/planner-client";

export function PlannerPageView() {
  const { data } = useQuery({ queryKey: ["planner"], queryFn: () => getPlannerData() });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
          <CalendarRange className="h-6 w-6 text-primary" /> Planner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plan gifts ahead — budgets, countdowns, and ideas, so nothing sneaks up on you.
        </p>
      </div>

      {data ? (
        <PlannerClient
          occasions={data.occasions}
          pastByProfile={data.pastByProfile}
          groups={data.groups}
          people={data.people}
          plans={data.plans}
        />
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-3xl bg-muted" />
          ))}
        </div>
      )}
    </div>
  );
}
