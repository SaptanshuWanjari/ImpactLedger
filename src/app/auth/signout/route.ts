import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  const allCookies = request.cookies.getAll();
  for (const cookie of allCookies) {
    if (cookie.name.startsWith("sb-")) {
      response.cookies.set(cookie.name, "", { path: "/", maxAge: 0 });
    }
  }
}

async function handleSignout(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.redirect(new URL("/auth/login", request.url));
  clearSupabaseCookies(request, response);
  return response;
}

export async function POST(request: NextRequest) {
  return handleSignout(request);
}

// Backward compatibility for existing direct links.
export async function GET(request: NextRequest) {
  return handleSignout(request);
}
