"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { getAppSettings } from "@/lib/actions/user";
import { updateAppSettings } from "@/lib/actions/admin";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/loader";

export default function AdminGeneralPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appName, setAppName] = useState("");

  useEffect(() => {
    getAppSettings().then((s) => {
      setAppName(s.appName);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAppSettings({ appName });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">General</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Core application settings.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="appName" className="text-xs">
            App Name
          </Label>
          <Input
            id="appName"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="My App"
          />
          <p className="text-[10px] text-muted-foreground">
            Used in emails, notifications, and the browser tab.
          </p>
        </div>

        <Separator className="opacity-30" />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
