import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";
import { getDiscoverData } from "@/lib/loaders/discover";
import { DiscoverView } from "./discover-view";

export const dynamic = "force-dynamic";

export default async function DiscoverPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: ["discover"], queryFn: () => getDiscoverData() });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DiscoverView />
    </HydrationBoundary>
  );
}
