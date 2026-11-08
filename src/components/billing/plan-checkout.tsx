"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, Tag } from "lucide-react";

type Plan = { id: string; name: string; storage_quota_bytes: number; retention_days: number; price_minor: number; currency: string };
type Quote = { code: string; description: string; subtotalMinor: number; discountMinor: number; totalMinor: number; currency: string };
const money = (minor: number, currency: string) => new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(minor / 100);

export function PlanCheckout({ plan, testCode }: { plan: Plan; testCode?: string }) {
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<Quote>();
  const [message, setMessage] = useState<string>();
  const [loading, setLoading] = useState<"validate" | "redeem">();
  const [complete, setComplete] = useState(false);

  async function validate() {
    setLoading("validate"); setMessage(undefined); setQuote(undefined);
    const response = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id, code }) });
    const body = await response.json(); setLoading(undefined);
    if (!response.ok) return setMessage(body.error?.message ?? "Coupon validation failed");
    setCode(body.data.code); setQuote(body.data);
  }

  async function redeem() {
    if (!quote) return;
    await redeemCode(quote.code);
  }

  async function redeemCode(couponCode: string) {
    setLoading("redeem"); setMessage(undefined);
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planId: plan.id, couponCode }) });
    const body = await response.json(); setLoading(undefined);
    if (!response.ok) return setMessage(body.error?.message ?? "Coupon redemption failed");
    setCode(couponCode);
    setComplete(true);
  }

  return <article className="card flex h-full flex-col p-6">
    <p className="eyebrow">{plan.name}</p>
    <p className="font-display mt-5 text-4xl">{money(Number(plan.price_minor), plan.currency)}</p>
    <p className="mt-2 text-[#777b61]">{(Number(plan.storage_quota_bytes) / 1073741824).toFixed(0)} GB · {plan.retention_days} days</p>
    <div className="mt-7 border-t border-[#ded8cc] pt-6">
      <label className="label" htmlFor={`coupon-${plan.id}`}>Coupon code</label>
      <div className="flex gap-2"><input id={`coupon-${plan.id}`} value={code} onChange={event => { setCode(event.target.value.toUpperCase()); setQuote(undefined); setMessage(undefined); }} className="field min-w-0 uppercase" placeholder="Enter code" autoComplete="off"/><button type="button" onClick={validate} disabled={loading !== undefined || code.trim().length < 4} className="btn-secondary shrink-0 disabled:opacity-40">{loading === "validate" ? <LoaderCircle className="animate-spin" size={18}/> : <Tag size={18}/>}Apply</button></div>
      {testCode && !complete && <button type="button" onClick={() => redeemCode(testCode)} disabled={loading !== undefined} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#b87960] px-3 py-2 text-sm font-bold text-[#8d513d] disabled:opacity-50">{loading === "redeem" ? <LoaderCircle className="animate-spin" size={17}/> : <Tag size={17}/>}Redeem free test credit · {testCode}</button>}
    </div>
    {message && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-[#a63d40]">{message}</p>}
    {quote && !complete && <div className="mt-5 rounded-2xl bg-[#f3efe6] p-4 text-sm"><p className="flex justify-between"><span>Subtotal</span><span>{money(quote.subtotalMinor, quote.currency)}</span></p><p className="mt-2 flex justify-between text-[#777b61]"><span>Coupon discount</span><span>−{money(quote.discountMinor, quote.currency)}</span></p><div className="my-3 border-t border-[#d8ccb8]"/><p className="flex justify-between font-bold"><span>Total</span><span>{money(quote.totalMinor, quote.currency)}</span></p><p className="mt-3 text-xs text-[#777b61]">{quote.description}</p></div>}
    {complete ? <div role="status" className="mt-5 rounded-2xl border border-[#777b61] bg-[#f4f6ef] p-4"><p className="flex items-center gap-2 font-bold"><Check size={18}/>Entitlement ready</p><p className="mt-2 text-sm text-[#686861]">This package can now be used to create one event.</p><Link className="btn-primary mt-4 w-full" href="/dashboard/events/new">Create event</Link></div> : <button type="button" onClick={redeem} disabled={!quote || loading !== undefined} className="btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40">{loading === "redeem" ? <><LoaderCircle className="animate-spin" size={18}/>Redeeming…</> : quote?.totalMinor === 0 ? "Redeem free package" : "Continue to payment"}</button>}
  </article>;
}
