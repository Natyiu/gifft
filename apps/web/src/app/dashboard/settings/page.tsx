"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { updateProfile } from "@/lib/actions/user";
import { uploadFile } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileSettingsSkeleton } from "@/components/skeletons";

export default function ProfileSettings() {
  const { data: session, isPending } = authClient.useSession();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [initialized, setInitialized] = useState(false);

  if (isPending) return <ProfileSettingsSkeleton />;
  if (!session) return null;

  if (!initialized) {
    setName(session.user.name ?? "");
    setBio((session.user as Record<string, unknown>).bio as string ?? "");
    setAvatarUrl(session.user.image ?? "");
    setInitialized(true);
  }

  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "U";

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
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
      await updateProfile({ image: result.url });
      toast.success("Avatar updated");
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({ name, bio, image: avatarUrl || undefined });
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <SectionHeader title="Avatar" description="Click to upload a new profile picture." />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group cursor-pointer"
            disabled={uploading}
          >
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <span className="text-xs font-medium text-white">Edit</span>
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div className="space-y-0.5 text-xs text-muted-foreground">
            <p>Square image, at least 200×200px.</p>
            <p>Max 5MB. JPG, PNG, or WebP.</p>
          </div>
        </div>
      </section>

      {/* Profile info */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <SectionHeader title="Profile" description="Your name and bio visible to others." />
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={session.user.email} disabled className="opacity-60" />
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <Button onClick={handleSave} disabled={saving} className="rounded-full">
              {saving ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
