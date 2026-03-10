import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar, AdminMobileNav } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user || session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex gap-0 -m-5 md:-m-8 min-h-[calc(100vh-3rem)]">
      <AdminSidebar />
      <div className="flex-1 p-5 md:p-8 min-w-0">
        <AdminMobileNav />
        {children}
      </div>
    </div>
  );
}
