import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function loginUrl(request: Request, error?: string) {
  const url = new URL("/login", request.url);
  if (error) url.searchParams.set("error", error);
  return url;
}

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== requestUrl.host) {
    return NextResponse.redirect(loginUrl(request, "invalid_request"), 303);
  }

  const contentType = request.headers.get("content-type") ?? "";
  const raw = contentType.includes("application/json")
    ? await request.json().catch(() => null)
    : Object.fromEntries(await request.formData());
  const parsed = credentials.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.redirect(loginUrl(request, "invalid_credentials"), 303);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return NextResponse.redirect(loginUrl(request, "invalid_credentials"), 303);
  }

  return NextResponse.redirect(new URL("/dashboard", request.url), 303);
}
