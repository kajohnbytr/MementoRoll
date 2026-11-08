import { z } from "zod";
import { getUser } from "@/lib/auth";
import { ok, parseJson, problem } from "@/lib/api";
import { deleteObjectKeys } from "@/lib/cloudflare/r2";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const patch = z.object({
  title: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  location_name: z.string().trim().max(160).nullable().optional(),
  opens_at: z.string().datetime().optional(),
  closes_at: z.string().datetime().optional(),
}).strict();

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getUser()) return problem(401, "unauthorized", "Authentication required");
  const { id } = await params;
  const { data, error } = await (await createSupabaseServerClient())
    .from("events")
    .select("id,title,description,event_date,location_name,status,storage_quota_bytes,storage_used_bytes,storage_reserved_bytes,opens_at,closes_at,retention_until,created_at")
    .eq("id", id)
    .single();
  return error ? problem(404, "event_not_found", "Event not found") : ok(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getUser()) return problem(401, "unauthorized", "Authentication required");
  const parsed = patch.safeParse(await parseJson(request));
  if (!parsed.success) return problem(422, "validation_error", "Invalid event changes", parsed.error.flatten());
  const { id } = await params;
  const { data, error } = await (await createSupabaseServerClient())
    .from("events")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id,title")
    .single();
  return error ? problem(404, "event_not_found", "Event not found or update denied") : ok(data);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return problem(401, "unauthorized", "Authentication required");

  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: event, error: eventError } = await admin
    .from("events")
    .select("id,owner_id,public_token_hash")
    .eq("id", id)
    .single();
  if (eventError || !event || event.owner_id !== user.id) {
    return problem(404, "event_not_found", "Event not found or access denied");
  }

  const [{ data: photos, error: photoError }, { data: exports, error: exportError }] = await Promise.all([
    admin.from("photos").select("object_key,thumbnail_key").eq("event_id", id),
    admin.from("export_jobs").select("object_key").eq("event_id", id),
  ]);
  if (photoError || exportError) {
    return problem(500, "event_deletion_failed", "The event files could not be prepared for deletion. Please try again.");
  }

  const keys = [
    ...(photos ?? []).flatMap(photo => [photo.object_key, photo.thumbnail_key ?? ""]),
    ...(exports ?? []).map(job => job.object_key ?? ""),
  ];
  try {
    await deleteObjectKeys(keys);
  } catch {
    return problem(503, "storage_deletion_failed", "Private files could not be deleted. The event was kept unchanged.");
  }

  const deletions = [
    admin.from("pin_attempts").delete().eq("token_hash", event.public_token_hash),
    admin.from("audit_logs").delete().eq("event_id", id),
    admin.from("export_jobs").delete().eq("event_id", id),
    admin.from("photos").delete().eq("event_id", id),
    admin.from("guest_sessions").delete().eq("event_id", id),
  ];
  for (const deletion of deletions) {
    const { error } = await deletion;
    if (error) {
      return problem(500, "event_deletion_failed", "Event cleanup could not be completed. Please try deleting it again.");
    }
  }

  const { error: deleteEventError } = await admin.from("events").delete().eq("id", id).eq("owner_id", user.id);
  if (deleteEventError) {
    return problem(500, "event_deletion_failed", "Event cleanup could not be completed. Please try deleting it again.");
  }

  return ok({ deleted: true, id });
}
