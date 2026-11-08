import { z } from "zod";
import { getUser } from "@/lib/auth";
import { ok, parseJson, problem } from "@/lib/api";
import { env } from "@/lib/env";
import { ensureDevelopmentCoupons } from "@/lib/billing/test-coupons";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const input = z.object({ planId: z.string().uuid(), couponCode: z.string().trim().min(4).max(40).transform(value => value.toUpperCase()) });

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return problem(401, "unauthorized", "Authentication required");
  const unused = new URL(request.url).searchParams.get("unused") === "1";
  let query = (await createSupabaseServerClient()).from("orders").select("id,status,subtotal_minor,discount_minor,amount_minor,currency,created_at,plans(id,name,storage_quota_bytes,retention_days),coupons(code)").order("created_at", { ascending: false });
  if (unused) query = query.eq("status", "paid").is("consumed_at", null);
  const { data, error } = await query;
  return error ? problem(500, "orders_unavailable", "Orders could not be loaded") : ok(data);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return problem(401, "unauthorized", "Authentication required");
  const parsed = input.safeParse(await parseJson(request));
  if (!parsed.success) return problem(422, "validation_error", "Choose a package and enter a valid coupon code", parsed.error.flatten());
  await ensureDevelopmentCoupons();
  const { data, error } = await createSupabaseAdminClient().rpc("redeem_coupon_order", {
    p_user_id: user.id,
    p_plan_id: parsed.data.planId,
    p_code: parsed.data.couponCode,
    p_allow_test: env().TEST_PAYMENT_MODE === "true",
  });
  if (error) {
    const message = error.message;
    if (message.includes("coupon_user_limit")) return problem(409, "coupon_user_limit", "You have already used this coupon");
    if (message.includes("coupon_exhausted")) return problem(409, "coupon_exhausted", "This coupon has reached its redemption limit");
    if (message.includes("payment_provider_required")) return problem(501, "payment_provider_required", "The coupon is valid, but the remaining balance requires a configured payment provider");
    return problem(400, "coupon_invalid", "This coupon is invalid, expired, or unavailable for this package");
  }
  const order = data?.[0];
  if (!order?.order_id) return problem(500, "order_creation_failed", "The package credit could not be created");
  const admin = createSupabaseAdminClient();
  const { data: coupon } = await admin.from("coupons").select("id").eq("code", parsed.data.couponCode).single();
  if (coupon) await admin.from("orders").update({ coupon_id: coupon.id }).eq("id", order.order_id).eq("user_id", user.id);
  return ok({ id: order?.order_id, subtotalMinor: order?.subtotal_minor, discountMinor: order?.discount_minor, amountMinor: order?.amount_minor, currency: order?.currency, status: "paid", testMode: env().TEST_PAYMENT_MODE === "true" }, { status: 201 });
}
