"use client";

import Link from "next/link";

import { SignInForm } from "@/components/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="border-border/30 bg-card/50 backdrop-blur">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">Welcome back</CardTitle>
        <CardDescription className="text-xs">Enter your credentials to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <SignInForm />
        <div className="mt-5 text-center text-xs">
          <span className="text-muted-foreground">No account? </span>
          <Link href="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
