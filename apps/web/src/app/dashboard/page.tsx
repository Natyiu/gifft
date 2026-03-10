import { auth } from "@Batman/auth";
import { headers } from "next/headers";

import { DashboardHome } from "./dashboard-shell";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return <DashboardHome userName={session?.user?.name ?? undefined} />;
}
