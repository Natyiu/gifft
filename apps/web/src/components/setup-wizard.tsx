"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronRight, ExternalLink, Eye, EyeOff, Loader2, RefreshCw, ArrowLeft, Play, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveSetup, generateAuthSecret } from "@/lib/actions/setup";

type StepId = "database" | "auth" | "features" | "storage" | "email" | "social" | "payment" | "review";

interface StepDef {
  id: StepId;
  label: string;
  description: string;
  required?: boolean;
  conditional?: boolean;
}

const ALL_STEPS: StepDef[] = [
  { id: "database", label: "Database", description: "Supabase PostgreSQL connection", required: true },
  { id: "auth", label: "Authentication", description: "Auth secret & app URL", required: true },
  { id: "features", label: "Features", description: "What does your app need?" },
  { id: "storage", label: "Storage", description: "Supabase storage for uploads & avatars", conditional: true },
  { id: "email", label: "Email", description: "Resend for transactional emails", conditional: true },
  { id: "social", label: "Social Login", description: "Google & GitHub OAuth", conditional: true },
  { id: "payment", label: "Payments", description: "Polar for subscriptions & checkout", conditional: true },
  { id: "review", label: "Launch", description: "Review & generate .env" },
];

const STEP_TUTORIALS: Partial<Record<StepId, { title: string; duration: string; videoUrl: string }>> = {
  database: {
    title: "Setting up Supabase Database",
    duration: "2:30",
    videoUrl: "",
  },
  auth: {
    title: "Configuring Authentication",
    duration: "1:45",
    videoUrl: "",
  },
  storage: {
    title: "Setting up Storage Buckets",
    duration: "2:00",
    videoUrl: "",
  },
  features: {
    title: "Choosing Features",
    duration: "1:00",
    videoUrl: "",
  },
  email: {
    title: "Configuring Resend for Email",
    duration: "1:30",
    videoUrl: "",
  },
  social: {
    title: "Setting up OAuth Providers",
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
  betterAuthSecret: string;
  betterAuthUrl: string;
  corsOrigin: string;
  wantEmail: boolean;
  wantSocial: boolean;
  wantPayment: boolean;
  wantStorage: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  resendApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  githubClientId: string;
  githubClientSecret: string;
  polarAccessToken: string;
  polarOrganizationId: string;
  polarWebhookSecret: string;
  polarSandboxMode: boolean;
  wantGoogle: boolean;
  wantGithub: boolean;
};

const defaultForm: FormData = {
  databaseUrl: "",
  directUrl: "",
  betterAuthSecret: "",
  betterAuthUrl: "http://localhost:3001",
  corsOrigin: "http://localhost:3001",
  wantEmail: false,
  wantSocial: false,
  wantPayment: false,
  wantStorage: false,
  supabaseUrl: "",
  supabaseAnonKey: "",
  supabaseServiceRoleKey: "",
  resendApiKey: "",
  googleClientId: "",
  googleClientSecret: "",
  githubClientId: "",
  githubClientSecret: "",
  polarAccessToken: "",
  polarOrganizationId: "",
  polarWebhookSecret: "",
  polarSandboxMode: false,
  wantGoogle: false,
  wantGithub: false,
};

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [currentStep, setCurrentStep] = useState<StepId>("database");
  const [saving, setSaving] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const visibleSteps = ALL_STEPS.filter((s) => {
    if (s.id === "email") return form.wantEmail;
    if (s.id === "social") return form.wantSocial;
    if (s.id === "payment") return form.wantPayment;
    if (s.id === "storage") return form.wantStorage;
    return true;
  });

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

    if (currentStep === "database") {
      if (!form.databaseUrl.trim()) errs.databaseUrl = "Required";
      else if (!form.databaseUrl.includes("postgresql")) errs.databaseUrl = "Must be a PostgreSQL connection string";
      if (!form.directUrl.trim()) errs.directUrl = "Required";
    }

    if (currentStep === "auth") {
      if (!form.betterAuthSecret.trim()) errs.betterAuthSecret = "Required";
      else if (form.betterAuthSecret.length < 32) errs.betterAuthSecret = "Must be at least 32 characters";
      if (!form.betterAuthUrl.trim()) errs.betterAuthUrl = "Required";
      if (!form.corsOrigin.trim()) errs.corsOrigin = "Required";
    }

    if (currentStep === "storage") {
      if (!form.supabaseUrl.trim()) errs.supabaseUrl = "Required for file storage";
      if (!form.supabaseServiceRoleKey.trim()) errs.supabaseServiceRoleKey = "Required for server-side uploads";
    }

    if (currentStep === "social") {
      if (form.wantGoogle) {
        if (!form.googleClientId.trim()) errs.googleClientId = "Required";
        if (!form.googleClientSecret.trim()) errs.googleClientSecret = "Required";
      }
      if (form.wantGithub) {
        if (!form.githubClientId.trim()) errs.githubClientId = "Required";
        if (!form.githubClientSecret.trim()) errs.githubClientSecret = "Required";
      }
    }

    if (currentStep === "payment") {
      if (!form.polarAccessToken.trim()) errs.polarAccessToken = "Required";
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
        betterAuthSecret: form.betterAuthSecret.trim(),
        betterAuthUrl: form.betterAuthUrl.trim(),
        corsOrigin: form.corsOrigin.trim(),
        supabaseUrl: form.wantStorage ? (form.supabaseUrl.trim() || undefined) : undefined,
        supabaseAnonKey: form.wantStorage ? (form.supabaseAnonKey.trim() || undefined) : undefined,
        supabaseServiceRoleKey: form.wantStorage ? (form.supabaseServiceRoleKey.trim() || undefined) : undefined,
        resendApiKey: form.resendApiKey.trim() || undefined,
        googleClientId: form.googleClientId.trim() || undefined,
        googleClientSecret: form.googleClientSecret.trim() || undefined,
        githubClientId: form.githubClientId.trim() || undefined,
        githubClientSecret: form.githubClientSecret.trim() || undefined,
        polarAccessToken: form.wantPayment ? form.polarAccessToken.trim() || undefined : undefined,
        polarOrganizationId: form.wantPayment ? form.polarOrganizationId.trim() || undefined : undefined,
        polarWebhookSecret: form.wantPayment ? form.polarWebhookSecret.trim() || undefined : undefined,
        polarSandboxMode: form.wantPayment ? form.polarSandboxMode : undefined,
      });
      onComplete();
    } catch {
      setErrors({ _form: "Failed to save .env file. Check file permissions." });
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateSecret() {
    const secret = await generateAuthSecret();
    update("betterAuthSecret", secret);
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

          {currentStep === "database" && (
            <DatabaseStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "auth" && (
            <AuthStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} onGenerateSecret={handleGenerateSecret} />
          )}
          {currentStep === "features" && (
            <FeaturesStep form={form} update={update} />
          )}
          {currentStep === "storage" && (
            <StorageStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "email" && (
            <EmailStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
          )}
          {currentStep === "social" && (
            <SocialStep form={form} update={update} errors={errors} showSecrets={showSecrets} toggleSecret={toggleSecret} />
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

function DatabaseStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  return (
    <div className="space-y-5">
      <Hint>
        You need a <strong>Supabase</strong> PostgreSQL database.{" "}
        <HintLink href="https://supabase.com/dashboard">Create a project</HintLink> → then go to{" "}
        <strong>Settings → Database → Connection string</strong>.
      </Hint>

      <FieldGroup>
        <FieldLabel htmlFor="databaseUrl">
          Transaction URL <Required />
        </FieldLabel>
        <FieldHint>
          Use the <strong>Transaction</strong> connection string (port 6543). Append{" "}
          <code className="bg-muted/50 px-1 text-[9px]">?pgbouncer=true</code> if not already there.
        </FieldHint>
        <SecretField
          id="databaseUrl"
          value={form.databaseUrl}
          onChange={(v) => update("databaseUrl", v)}
          show={showSecrets.databaseUrl}
          onToggle={() => toggleSecret("databaseUrl")}
          placeholder="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
          error={errors.databaseUrl}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="directUrl">
          Direct URL <Required />
        </FieldLabel>
        <FieldHint>
          The <strong>Session / Direct</strong> connection string (port 5432). Used by Prisma for migrations.
        </FieldHint>
        <SecretField
          id="directUrl"
          value={form.directUrl}
          onChange={(v) => update("directUrl", v)}
          show={showSecrets.directUrl}
          onToggle={() => toggleSecret("directUrl")}
          placeholder="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
          error={errors.directUrl}
        />
      </FieldGroup>
    </div>
  );
}

function AuthStep({ form, update, errors, showSecrets, toggleSecret, onGenerateSecret }: StepProps & { onGenerateSecret: () => void }) {
  return (
    <div className="space-y-5">
      <Hint>
        The auth secret is used to sign sessions and tokens. Generate one below or use{" "}
        <code className="bg-muted/50 px-1 text-[9px]">openssl rand -base64 32</code> in your terminal.
      </Hint>

      <FieldGroup>
        <FieldLabel htmlFor="betterAuthSecret">
          Auth Secret <Required />
        </FieldLabel>
        <FieldHint>At least 32 characters. Keep this private.</FieldHint>
        <div className="flex gap-1.5">
          <div className="flex-1">
            <SecretField
              id="betterAuthSecret"
              value={form.betterAuthSecret}
              onChange={(v) => update("betterAuthSecret", v)}
              show={showSecrets.betterAuthSecret}
              onToggle={() => toggleSecret("betterAuthSecret")}
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              error={errors.betterAuthSecret}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateSecret}
            className="h-8 text-[10px] gap-1 shrink-0"
            type="button"
          >
            <RefreshCw className="w-3 h-3" />
            Generate
          </Button>
        </div>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="betterAuthUrl">
          App URL <Required />
        </FieldLabel>
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
    </div>
  );
}

function FeaturesStep({ form, update }: Pick<StepProps, "form" | "update">) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        A few quick questions. Say yes to set it up now, or skip and add it later from the admin dashboard.
      </p>

      <FeatureQuestion
        question="Will users upload stuff?"
        detail="Photos, videos, profile pictures — anything they can upload. We&apos;ll set this up for you."
        checked={form.wantStorage}
        onChange={(v) => update("wantStorage", v)}
      />
      <FeatureQuestion
        question="Do you want to send emails to users?"
        detail="Like when someone signs up — verify their email, or let them reset their password."
        checked={form.wantEmail}
        onChange={(v) => update("wantEmail", v)}
      />
      <FeatureQuestion
        question="Sign in with Google?"
        detail="Let people use their Google account instead of creating a password."
        checked={form.wantSocial}
        onChange={(v) => update("wantSocial", v)}
      />
      <FeatureQuestion
        question="Will you charge for your app?"
        detail="Subscriptions, one-time payments — we&apos;ll help you set that up."
        checked={form.wantPayment}
        onChange={(v) => update("wantPayment", v)}
      />
    </div>
  );
}

function StorageStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  return (
    <div className="space-y-5">
      <Hint>
        We&apos;ll use these keys for avatars, file uploads, and attachments. In your Supabase project, go to{" "}
        <HintLink href="https://supabase.com/dashboard">Dashboard</HintLink> → <strong>Settings → API</strong> to find them.
        We&apos;ll create the storage buckets for you automatically.
      </Hint>

      <FieldGroup>
        <FieldLabel htmlFor="supabaseUrl">
          Project URL <Required />
        </FieldLabel>
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
        <FieldLabel htmlFor="supabaseServiceRoleKey">
          Service Role Key <Required />
        </FieldLabel>
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

function EmailStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  return (
    <div className="space-y-5">
      <Hint>
        <HintLink href="https://resend.com/signup">Sign up at Resend</HintLink> →{" "}
        <strong>API Keys</strong> → create a key. Free tier covers 100 emails/day.
        You&apos;ll also need to{" "}
        <HintLink href="https://resend.com/domains">verify a domain</HintLink> for production use.
      </Hint>

      <FieldGroup>
        <FieldLabel htmlFor="resendApiKey">API Key</FieldLabel>
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

      <div className="border border-dashed border-border/40 px-3 py-2.5">
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
          Without email configured, password resets and email verification will be silently skipped. 
          You can add this later in <strong>Admin → API Keys</strong>.
        </p>
      </div>
    </div>
  );
}

function SocialStep({ form, update, errors, showSecrets, toggleSecret }: StepProps) {
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Select which OAuth providers to configure. You can enable both, one, or skip entirely.
      </p>

      {/* Google */}
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

      {/* GitHub */}
      <div className="space-y-3">
        <FeatureToggle
          title="GitHub"
          description="Sign in with GitHub"
          checked={form.wantGithub}
          onChange={(v) => update("wantGithub", v)}
        />
        {form.wantGithub && (
          <div className="ml-6 space-y-4 border-l border-border/30 pl-4">
            <Hint>
              <HintLink href="https://github.com/settings/developers">GitHub Developer Settings</HintLink> →
              New OAuth App. Callback URL:{" "}
              <code className="bg-muted/50 px-1 text-[9px]">{form.betterAuthUrl}/api/auth/callback/github</code>
            </Hint>
            <FieldGroup>
              <FieldLabel htmlFor="githubClientId">Client ID <Required /></FieldLabel>
              <PlainField
                id="githubClientId"
                value={form.githubClientId}
                onChange={(v) => update("githubClientId", v)}
                placeholder="Iv1.xxxxxxxxxx"
                error={errors.githubClientId}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="githubClientSecret">Client Secret <Required /></FieldLabel>
              <SecretField
                id="githubClientSecret"
                value={form.githubClientSecret}
                onChange={(v) => update("githubClientSecret", v)}
                show={showSecrets.githubClientSecret}
                onToggle={() => toggleSecret("githubClientSecret")}
                placeholder="xxxxxxxxxxxxxxxxxxxxxxx"
                error={errors.githubClientSecret}
              />
            </FieldGroup>
          </div>
        )}
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
  const sections = [
    {
      title: "Database",
      items: [
        { label: "Transaction URL", value: form.databaseUrl, masked: true },
        { label: "Direct URL", value: form.directUrl, masked: true },
      ],
    },
    {
      title: "Authentication",
      items: [
        { label: "Auth Secret", value: form.betterAuthSecret, masked: true },
        { label: "App URL", value: form.betterAuthUrl },
      ],
    },
  ];

  if (form.wantStorage) {
    sections.push({
      title: "File Storage",
      items: [
        { label: "Supabase URL", value: form.supabaseUrl },
        { label: "Service Role Key", value: form.supabaseServiceRoleKey, masked: true },
      ],
    });
  }
  if (form.wantEmail) {
    sections.push({
      title: "Email",
      items: [{ label: "Resend API Key", value: form.resendApiKey, masked: true }],
    });
  }
  if (form.wantSocial && (form.wantGoogle || form.wantGithub)) {
    const items: { label: string; value: string; masked?: boolean }[] = [];
    if (form.wantGoogle) items.push({ label: "Google Client ID", value: form.googleClientId });
    if (form.wantGithub) items.push({ label: "GitHub Client ID", value: form.githubClientId });
    sections.push({ title: "Social Login", items });
  }
  if (form.wantPayment && form.polarAccessToken) {
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

function FeatureQuestion({
  question,
  detail,
  checked,
  onChange,
}: {
  question: string;
  detail: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="border border-border/40 rounded-md overflow-hidden">
      <div className="px-3 py-3 bg-muted/20">
        <p className="text-xs font-medium text-foreground">{question}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{detail}</p>
      </div>
      <div className="flex border-t border-border/30">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition-colors ${
            checked
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          }`}
        >
          Yes, configure
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition-colors border-l border-border/30 ${
            !checked
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
          }`}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

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
