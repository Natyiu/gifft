"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Copy, Check, Loader2, Link2, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { createWishlist } from "@/lib/actions/giftmind";

export type ShareRow = {
  token: string;
  title: string;
  status: string;
  responderName: string | null;
  profileId: string | null;
  preview: { label: string; value: string }[];
};

export function WishlistManager({ shares }: { shares: ShareRow[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  function origin() {
    return typeof window !== "undefined" ? window.location.origin : "";
  }

  function create() {
    start(async () => {
      try {
        const { token } = await createWishlist({ title: title || "Help me find your gift", message });
        setTitle("");
        setMessage("");
        const url = `${origin()}/wishlist/${token}`;
        await navigator.clipboard?.writeText(url).catch(() => {});
        toast.success("Link created and copied — send it to them");
        router.refresh();
      } catch {
        toast.error("Couldn't create the link");
      }
    });
  }

  const filled = shares.filter((s) => s.status === "filled");
  const pending_links = shares.filter((s) => s.status !== "filled");

  function copy(token: string) {
    const url = `${origin()}/wishlist/${token}`;
    navigator.clipboard?.writeText(url);
    setCopied(token);
    toast.success("Link copied");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-serif text-lg font-semibold">Create a wishlist link</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Send it to someone and let them describe themselves. You get the gift ideas — and they discover GiftMind.
        </p>
        <div className="mt-4 space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's it for? e.g. “Sam's birthday”" />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="A friendly note for them (optional)"
            rows={2}
          />
          <Button onClick={create} disabled={pending} className="whitespace-nowrap rounded-full">
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Create link
          </Button>
        </div>
      </div>

      {filled.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Responses</h3>
          <div className="space-y-4">
            {filled.map((s) => {
              const name = s.responderName || "Someone";
              return (
                <div
                  key={s.token}
                  className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-nowrap"
                >
                  <PersonAvatar name={name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-serif text-base font-semibold">{name}</p>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        <CheckCircle2 className="h-3 w-3" /> Filled in · {s.title}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {s.preview.length > 0
                        ? s.preview.map((c) => c.value).join(" · ")
                        : "Open their profile to see everything they shared."}
                    </p>
                  </div>
                  <Link href={`/dashboard/wishlist/${s.token}` as never} className="w-full sm:w-auto">
                    <Button size="sm" className="w-full whitespace-nowrap rounded-full sm:w-auto">
                      <Sparkles className="mr-1 h-4 w-4" /> See answers
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending_links.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Waiting on a response</h3>
          <ul className="space-y-2">
            {pending_links.map((s) => (
              <li key={s.token} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{origin()}/wishlist/{s.token}</p>
                </div>
                <button
                  onClick={() => copy(s.token)}
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  {copied === s.token ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
