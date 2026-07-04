import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";
import { getVaultData } from "@/lib/loaders/vault";
import { VaultPageView } from "./vault-page-view";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: ["vault"], queryFn: () => getVaultData() });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VaultPageView />
    </HydrationBoundary>
  );
}
