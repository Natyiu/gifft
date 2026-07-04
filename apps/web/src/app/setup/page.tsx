"use client";

import { useRouter } from "next/navigation";

import { SetupWizard } from "@/components/setup-wizard";

export default function SetupPage() {
  const router = useRouter();
  return <SetupWizard onComplete={() => router.push("/dashboard")} />;
}
