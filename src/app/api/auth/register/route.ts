import { z } from "zod";
import { ok, parseJson, problem } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const input = z.object({ email: z.email(), password: z.string().min(8), fullName: z.string().trim().min(2).max(120) });
export async function POST(request: Request) {
  const parsed = input.safeParse(await parseJson(request));
  if (!parsed.success) return problem(422, "validation_error", "Invalid registration details", parsed.error.flatten());
  const { data, error } = await (await createSupabaseServerClient()).auth.signUp({ email: parsed.data.email, password: parsed.data.password, options: { data: { full_name: parsed.data.fullName } } });
  if (error) return problem(400, "registration_failed", error.message);
  return ok({ userId: data.user?.id }, { status: 201 });
}
