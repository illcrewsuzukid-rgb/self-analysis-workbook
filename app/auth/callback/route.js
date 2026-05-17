import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const baseUrl = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;

  if (!code) {
    console.error("[auth/callback] no code in URL", request.url);
    return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
  }

  const supabase = getSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchange failed", error);
    return NextResponse.redirect(
      `${baseUrl}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${baseUrl}${next}`);
}
