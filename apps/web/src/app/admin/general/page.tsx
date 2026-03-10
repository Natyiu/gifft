"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Settings2,
  Globe,
  Shield,
  Users,
  Mail,
  AlertTriangle,
  Link2,
  Clock,
} from "lucide-react";
import { getAppSettings } from "@/lib/actions/user";
import { updateAppSettings } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GeneralSettingsSkeleton } from "@/components/skeletons";

type Settings = {
  appName: string;
  appDescription: string;
  appUrl: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  defaultUserRole: string;
  maxUsersEnabled: boolean;
  maxUsers: number;
  supportEmail: string;
  privacyUrl: string;
  termsUrl: string;
  signupsEnabled: boolean;
  sessionTimeout: number;
};

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border/40 bg-card/50">
      <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
        <div>
          <p className="text-xs font-semibold">{title}</p>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-start">
      <div className="pt-1.5">
        <Label className="text-[11px] font-medium">{label}</Label>
        {hint && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
  danger,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className={`text-[11px] font-medium ${danger ? "text-destructive" : ""}`}>
          {label}
        </p>
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function AdminGeneralPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [s, setS] = useState<Settings>({
    appName: "",
    appDescription: "",
    appUrl: "",
    maintenanceMode: false,
    maintenanceMessage: "",
    defaultUserRole: "user",
    maxUsersEnabled: false,
    maxUsers: 0,
    supportEmail: "",
    privacyUrl: "",
    termsUrl: "",
    signupsEnabled: true,
    sessionTimeout: 30,
  });

  useEffect(() => {
    getAppSettings().then((data) => {
      setS({
        appName: data.appName ?? "",
        appDescription: (data as Record<string, unknown>).appDescription as string ?? "",
        appUrl: (data as Record<string, unknown>).appUrl as string ?? "",
        maintenanceMode: (data as Record<string, unknown>).maintenanceMode as boolean ?? false,
        maintenanceMessage: (data as Record<string, unknown>).maintenanceMessage as string ?? "",
        defaultUserRole: (data as Record<string, unknown>).defaultUserRole as string ?? "user",
        maxUsersEnabled: (data as Record<string, unknown>).maxUsersEnabled as boolean ?? false,
        maxUsers: (data as Record<string, unknown>).maxUsers as number ?? 0,
        supportEmail: (data as Record<string, unknown>).supportEmail as string ?? "",
        privacyUrl: (data as Record<string, unknown>).privacyUrl as string ?? "",
        termsUrl: (data as Record<string, unknown>).termsUrl as string ?? "",
        signupsEnabled: (data as Record<string, unknown>).signupsEnabled as boolean ?? true,
        sessionTimeout: (data as Record<string, unknown>).sessionTimeout as number ?? 30,
      });
      setLoading(false);
    });
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateAppSettings(s);
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle<K extends keyof Settings>(key: K, value: Settings[K]) {
    const prev = s[key];
    update(key, value);
    try {
      await updateAppSettings({ [key]: value });
      toast.success("Setting updated");
    } catch {
      update(key, prev);
      toast.error("Failed to update");
    }
  }

  if (loading) return <GeneralSettingsSkeleton />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight">General</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Core application settings and configuration
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="text-xs h-7"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* App Identity */}
      <SectionCard
        icon={Settings2}
        title="App Identity"
        description="Name, description, and branding"
      >
        <FieldRow label="App Name" hint="Used in emails, browser tab, and UI">
          <Input
            value={s.appName}
            onChange={(e) => update("appName", e.target.value)}
            placeholder="My App"
            className="h-8 text-xs"
          />
        </FieldRow>
        <FieldRow label="Description" hint="Short tagline for your app">
          <Input
            value={s.appDescription}
            onChange={(e) => update("appDescription", e.target.value)}
            placeholder="A brief description of your product"
            className="h-8 text-xs"
          />
        </FieldRow>
        <FieldRow label="App URL" hint="The primary URL of your application">
          <Input
            value={s.appUrl}
            onChange={(e) => update("appUrl", e.target.value)}
            placeholder="https://yourapp.com"
            className="h-8 text-xs"
          />
        </FieldRow>
      </SectionCard>

      {/* Access Control */}
      <SectionCard
        icon={Shield}
        title="Access Control"
        description="Registration, roles, and session settings"
      >
        <ToggleRow
          label="User Signups"
          hint="Allow new users to register. Disable to close registration."
          checked={s.signupsEnabled}
          onCheckedChange={(v) => handleToggle("signupsEnabled", v)}
        />
        <div className="border-t border-border/20 pt-3">
          <FieldRow
            label="Default User Role"
            hint="Role assigned to new users on signup"
          >
            <Select
              value={s.defaultUserRole}
              onValueChange={(v) => update("defaultUserRole", v)}
            >
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user" className="text-xs">User</SelectItem>
                <SelectItem value="admin" className="text-xs">Admin</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
        <div className="border-t border-border/20 pt-3">
          <FieldRow
            label="Session Timeout"
            hint="Days before an inactive session expires"
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={s.sessionTimeout}
                onChange={(e) => update("sessionTimeout", parseInt(e.target.value) || 1)}
                min={1}
                max={365}
                className="h-8 text-xs w-24"
              />
              <span className="text-[10px] text-muted-foreground">days</span>
            </div>
          </FieldRow>
        </div>
      </SectionCard>

      {/* User Limits */}
      <SectionCard
        icon={Users}
        title="User Limits"
        description="Control maximum user capacity"
      >
        <ToggleRow
          label="Enable User Cap"
          hint="Limit the total number of registered users"
          checked={s.maxUsersEnabled}
          onCheckedChange={(v) => handleToggle("maxUsersEnabled", v)}
        />
        {s.maxUsersEnabled && (
          <div className="border-t border-border/20 pt-3">
            <FieldRow label="Max Users" hint="Registration closes when this limit is reached">
              <Input
                type="number"
                value={s.maxUsers}
                onChange={(e) => update("maxUsers", parseInt(e.target.value) || 0)}
                min={0}
                className="h-8 text-xs w-32"
              />
            </FieldRow>
          </div>
        )}
      </SectionCard>

      {/* Maintenance Mode */}
      <SectionCard
        icon={AlertTriangle}
        title="Maintenance Mode"
        description="Temporarily restrict access to the app"
      >
        <ToggleRow
          label="Maintenance Mode"
          hint="Non-admin users will see a maintenance page"
          checked={s.maintenanceMode}
          onCheckedChange={(v) => handleToggle("maintenanceMode", v)}
          danger
        />
        {s.maintenanceMode && (
          <div className="border-t border-border/20 pt-3">
            <FieldRow label="Message" hint="Shown to users during maintenance">
              <Textarea
                value={s.maintenanceMessage}
                onChange={(e) => update("maintenanceMessage", e.target.value)}
                placeholder="We're performing scheduled maintenance..."
                className="min-h-[60px] text-xs resize-none"
              />
            </FieldRow>
          </div>
        )}
      </SectionCard>

      {/* Contact & Legal */}
      <SectionCard
        icon={Link2}
        title="Contact & Legal"
        description="Support email and legal page URLs"
      >
        <FieldRow label="Support Email" hint="Displayed in footer and error pages">
          <Input
            value={s.supportEmail}
            onChange={(e) => update("supportEmail", e.target.value)}
            placeholder="support@yourapp.com"
            type="email"
            className="h-8 text-xs"
          />
        </FieldRow>
        <FieldRow label="Privacy Policy URL" hint="Link to your privacy policy">
          <Input
            value={s.privacyUrl}
            onChange={(e) => update("privacyUrl", e.target.value)}
            placeholder="https://yourapp.com/privacy"
            className="h-8 text-xs"
          />
        </FieldRow>
        <FieldRow label="Terms of Service URL" hint="Link to your terms of service">
          <Input
            value={s.termsUrl}
            onChange={(e) => update("termsUrl", e.target.value)}
            placeholder="https://yourapp.com/terms"
            className="h-8 text-xs"
          />
        </FieldRow>
      </SectionCard>

      <div className="flex justify-end pb-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="text-xs h-7"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
