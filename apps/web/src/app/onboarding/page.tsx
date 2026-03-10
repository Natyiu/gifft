"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronRight, Upload, User, Sparkles } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { updateProfile, completeOnboarding } from "@/lib/actions/user";
import { uploadFile } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Loader from "@/components/loader";

const steps = [
  { id: "welcome", title: "Welcome", icon: Sparkles },
  { id: "profile", title: "Profile", icon: User },
  { id: "avatar", title: "Avatar", icon: Upload },
  { id: "done", title: "All Set", icon: Check },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isPending) return <Loader />;
  if (!session) return null;

  if (!initialized) {
    setName(session.user.name ?? "");
    setBio((session.user as Record<string, unknown>).bio as string ?? "");
    setAvatarUrl(session.user.image ?? "");
    setInitialized(true);
  }

  const initials = (name || session.user.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `avatars/${session!.user.id}.${ext}`;
      const result = await uploadFile("avatars", path, file);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      setAvatarUrl(result.url);
    } catch {
      toast.error("Failed to upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await updateProfile({
        name,
        bio,
        image: avatarUrl || undefined,
      });
      await completeOnboarding();
      toast.success("You're all set!");
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCompleting(false);
    }
  }

  async function handleSkip() {
    setCompleting(true);
    try {
      await completeOnboarding();
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md space-y-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "h-7 w-7 flex items-center justify-center transition-all",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary/10 border-2 border-primary text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <s.icon className="h-3 w-3" />
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "w-8 h-px",
                    i < step ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/30 p-8 space-y-6">
          {step === 0 && (
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Welcome, {session.user.name}!
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Let&apos;s get your account set up in just a few steps.
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button size="sm" onClick={() => setStep(1)}>
                  Get Started
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  disabled={completing}
                >
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Your Profile
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Tell us a bit about yourself.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ob-name" className="text-xs">
                    Display Name
                  </Label>
                  <Input
                    id="ob-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-bio" className="text-xs">
                    Bio (optional)
                  </Label>
                  <Textarea
                    id="ob-bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="A short bio..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
                <Button size="sm" onClick={() => setStep(2)}>
                  Next
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Profile Picture
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a photo so others can recognize you.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group"
                  disabled={uploading}
                >
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <p className="text-[10px] text-muted-foreground">
                  {uploading
                    ? "Uploading..."
                    : "Click to upload (max 5MB)"}
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button size="sm" onClick={() => setStep(3)}>
                  Next
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-green-500/10 flex items-center justify-center mx-auto">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  You&apos;re all set!
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Your profile is ready. You can always update it later in
                  settings.
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleComplete}
                disabled={completing}
                className="mt-2"
              >
                {completing ? "Setting up..." : "Go to Dashboard"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
