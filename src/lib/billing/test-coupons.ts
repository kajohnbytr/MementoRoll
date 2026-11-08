import "server-only";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const definitions: Record<string, { code: string; description: string }> = {
  "MINI ROLL": { code: "MINI-BETA-100", description: "Development coupon for one Mini Roll entitlement" },
  "CLASSIC ROLL": { code: "CLASSIC-BETA-100", description: "Development coupon for one Classic Roll entitlement" },
  "PREMIUM ROLL": { code: "PREMIUM-BETA-100", description: "Development coupon for one Premium Roll entitlement" },
};

export async function ensureDevelopmentCoupons() {
  if (env().TEST_PAYMENT_MODE !== "true") return;
  const admin = createSupabaseAdminClient();
  const { data: plans, error: planError } = await admin.from("plans").select("id,name").in("name", Object.keys(definitions));
  if (planError) throw new Error("Development coupon plans could not be loaded");
  const rows = (plans ?? []).map(plan => ({
    plan_id: plan.id,
    code: definitions[plan.name].code,
    description: definitions[plan.name].description,
    discount_type: "percentage",
    discount_value: 100,
    max_redemptions: 1000,
    per_user_limit: 1,
    is_active: true,
    is_test: true,
  }));
  if (!rows.length) return;
  const { error } = await admin.from("coupons").upsert(rows, { onConflict: "code", ignoreDuplicates: true });
  if (error) throw new Error("Development coupons could not be initialized");
}
