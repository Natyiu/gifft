import { QueryClient, isServer } from "@tanstack/react-query";

/**
 * A QueryClient tuned for fast in-app navigation: fetched data stays "fresh"
 * for a minute (so re-visiting a sidebar page is instant from cache, with a
 * quiet background refresh), and is kept around for 5 minutes after a page
 * unmounts. Window-focus refetching is off to avoid surprise flickers.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Server: a fresh client per request. Browser: a single shared client so the
 *  cache survives client-side navigations between pages. */
export function getQueryClient() {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
