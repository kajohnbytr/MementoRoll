import { ok } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() { await (await createSupabaseServerClient()).auth.signOut(); return ok({ loggedOut: true }); }
