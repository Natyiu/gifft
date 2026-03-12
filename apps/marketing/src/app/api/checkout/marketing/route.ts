import { NextRequest, NextResponse } from "next/server";
import { createMarketingCheckout } from "@/lib/actions/polar";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const result = await createMarketingCheckout(origin);

  if (result.error) {
    return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(result.error)}`, origin));
  }

  if (result.url) {
    return NextResponse.redirect(result.url);
  }

  return NextResponse.redirect(new URL("/?error=Checkout+failed", origin));
}
