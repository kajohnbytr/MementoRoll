import { PlanCheckout } from "@/components/billing/plan-checkout";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureDevelopmentCoupons } from "@/lib/billing/test-coupons";

const testCodes: Record<string, string> = {
  "MINI ROLL": "MINI-BETA-100",
  "CLASSIC ROLL": "CLASSIC-BETA-100",
  "PREMIUM ROLL": "PREMIUM-BETA-100",
};

export default async function BillingPage() {
  await ensureDevelopmentCoupons();
  const { data: plans } = await (await createSupabaseServerClient()).from("plans").select("id,name,storage_quota_bytes,retention_days,price_minor,currency").eq("is_active", true).order("price_minor");
  const testMode = env().TEST_PAYMENT_MODE === "true";
  return <>
    <p className="eyebrow">Billing</p>
    <h1 className="font-display mt-2 text-5xl">Choose your next roll.</h1>
    <p className="mt-3 max-w-2xl text-[#777b61]">Apply a valid coupon to preview the discount before checkout. Coupons are validated and redeemed securely on the server.</p>
    {testMode && <div className="mt-6 rounded-2xl border border-[#b87960] bg-[#fff8f2] p-4"><p className="font-bold text-[#8d513d]">Development coupon mode</p><p className="mt-1 text-sm text-[#686861]">The codes shown below create zero-total test entitlements. They do not represent real payments and are unavailable when test mode is disabled.</p></div>}
    <div className="mt-8 grid gap-4 lg:grid-cols-3">{plans?.map(plan => <PlanCheckout key={plan.id} plan={plan} testCode={testMode ? testCodes[plan.name] : undefined}/>)}</div>
  </>;
}
