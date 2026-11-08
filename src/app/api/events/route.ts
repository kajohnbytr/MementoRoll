import { getUser } from "@/lib/auth";
import { ok, parseJson, problem } from "@/lib/api";
import { eventInput } from "@/lib/validation";
import { hashOpaqueToken, hashPin, randomPin, randomToken } from "@/lib/security/tokens";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function GET() {
  if (!await getUser()) return problem(401, "unauthorized", "Authentication required");
  const { data, error } = await (await createSupabaseServerClient()).from("events").select("id,title,event_date,status,storage_used_bytes,storage_reserved_bytes,storage_quota_bytes,created_at").order("created_at", { ascending: false });
  return error ? problem(500, "events_unavailable", "Events could not be loaded") : ok(data);
}
export async function POST(request: Request) {
  if (!await getUser()) return problem(401, "unauthorized", "Authentication required");
  const parsed = eventInput.safeParse(await parseJson(request)); if (!parsed.success) return problem(422, "validation_error", "Check your event details", parsed.error.flatten());
  const token = randomToken(); const pin = randomPin();
  const { data, error } = await (await createSupabaseServerClient()).rpc("create_event_from_order", { p_order_id: parsed.data.orderId, p_title: parsed.data.title, p_description: parsed.data.description ?? null, p_event_date: parsed.data.eventDate, p_location_name: parsed.data.locationName ?? null, p_token_hash: hashOpaqueToken(token), p_pin_hash: await hashPin(pin), p_opens_at: parsed.data.opensAt, p_closes_at: parsed.data.closesAt });
  if (error) return problem(error.message.includes("entitlement_unavailable") ? 409 : 500, "event_creation_failed", error.message.includes("entitlement_unavailable") ? "That package entitlement is no longer available" : "Event creation failed");
  const accessUrl = new URL(`/e/${token}`, env().NEXT_PUBLIC_APP_URL).toString();
  return ok({ id: data, accessUrl, pin }, { status: 201 });
}
