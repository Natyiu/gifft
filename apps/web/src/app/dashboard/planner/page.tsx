import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";
import { getPlannerData } from "@/lib/loaders/planner";
import { PlannerPageView } from "./planner-page-view";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: ["planner"], queryFn: () => getPlannerData() });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlannerPageView />
    </HydrationBoundary>
  );
}
