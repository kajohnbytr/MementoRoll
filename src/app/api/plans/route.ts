import { ok, problem } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export async function GET() { const { data, error } = await (await createSupabaseServerClient()).from("plans").select("id,name,storage_quota_bytes,retention_days,price_minor,currency").eq("is_active", true).order("price_minor"); return error ? problem(500, "plans_unavailable", "Packages could not be loaded") : ok(data); }
