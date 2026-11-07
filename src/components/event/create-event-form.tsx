"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, LoaderCircle } from "lucide-react";

type Plan = { id: string; plans: { name: string; storage_quota_bytes: number } };
export function CreateEventForm() {
  const router = useRouter(); const [plans, setPlans] = useState<Plan[]>([]); const [error, setError] = useState<string>(); const [loading, setLoading] = useState(false);
  useEffect(() => { fetch("/api/orders?unused=1").then(r => r.json()).then(v => setPlans(v.data ?? [])).catch(() => setError("Could not load package entitlements.")); }, []);
  async function submit(formData: FormData) {
    setLoading(true); setError(undefined);
    const payload = Object.fromEntries(formData);
    const response = await fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: payload.title, eventDate: new Date(String(payload.eventDate)).toISOString(), locationName: payload.locationName || null, description: payload.description || null, opensAt: new Date(String(payload.opensAt)).toISOString(), closesAt: new Date(String(payload.closesAt)).toISOString(), orderId: payload.orderId }) });
    const body = await response.json(); setLoading(false);
    if (!response.ok) return setError(body.error?.message ?? "Could not create event.");
    sessionStorage.setItem(`mementoroll:event:${body.data.id}:access`, JSON.stringify({ url: body.data.accessUrl, pin: body.data.pin }));
    router.push(`/dashboard/events/${body.data.id}?created=1`); router.refresh();
  }
  return <form action={submit} className="card mt-8 grid gap-5 p-6 sm:grid-cols-2 sm:p-8"><div className="sm:col-span-2"><label className="label" htmlFor="title">Event name</label><input required minLength={2} maxLength={100} className="field" id="title" name="title" /></div><div><label className="label" htmlFor="eventDate">Event date and time</label><input required className="field" type="datetime-local" id="eventDate" name="eventDate" /></div><div><label className="label" htmlFor="locationName">Location <span className="font-normal text-[#777b61]">(optional)</span></label><input maxLength={160} className="field" id="locationName" name="locationName" /></div><div><label className="label" htmlFor="opensAt">Guest access starts</label><input required className="field" type="datetime-local" id="opensAt" name="opensAt" /></div><div><label className="label" htmlFor="closesAt">Guest access ends</label><input required className="field" type="datetime-local" id="closesAt" name="closesAt" /></div><div className="sm:col-span-2"><label className="label" htmlFor="orderId">Purchased package entitlement</label><select required className="field" id="orderId" name="orderId"><option value="">Select an unused paid package</option>{plans.map(p => <option key={p.id} value={p.id}>{p.plans.name} · {(Number(p.plans.storage_quota_bytes)/1073741824).toFixed(0)} GB</option>)}</select><p className="mt-2 text-xs text-[#777b61]">Only paid, unused orders appear here. Test-payment mode is clearly labeled in Billing.</p></div><div className="sm:col-span-2"><label className="label" htmlFor="description">Description <span className="font-normal text-[#777b61]">(optional)</span></label><textarea maxLength={1000} rows={4} className="field" id="description" name="description" /></div>{error && <p role="alert" className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-[#a63d40]">{error}</p>}<button disabled={loading} className="btn-primary sm:col-span-2 disabled:opacity-60">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <CalendarPlus aria-hidden="true" size={18} />}Create event and private access</button></form>;
}
