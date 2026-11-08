"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Square, Trash2, X } from "lucide-react";

export function EventActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  async function act(action: "activate" | "close") { const response = await fetch(`/api/events/${id}/${action}`, { method: "POST" }); if (response.ok) router.refresh(); }
  async function remove() { setDeleting(true); setError(undefined); const response = await fetch(`/api/events/${id}`, { method: "DELETE" }); const body = await response.json(); if (!response.ok) { setDeleting(false); return setError(body.error?.message ?? "Event deletion failed"); } router.push("/dashboard/events"); router.refresh(); }
  return <>
    <div className="flex flex-wrap gap-2">{status === "draft" && <button onClick={() => act("activate")} className="btn-primary"><Play size={16}/>Activate</button>}{status === "active" && <button onClick={() => act("close")} className="btn-secondary"><Square size={16}/>Close event</button>}<button onClick={() => setOpen(true)} className="btn-secondary !border-red-300 !text-[#a63d40]"><Trash2 size={16}/>Delete event</button></div>
    {open && <div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"><section className="card relative w-full max-w-lg bg-white p-6 sm:p-8"><button aria-label="Close confirmation" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full"><X/></button><Trash2 className="text-[#a63d40]"/><h2 id="delete-title" className="font-display mt-4 text-3xl">Permanently delete this event?</h2><p className="mt-3 leading-6 text-[#686861]">This deletes the event, guest sessions, original photos, thumbnails, exports, and related records. It cannot be undone.</p><label className="label mt-6" htmlFor="confirm-event">Type <strong>DELETE</strong> to confirm</label><input id="confirm-event" className="field" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off"/>{error && <p role="alert" className="mt-3 text-sm text-[#a63d40]">{error}</p>}<div className="mt-6 flex justify-end gap-3"><button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button><button onClick={remove} disabled={confirmation !== "DELETE" || deleting} className="btn-primary !border-[#a63d40] !bg-[#a63d40] disabled:opacity-40">{deleting ? "Deleting permanently…" : "Delete permanently"}</button></div></section></div>}
  </>;
}
