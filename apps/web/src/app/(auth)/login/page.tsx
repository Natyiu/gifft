"use client";

import Link from "next/link";
import { SignInForm } from "@/components/sign-in-form";

export default function LoginPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Welcome back</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enter your credentials to continue
        </p>
      </div>

      <SignInForm />

      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="text-foreground hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  );
}
