create or replace function public.delete_owned_event(p_event_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare v_token_hash text;
begin
  select public_token_hash into v_token_hash from events where id=p_event_id and owner_id=auth.uid() for update;
  if not found then raise exception 'event_not_found' using errcode='P0001'; end if;
  delete from pin_attempts where token_hash=v_token_hash;
  delete from audit_logs where event_id=p_event_id;
  delete from export_jobs where event_id=p_event_id;
  delete from photos where event_id=p_event_id;
  delete from guest_sessions where event_id=p_event_id;
  delete from events where id=p_event_id and owner_id=auth.uid();
  return true;
end $$;
revoke all on function public.delete_owned_event(uuid) from public,anon;
grant execute on function public.delete_owned_event(uuid) to authenticated;
