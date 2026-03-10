"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSent(true);
      toast.success("Reset link sent — check your email");
    } catch {
      toast.error("Failed to send reset link");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <Card className="border-border/30 bg-card/50 backdrop-blur">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="h-10 w-10 mx-auto bg-primary/10 flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Check your email</h2>
            <p className="text-xs text-muted-foreground mt-1">
              We sent a password reset link to <strong>{email}</strong>.
            </p>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs gap-1.5">
              <ArrowLeft className="h-3 w-3" />
              Back to login
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/30 bg-card/50 backdrop-blur">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Reset password
        </CardTitle>
        <CardDescription className="text-xs">
          Enter your email and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={sending || !email.trim()}
          >
            {sending ? "Sending..." : "Send Reset Link"}
          </Button>
        </form>
        <div className="mt-5 text-center">
          <Link
            href="/login"
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
