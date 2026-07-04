// Shape of the gift request a guest fills out before signing in.
// Persisted to localStorage so the reveal page can pick it up post-auth.
import type { ProfileInput } from "@/lib/actions/giftmind";

export const DRAFT_KEY = "giftmind:draft";

export type GuestDraft = {
  recipientName: string;
  profile: ProfileInput;
  occasion: string;
  tone: string;
  budgetMin: number;
  budgetMax: number;
  neverBuyFilter: boolean;
};

export function loadDraft(): GuestDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestDraft;
    if (!parsed?.profile?.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: GuestDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_KEY);
}
