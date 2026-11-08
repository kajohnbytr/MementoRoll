import { z } from "zod";
import { getUser } from "@/lib/auth";
import { ok, parseJson, problem } from "@/lib/api";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureDevelopmentCoupons } from "@/lib/billing/test-coupons";

const input = z.object({ planId: z.string().uuid(), code: z.string().trim().min(4).max(40).transform(value => value.toUpperCase()) });

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return problem(401, "unauthorized", "Authentication required");
  await ensureDevelopmentCoupons();
  const parsed = input.safeParse(await parseJson(request));
  if (!parsed.success) return problem(422, "validation_error", "Enter a valid coupon code");
  const admin = createSupabaseAdminClient();
  const [{ data: plan }, { data: coupon }] = await Promise.all([
    admin.from("plans").select("id,price_minor,currency").eq("id", parsed.data.planId).eq("is_active", true).single(),
    admin.from("coupons").select("id,plan_id,description,discount_type,discount_value,max_redemptions,redemption_count,per_user_limit,starts_at,ends_at,is_active,is_test").eq("code", parsed.data.code).single(),
  ]);
  if (!plan || !coupon || !coupon.is_active || (coupon.plan_id && coupon.plan_id !== plan.id) || new Date(coupon.starts_at) > new Date() || (coupon.ends_at && new Date(coupon.ends_at) <= new Date()) || (coupon.is_test && env().TEST_PAYMENT_MODE !== "true") || (coupon.max_redemptions !== null && coupon.redemption_count >= coupon.max_redemptions)) return problem(404, "coupon_invalid", "This coupon is invalid, expired, or unavailable for this package");
  const { count } = await admin.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", coupon.id).eq("user_id", user.id);
  if ((count ?? 0) >= coupon.per_user_limit) return problem(409, "coupon_user_limit", "You have already used this coupon");
  const subtotal = Number(plan.price_minor);
  const rawDiscount = coupon.discount_type === "percentage" ? Math.floor(subtotal * Number(coupon.discount_value) / 100) : Number(coupon.discount_value);
  const discount = Math.min(subtotal, rawDiscount);
  return ok({ code: parsed.data.code, description: coupon.description, subtotalMinor: subtotal, discountMinor: discount, totalMinor: subtotal - discount, currency: plan.currency });
}
