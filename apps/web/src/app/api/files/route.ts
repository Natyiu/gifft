import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bucket = req.nextUrl.searchParams.get("bucket") ?? "uploads";
  const prefix = req.nextUrl.searchParams.get("prefix") ?? session.user.id;

  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Storage not configured. Add Supabase keys in Admin > Settings." }, { status: 500 });
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { sortBy: { column: "created_at", order: "desc" } });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ files: data ?? [] });
}
