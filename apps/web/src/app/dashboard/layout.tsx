import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
