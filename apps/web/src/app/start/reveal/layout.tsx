// The reveal generates ideas and scrapes all 15 products up front (image +
// price + buy link) before showing the results, so the server action can run
// well past Vercel's short default timeout. Give it room — otherwise a long
// scrape gets killed mid-run and the reveal errors instead of completing.
// (Client pages can't export route-segment config, so it lives on this layout.)
export const maxDuration = 60;

export default function RevealLayout({ children }: { children: React.ReactNode }) {
  return children;
}
