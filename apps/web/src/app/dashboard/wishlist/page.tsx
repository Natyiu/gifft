import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";
import { getWishlistData } from "@/lib/loaders/wishlist";
import { WishlistPageView } from "./wishlist-page-view";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: ["wishlist"], queryFn: () => getWishlistData() });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WishlistPageView />
    </HydrationBoundary>
  );
}
