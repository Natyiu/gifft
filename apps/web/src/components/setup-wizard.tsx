"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronRight, ExternalLink, Eye, EyeOff, Loader2, ArrowLeft, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveSetup } from "@/lib/actions/setup";

type StepId = "supabase" | "auth" | "payment" | "review";

interface StepDef {
  id: StepId;
  label: string;
  description: string;
  required?: boolean;
}

const ALL_STEPS: StepDef[] = [
  { id: "supabase", label: "Supabase (DB & Storage)", description: "Database connection and file storage", required: true },
  { id: "auth", label: "Auth", description: "OAuth, email, and auth options", required: true },
  { id: "payment", label: "Payments", description: "Polar for subscriptions & checkout" },
  { id: "review", label: "Launch", description: "Review & generate .env" },
];

const STEP_TUTORIALS: Partial<Record<StepId, { title: string; duration: string; videoUrl: string }>> = {
  supabase: {
    title: "Setting up Supabase",
    duration: "2:30",
    videoUrl: "",
  },
  auth: {
    title: "Configuring Auth",
    duration: "3:00",
    videoUrl: "",
  },
  payment: {
    title: "Configuring Polar for Payments",
    duration: "2:30",
    videoUrl: "",
  },
  review: {
    title: "Review & Launch",
    duration: "1:00",
    videoUrl: "",
  },
};

type FormData = {
  databaseUrl: string;
  directUrl: string;
  databasePassword: string;
  betterAuthUrl: string;
  corsOrigin: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  resendApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  polarAccessToken: string;
  polarOrganizationId: string;
  polarWebhookSecret: string;
  polarSandboxMode: boolean;
  wantGoogle: boolean;
  emailVerificationEnabled: boolean;
  forgotPasswordEnabled: boolean;
};

const defaultForm: FormData = {
  databaseUrl: "",
  directUrl: "",
  databasePassword: "",
  betterAuthUrl: "http://localhost:3001",
  corsOrigin: "http://localhost:3001",
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceRoleKey: "",
  resendApiKey: "",
  googleClientId: "",
  googleClientSecret: "",
  polarAccessToken: "",
  polarOrganizationId: "",
  polarWebhookSecret: "",
  polarSandboxMode: false,
  wantGoogle: false,
  emailVerificationEnabled: false,
  forgotPasswordEnabled: true,
};

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [currentStep, setCurrentStep] = useState<StepId>("supabase");
  const [saving, setSaving] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visibleSteps = ALL_STEPS;

  const currentIndex = visibleSteps.findIndex((s) => s.id === currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === visibleSteps.length - 1;

  const update = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const toggleSecret = useCallback((key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  function validateStep(): boolean {
    const errs: Record<string, string> = {};

    if (currentStep === "supabase") {
      if (!form.databaseUrl.trim()) errs.databaseUrl = "Required";
      else if (!form.databaseUrl.includes("postgresql") && !form.databaseUrl.includes("postgres://")) errs.databaseUrl = "Must be a PostgreSQL connection string";
      if (!form.directUrl.trim()) errs.directUrl = "Required";
      const hasPlaceholder = form.databaseUrl.includes("[YOUR-PASSWORD]") || form.directUrl.includes("[YOUR-PASSWORD]");
      if (hasPlaceholder && !form.databasePassword.trim()) errs.databasePassword = "Required when using placeholder";
      if (!form.supabaseUrl.trim()) errs.supabaseUrl = "Required";
      if (!form.supabaseServiceRoleKey.trim()) errs.supabaseServiceRoleKey = "Required";
    }

    if (currentStep === "auth") {
      if (!form.betterAuthUrl.trim()) errs.betterAuthUrl = "Required";
      if (!form.corsOrigin.trim()) errs.corsOrigin = "Required";
      if (form.wantGoogle) {
        if (!form.googleClientId.trim()) errs.googleClientId = "Required";
        if (!form.googleClientSecret.trim()) errs.googleClientSecret = "Required";
      }
    }

    if (currentStep === "payment") {
      // Payment is optional - no required validation
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function goNext() {
    if (!validateStep()) return;
    if (isLast) return;
    setVideoOpen(false);
    setCurrentStep(visibleSteps[currentIndex + 1].id);
  }

  function goBack() {
    if (isFirst) return;
    setVideoOpen(false);
    setCurrentStep(visibleSteps[currentIndex - 1].id);
  }

  async function handleFinish() {
    setSaving(true);
    try {
      await saveSetup({
        databaseUrl: form.databaseUrl.trim(),
        directUrl: form.directUrl.trim(),
        databasePassword: form.databasePassword.trim() || undefined,
        betterAuthUrl: form.betterAuthUrl.trim(),
        corsOrigin: form.corsOrigin.trim(),
        supabaseUrl: form.supabaseUrl.trim() || undefined,
        supabaseAnonKey: form.supabaseAnonKey.trim() || undefined,
        supabaseServiceRoleKey: form.supabaseServiceRoleKey.trim() || undefined,
        resendApiKey: form.resendApiKey.trim() || undefined,
        googleClientId: form.wantGoogle ? (form.googleClientId.trim() || undefined) : undefined,
        googleClientSecret: form.wantGoogle ? (form.googleClientSecret.trim() || undefined) : undefined,
        emailVerificationEnabled: form.emailVerificationEnabled,
        forgotPasswordEnabled: form.forgotPasswordEnabled,
        polarAccessToken: form.polarAccessToken.trim() || undefined,
        polarOrganizationId: form.polarOrganizationId.trim() || undefined,
        polarWebhookSecret: form.polarWebhookSecret.trim() || undefined,
        polarSandboxMode: form.polarSandboxMode,
      });
      onComplete();
    } catch {
      setErrors({ _form: "Failed to save .env file. Check file permissions." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="border-b border-border/40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {visibleSteps.map((step, i) => {
              const isCurrent = step.id === currentStep;
              const isDone = i < currentIndex;
              return (
                <div key={step.id} className="flex items-center shrink-0">
                  {i > 0 && (
                    <div className={`w-4 sm:w-6 h-px mx-0.5 ${isDone ? "bg-foreground/40" : "bg-border/40"}`} />
                  )}
                  <button
                    onClick={() => {
                      if (isDone) {
                        setVideoOpen(false);
                        setCurrentStep(step.id);
                      }
                    }}
                    disabled={!isDone && !isCurrent}
                    className={`flex items-center gap-1.5 px-2 py-1 text-[10px] transition-colors ${
                      isCurrent
                        ? "text-foreground font-medium"
                        : isDone
                          ? "text-foreground/60 hover:text-foreground cursor-pointer"
                          : "text-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 flex items-center justify-center text-[8px] font-mono border ${
                        isDone
                          ? "bg-foreground text-background border-foreground"
                          : isCurrent
                            ? "border-foreground text-foreground"
                            : "border-border/40 text-muted-foreground/30"
                      }`}
                    >
                      {isDone ? <Check className="w-2.5 h-2.5" /> : i + 1}
                    </div>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 sm:py-12">
        <div className="max-w-lg w-full">
          <div className="mb-6">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 mb-1">
              Step {currentIndex + 1} of {visibleSteps.length}
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              {visibleSteps[currentIndex].label}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {visibleSteps[currentIndex].description}
            </p>
          </div>

          {STEP_TUTORIALS[currentStep] && (
            <VideoTutorial
              tutorial={STEP_TUTORIALS[currentStep]}
              open={videoOpen}
              onToggle={() => setVideoOpen(!videoOpen)}
            />
          )}

          {currentStep === "supabase" && (
            <SupabaseStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "auth" && (
            <AuthStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "payment" && (
            <PaymentStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "review" && (
            <ReviewStep form={form} />
          )}

          {errors._form && (
            <p className="text-xs text-red-500 mt-3">{errors._form}</p>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={isFirst}
              className="text-xs h-8 gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Back
            </Button>

            {isLast ? (
              <Button
                size="sm"
                onClick={handleFinish}
                disabled={saving}
                className="text-xs h-8 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Generating .env...
                  </>
                ) : (
                  <>
                    Generate .env & Launch
                    <ChevronRight className="w-3 h-3" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={goNext}
                className="text-xs h-8 gap-1 bg-foreground text-background hover:bg-foreground/90"
              >
                Continue
                <ChevronRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// -- Step Components --

type StepProps = {
  form: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  errors: Record<string, string>;
  showSecrets: Record<string, boolean>;
  toggleSecret: (key: string) => void;
};

function SupabaseStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  return (
    <div className="space-y-5">
      <Hint>
        Configure your <strong>Supabase</strong> project for database and file storage.{" "}
        <HintLink href="https://supabase.com/dashboard">Create a project</HintLink> →{" "}
        <strong>Settings → Database</strong> for connection strings, <strong>Settings → API</strong> for keys.
        We&apos;ll create storage buckets automatically.
      </Hint>

      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Database</p>

      <FieldGroup>
        <FieldLabel htmlFor="databasePassword">Database password</FieldLabel>
        <FieldHint>
          Enter your database password. We&apos;ll embed it into the URLs above when saving. Required if your URLs contain the placeholder.
        </FieldHint>
        <SecretField
          id="databasePassword"
          value={form.databasePassword}
          onChange={(v) => update("databasePassword", v)}
          show={showSecrets.databasePassword}
          onToggle={() => toggleSecret("databasePassword")}
          placeholder="Your database password"
          error={errors.databasePassword}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="databaseUrl">Transaction URL <Required /></FieldLabel>
        <FieldHint>
          Copy the <strong>Transaction</strong> connection string (port 6543) from Supabase. Paste as-is with the{" "}
          <code className="bg-muted/50 px-1 text-[9px]">[YOUR-PASSWORD]</code> placeholder.
        </FieldHint>
        <SecretField
          id="databaseUrl"
          value={form.databaseUrl}
          onChange={(v) => update("databaseUrl", v)}
          show={showSecrets.databaseUrl}
          onToggle={() => toggleSecret("databaseUrl")}
          placeholder="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
          error={errors.databaseUrl}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="directUrl">Direct URL <Required /></FieldLabel>
        <FieldHint>
          Copy the <strong>Session / Direct</strong> connection string (port 5432). Paste as-is with the{" "}
          <code className="bg-muted/50 px-1 text-[9px]">[YOUR-PASSWORD]</code> placeholder.
        </FieldHint>
        <SecretField
          id="directUrl"
          value={form.directUrl}
          onChange={(v) => update("directUrl", v)}
          show={showSecrets.directUrl}
          onToggle={() => toggleSecret("directUrl")}
          placeholder="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres"
          error={errors.directUrl}
        />
      </FieldGroup>

     

      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-6">Storage</p>
      <FieldGroup>
        <FieldLabel htmlFor="supabaseUrl">Project URL <Required /></FieldLabel>
        <PlainField
          id="supabaseUrl"
          value={form.supabaseUrl}
          onChange={(v) => update("supabaseUrl", v)}
          placeholder="https://xxxxxx.supabase.co"
          error={errors.supabaseUrl}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="supabaseAnonKey">Anon / Public Key</FieldLabel>
        <FieldHint>Used on the client side for public file access.</FieldHint>
        <SecretField
          id="supabaseAnonKey"
          value={form.supabaseAnonKey}
          onChange={(v) => update("supabaseAnonKey", v)}
          show={showSecrets.supabaseAnonKey}
          onToggle={() => toggleSecret("supabaseAnonKey")}
          placeholder="eyJhbGciOi..."
          error={errors.supabaseAnonKey}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="supabaseServiceRoleKey">Service Role Key <Required /></FieldLabel>
        <FieldHint>Server-only. Used for uploads and admin operations.</FieldHint>
        <SecretField
          id="supabaseServiceRoleKey"
          value={form.supabaseServiceRoleKey}
          onChange={(v) => update("supabaseServiceRoleKey", v)}
          show={showSecrets.supabaseServiceRoleKey}
          onToggle={() => toggleSecret("supabaseServiceRoleKey")}
          placeholder="eyJhbGciOi..."
          error={errors.supabaseServiceRoleKey}
        />
      </FieldGroup>
    </div>
  );
}

function AuthStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Configure auth options. You can enable OAuth, email, or skip and add later from Admin Dashboard.
      </p>

      <FieldGroup>
        <FieldLabel htmlFor="betterAuthUrl">App URL <Required /></FieldLabel>
        <FieldHint>Where your app runs. In development this is usually localhost:3001.</FieldHint>
        <PlainField
          id="betterAuthUrl"
          value={form.betterAuthUrl}
          onChange={(v) => {
            update("betterAuthUrl", v);
            update("corsOrigin", v);
          }}
          placeholder="http://localhost:3001"
          error={errors.betterAuthUrl}
        />
      </FieldGroup>

      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">OAuth (Google)</p>
      <div className="space-y-3">
        <FeatureToggle
          title="Google"
          description="Sign in with Google"
          checked={form.wantGoogle}
          onChange={(v) => update("wantGoogle", v)}
        />
        {form.wantGoogle && (
          <div className="ml-6 space-y-4 border-l border-border/30 pl-4">
            <Hint>
              <HintLink href="https://console.cloud.google.com/apis/credentials">Google Cloud Console</HintLink> →
              Create OAuth 2.0 Client. Add redirect URI:{" "}
              <code className="bg-muted/50 px-1 text-[9px]">{form.betterAuthUrl}/api/auth/callback/google</code>
            </Hint>
            <FieldGroup>
              <FieldLabel htmlFor="googleClientId">Client ID <Required /></FieldLabel>
              <PlainField
                id="googleClientId"
                value={form.googleClientId}
                onChange={(v) => update("googleClientId", v)}
                placeholder="xxxx.apps.googleusercontent.com"
                error={errors.googleClientId}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="googleClientSecret">Client Secret <Required /></FieldLabel>
              <SecretField
                id="googleClientSecret"
                value={form.googleClientSecret}
                onChange={(v) => update("googleClientSecret", v)}
                show={showSecrets.googleClientSecret}
                onToggle={() => toggleSecret("googleClientSecret")}
                placeholder="GOCSPX-xxxxxxxxxx"
                error={errors.googleClientSecret}
              />
            </FieldGroup>
          </div>
        )}
      </div>

      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Email (Resend)</p>
      <Hint>
        <HintLink href="https://resend.com/signup">Sign up at Resend</HintLink> →{" "}
        <strong>API Keys</strong> → create a key. Used for password reset and verification emails.
      </Hint>
      <FieldGroup>
        <FieldLabel htmlFor="resendApiKey">Resend API Key</FieldLabel>
        <SecretField
          id="resendApiKey"
          value={form.resendApiKey}
          onChange={(v) => update("resendApiKey", v)}
          show={showSecrets.resendApiKey}
          onToggle={() => toggleSecret("resendApiKey")}
          placeholder="re_xxxxxxxxxx"
          error={errors.resendApiKey}
        />
      </FieldGroup>

      <div className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2.5">
        <div>
          <p className="text-xs font-medium">Email verification</p>
          <p className="text-[10px] text-muted-foreground">Require users to verify their email before accessing the app</p>
        </div>
        <Switch
          checked={form.emailVerificationEnabled}
          onCheckedChange={(v) => update("emailVerificationEnabled", v)}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2.5">
        <div>
          <p className="text-xs font-medium">Forgot password</p>
          <p className="text-[10px] text-muted-foreground">Show &quot;Forgot?&quot; link on login. Requires Resend API key above to send reset emails.</p>
        </div>
        <Switch
          checked={form.forgotPasswordEnabled}
          onCheckedChange={(v) => update("forgotPasswordEnabled", v)}
        />
      </div>

      <div className="border border-dashed border-border/40 px-3 py-2.5">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          You can change these later in <strong>Admin → Features</strong> and <strong>Admin → API Keys</strong>.
        </p>
      </div>
    </div>
  );
}

function PaymentStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  return (
    <div className="space-y-5">
      <Hint>
        <HintLink href={form.polarSandboxMode ? "https://sandbox.polar.sh" : "https://polar.sh/dashboard"}>
          {form.polarSandboxMode ? "Sandbox Dashboard" : "Polar Dashboard"}
        </HintLink>{" "}
        → Settings → Access Tokens. Create an <strong>Organization Access Token</strong> with{" "}
        <code className="bg-muted/50 px-1 text-[9px]">products:read</code> and{" "}
        <code className="bg-muted/50 px-1 text-[9px]">products:write</code>.
        Use sandbox for testing.
      </Hint>

      <div className="flex items-center justify-between rounded-md border border-border/40 px-3 py-2">
        <Label htmlFor="polarSandboxMode" className="text-xs font-medium">
          Sandbox mode
        </Label>
        <Switch
          id="polarSandboxMode"
          checked={form.polarSandboxMode}
          onCheckedChange={(v) => update("polarSandboxMode", v)}
        />
      </div>

      <FieldGroup>
        <FieldLabel htmlFor="polarAccessToken">
          Access Token <Required />
        </FieldLabel>
        <SecretField
          id="polarAccessToken"
          value={form.polarAccessToken}
          onChange={(v) => update("polarAccessToken", v)}
          show={showSecrets.polarAccessToken}
          onToggle={() => toggleSecret("polarAccessToken")}
          placeholder="polar_at_xxxxxxxxxx"
          error={errors.polarAccessToken}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="polarOrganizationId">Organization ID</FieldLabel>
        <FieldHint>Optional when using an Organization Access Token.</FieldHint>
        <PlainField
          id="polarOrganizationId"
          value={form.polarOrganizationId}
          onChange={(v) => update("polarOrganizationId", v)}
          placeholder="UUID from Polar dashboard"
          error={errors.polarOrganizationId}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="polarWebhookSecret">Webhook Secret</FieldLabel>
        <FieldHint>From Polar → Webhooks. Required for subscription sync.</FieldHint>
        <SecretField
          id="polarWebhookSecret"
          value={form.polarWebhookSecret}
          onChange={(v) => update("polarWebhookSecret", v)}
          show={showSecrets.polarWebhookSecret}
          onToggle={() => toggleSecret("polarWebhookSecret")}
          placeholder="From Polar Dashboard → Webhooks"
          error={errors.polarWebhookSecret}
        />
      </FieldGroup>

      <div className="border border-dashed border-border/40 px-3 py-2.5">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          Webhook URL: <code className="bg-muted/50 px-1 text-[9px]">{form.betterAuthUrl}/api/webhooks/polar</code>.
          For local dev, use ngrok. Configure in Polar → Webhooks.
        </p>
      </div>
    </div>
  );
}

function ReviewStep({ form }: { form: FormData }) {
  const authItems: { label: string; value: string; masked?: boolean }[] = [
    { label: "App URL", value: form.betterAuthUrl },
    { label: "Email verification", value: form.emailVerificationEnabled ? "Yes" : "No" },
    { label: "Forgot password", value: form.forgotPasswordEnabled ? "Yes" : "No" },
  ];
  if (form.resendApiKey) authItems.push({ label: "Resend API Key", value: form.resendApiKey, masked: true });
  if (form.wantGoogle) authItems.push({ label: "Google Client ID", value: form.googleClientId });

  const sections: { title: string; items: { label: string; value: string; masked?: boolean }[] }[] = [
    {
      title: "Supabase (DB & Storage)",
      items: [
        { label: "Transaction URL", value: form.databaseUrl, masked: true },
        { label: "Direct URL", value: form.directUrl, masked: true },
        { label: "Project URL", value: form.supabaseUrl },
        { label: "Service Role Key", value: form.supabaseServiceRoleKey, masked: true },
      ],
    },
    { title: "Auth", items: authItems },
  ];

  if (form.polarAccessToken) {
    sections.push({
      title: "Payments",
      items: [
        { label: "Polar Access Token", value: form.polarAccessToken, masked: true },
        { label: "Sandbox Mode", value: form.polarSandboxMode ? "Yes" : "No" },
      ],
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-foreground/20 bg-foreground/5 px-3 py-2.5">
        <p className="text-[11px] font-medium text-foreground mb-0.5">First account = admin</p>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          The first user to sign up will automatically be an admin with full access to the dashboard, users, and settings.
        </p>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-4">
        Review your configuration. Clicking <strong>Generate .env & Launch</strong> will create your{" "}
        <code className="bg-muted/50 px-1 text-[9px]">apps/web/.env</code> file.
      </p>

      {sections.map((section) => (
        <div key={section.title} className="border border-border/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">
            {section.title}
          </p>
          <div className="space-y-1.5">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <span className="text-[10px] text-muted-foreground shrink-0">{item.label}</span>
                <span className="text-[10px] font-mono text-foreground/60 truncate max-w-[200px]">
                  {item.value ? (item.masked ? maskValue(item.value) : item.value) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="border border-dashed border-border/40 px-3 py-2.5 mt-2">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          After generating, run:{" "}
          <code className="bg-muted/50 px-1 text-[9px]">pnpm db:generate && pnpm db:push</code>{" "}
          to set up your database, then{" "}
          <code className="bg-muted/50 px-1 text-[9px]">pnpm dev</code> to start.
        </p>
      </div>
    </div>
  );
}

// -- Shared UI Primitives --

function FeatureToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 border transition-colors text-left cursor-pointer ${
        checked
          ? "border-foreground/20 bg-foreground/3"
          : "border-border/40 hover:border-border/60"
      }`}
    >
      <div
        className={`w-4 h-4 flex items-center justify-center border shrink-0 ${
          checked
            ? "bg-foreground border-foreground text-background"
            : "border-border/60"
        }`}
      >
        {checked && <Check className="w-2.5 h-2.5" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{title}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1.5">{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-[11px] font-medium">
      {children}
    </Label>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-muted-foreground/60 leading-relaxed">{children}</p>;
}

function Required() {
  return <span className="text-red-400 ml-0.5">*</span>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/30 border border-border/30 px-3 py-2.5 text-[10px] text-muted-foreground leading-relaxed">
      {children}
    </div>
  );
}

function HintLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline inline-flex items-center gap-0.5 text-foreground/70 hover:text-foreground"
    >
      {children}
      <ExternalLink className="w-2.5 h-2.5" />
    </a>
  );
}

function PlainField({
  id,
  value,
  onChange,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-8 text-xs font-mono ${error ? "border-red-400" : ""}`}
      />
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function SecretField({
  id,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  error,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`h-8 text-xs pr-8 font-mono ${error ? "border-red-400" : ""}`}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function maskValue(val: string): string {
  if (val.length <= 8) return "••••••••";
  return val.slice(0, 4) + "••••" + val.slice(-4);
}

function VideoTutorial({
  tutorial,
  open,
  onToggle,
}: {
  tutorial: { title: string; duration: string; videoUrl: string };
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-5">
      {!open ? (
        <button
          type="button"
          onClick={onToggle}
          className="group flex items-center gap-2 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
        >
          <div className="w-5 h-5 border border-border/40 group-hover:border-foreground/20 flex items-center justify-center transition-colors">
            <Play className="w-2.5 h-2.5 ml-px" />
          </div>
          <span>Watch: {tutorial.title}</span>
          <span className="text-muted-foreground/30">{tutorial.duration}</span>
        </button>
      ) : (
        <div className="border border-border/40">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <div className="flex items-center gap-2">
              <Play className="w-2.5 h-2.5 text-foreground/40" />
              <span className="text-[10px] font-medium text-foreground/70">{tutorial.title}</span>
              <span className="text-[9px] text-muted-foreground/40">{tutorial.duration}</span>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="text-muted-foreground/40 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Video placeholder */}
          <div className="relative bg-foreground/3 aspect-video flex items-center justify-center">
            <div className="absolute inset-0">
              <svg className="w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="vidDots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                    <circle cx="6" cy="6" r="0.5" className="fill-foreground/10" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#vidDots)" />
              </svg>
            </div>
            <div className="relative flex flex-col items-center gap-2">
              <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center">
                <Play className="w-4 h-4 text-foreground/20 ml-0.5" />
              </div>
              <p className="text-[9px] text-muted-foreground/30">
                Video tutorial coming soon
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
