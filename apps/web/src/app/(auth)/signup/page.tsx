"use client";

import Link from "next/link";

import { SignUpForm } from "@/components/sign-up-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <Card className="border-border/30 bg-card/50 backdrop-blur">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">Create account</CardTitle>
        <CardDescription className="text-xs">Get started with your free account</CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
        <div className="mt-5 text-center text-xs">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
