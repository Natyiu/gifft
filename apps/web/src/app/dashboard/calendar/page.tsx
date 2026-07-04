import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient } from "@/lib/query-client";
import { getCalendarData } from "@/lib/loaders/calendar";
import { CalendarPageView } from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({ queryKey: ["calendar"], queryFn: () => getCalendarData() });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarPageView />
    </HydrationBoundary>
  );
}
