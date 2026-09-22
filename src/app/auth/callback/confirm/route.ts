import { type NextRequest, NextResponse } from "next/server";

import { createWritableClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/registro?error=confirmacion", request.url));
  }

  const supabase = await createWritableClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/registro?error=confirmacion", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
