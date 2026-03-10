"use client";

import Link from "next/link";
import { SignUpForm } from "@/components/sign-up-form";

export default function SignUpPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Create account</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Get started with your free account
        </p>
      </div>

      <SignUpForm />

      <p className="mt-5 text-center text-[11px] text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
