create extension if not exists pgcrypto;

create type public.app_role as enum ('customer', 'admin');
create type public.order_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.event_status as enum ('draft', 'active', 'closed', 'suspended', 'deletion_pending');
create type public.session_status as enum ('active', 'finished', 'revoked', 'expired');
create type public.photo_status as enum ('reserved', 'uploaded', 'processing', 'ready', 'failed', 'deleted');
create type public.export_status as enum ('queued', 'processing', 'ready', 'failed', 'expired');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text check (char_length(full_name) <= 120),
  email text not null,
  role public.app_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  storage_quota_bytes bigint not null check (storage_quota_bytes > 0),
  retention_days integer not null check (retention_days > 0),
  price_minor bigint not null check (price_minor >= 0),
  currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete restrict,
  plan_id uuid not null references public.plans(id) on delete restrict,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  payment_provider text not null,
  provider_reference text unique,
  status public.order_status not null default 'pending',
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 100),
  description text check (char_length(description) <= 1000),
  event_date timestamptz not null,
  location_name text check (char_length(location_name) <= 160),
  public_token_hash text not null unique,
  pin_hash text not null,
  access_version integer not null default 1,
  status public.event_status not null default 'draft',
  storage_quota_bytes bigint not null check (storage_quota_bytes > 0),
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  storage_reserved_bytes bigint not null default 0 check (storage_reserved_bytes >= 0),
  opens_at timestamptz not null,
  closes_at timestamptz not null,
  retention_until timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (opens_at < closes_at),
  check (storage_used_bytes + storage_reserved_bytes <= storage_quota_bytes)
);

create table public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  guest_name text not null check (char_length(guest_name) between 2 and 60),
  session_token_hash text not null unique,
  access_version integer not null,
  shots_uploaded integer not null default 0 check (shots_uploaded between 0 and 25),
  shots_reserved integer not null default 0 check (shots_reserved between 0 and 25),
  status public.session_status not null default 'active',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  check (shots_uploaded + shots_reserved <= 25)
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  guest_session_id uuid not null references public.guest_sessions(id) on delete restrict,
  shot_number integer not null check (shot_number between 1 and 25),
  object_key text not null unique,
  thumbnail_key text unique,
  status public.photo_status not null default 'reserved',
  reserved_size_bytes bigint not null check (reserved_size_bytes > 0 and reserved_size_bytes <= 10485760),
  file_size_bytes bigint check (file_size_bytes > 0 and file_size_bytes <= 10485760),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  width integer check (width > 0 and width <= 6000),
  height integer check (height > 0 and height <= 6000),
  captured_at timestamptz,
  uploaded_at timestamptz,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  location_consent_at timestamptz,
  sha256_hash text,
  reservation_expires_at timestamptz not null default (now() + interval '15 minutes'),
  created_at timestamptz not null default now(),
  unique (guest_session_id, shot_number)
);

create table public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  object_key text unique,
  status public.export_status not null default 'queued',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  provider text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null check (status in ('received', 'processed', 'failed', 'ignored'))
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.pin_attempts (
  id bigint generated always as identity primary key,
  token_hash text not null,
  ip_hash text not null,
  succeeded boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index events_owner_idx on public.events(owner_id, created_at desc);
create index events_status_idx on public.events(status, opens_at, closes_at);
create index sessions_event_idx on public.guest_sessions(event_id, created_at desc);
create index photos_event_ready_idx on public.photos(event_id, uploaded_at desc) where status = 'ready';
create index photos_session_idx on public.photos(guest_session_id, created_at desc);
create index audit_event_idx on public.audit_logs(event_id, created_at desc);
create index pin_attempts_lookup_idx on public.pin_attempts(token_hash, ip_hash, attempted_at desc);

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.orders enable row level security;
alter table public.events enable row level security;
alter table public.guest_sessions enable row level security;
alter table public.photos enable row level security;
alter table public.export_jobs enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.pin_attempts enable row level security;

create policy "profiles read self" on public.profiles for select using (id = auth.uid());
create policy "profiles update safe fields" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));
create policy "active plans are public" on public.plans for select using (is_active = true);
create policy "orders owned" on public.orders for select using (user_id = auth.uid());
create policy "events owned read" on public.events for select using (owner_id = auth.uid());
create policy "events owned update" on public.events for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "sessions via owned event" on public.guest_sessions for select using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
create policy "photos via owned event" on public.photos for select using (exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
create policy "exports via owned event" on public.export_jobs for select using (requested_by = auth.uid() and exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));
create policy "audit own events" on public.audit_logs for select using (actor_user_id = auth.uid() or exists (select 1 from public.events e where e.id = event_id and e.owner_id = auth.uid()));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email, 'customer');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.create_event_from_order(
  p_order_id uuid, p_title text, p_description text, p_event_date timestamptz,
  p_location_name text, p_token_hash text, p_pin_hash text, p_opens_at timestamptz, p_closes_at timestamptz
) returns uuid language plpgsql security definer set search_path = public as $$
declare selected_order orders; selected_plan plans; new_id uuid := gen_random_uuid();
begin
  select * into selected_order from orders where id=p_order_id and user_id=auth.uid() and status='paid' and consumed_at is null for update;
  if not found then raise exception 'entitlement_unavailable' using errcode='P0001'; end if;
  select * into selected_plan from plans where id=selected_order.plan_id and is_active=true;
  if not found then raise exception 'plan_unavailable' using errcode='P0001'; end if;
  insert into events(id,owner_id,order_id,title,description,event_date,location_name,public_token_hash,pin_hash,storage_quota_bytes,opens_at,closes_at,retention_until)
  values(new_id,auth.uid(),selected_order.id,p_title,p_description,p_event_date,p_location_name,p_token_hash,p_pin_hash,selected_plan.storage_quota_bytes,p_opens_at,p_closes_at,p_closes_at + make_interval(days=>selected_plan.retention_days));
  update orders set consumed_at=now() where id=selected_order.id;
  insert into audit_logs(actor_user_id,event_id,action,details) values(auth.uid(),new_id,'event.created',jsonb_build_object('order_id',selected_order.id));
  return new_id;
end $$;

grant execute on function public.create_event_from_order(uuid,text,text,timestamptz,text,text,text,timestamptz,timestamptz) to authenticated;

create or replace function public.reserve_photo_upload(
  p_session_hash text, p_photo_id uuid, p_object_key text, p_mime_type text,
  p_expected_size bigint, p_captured_at timestamptz, p_latitude double precision, p_longitude double precision
) returns table(photo_id uuid, shot_number integer, remaining_shots integer)
language plpgsql security definer set search_path = public as $$
declare s guest_sessions; e events; next_shot integer;
begin
  select * into s from guest_sessions where session_token_hash = p_session_hash for update;
  if not found or s.status <> 'active' or s.expires_at <= now() then raise exception 'invalid_guest_session' using errcode = 'P0001'; end if;
  select * into e from events where id = s.event_id for update;
  if e.status <> 'active' or now() not between e.opens_at and e.closes_at or s.access_version <> e.access_version then raise exception 'event_unavailable' using errcode = 'P0001'; end if;
  if s.shots_uploaded + s.shots_reserved >= 25 then raise exception 'shot_limit_reached' using errcode = 'P0001'; end if;
  if e.storage_used_bytes + e.storage_reserved_bytes + p_expected_size > e.storage_quota_bytes then raise exception 'storage_quota_exceeded' using errcode = 'P0001'; end if;
  next_shot := s.shots_uploaded + s.shots_reserved + 1;
  update guest_sessions set shots_reserved = shots_reserved + 1 where id = s.id;
  update events set storage_reserved_bytes = storage_reserved_bytes + p_expected_size where id = e.id;
  insert into photos(id, event_id, guest_session_id, shot_number, object_key, mime_type, reserved_size_bytes, captured_at, latitude, longitude, location_consent_at)
  values (p_photo_id, e.id, s.id, next_shot, p_object_key, p_mime_type, p_expected_size, p_captured_at, p_latitude, p_longitude, case when p_latitude is not null then now() end);
  return query select p_photo_id, next_shot, 25 - s.shots_uploaded - s.shots_reserved - 1;
end $$;

create or replace function public.finalize_photo_upload(p_session_hash text, p_photo_id uuid, p_actual_size bigint, p_width integer, p_height integer, p_sha256 text)
returns integer language plpgsql security definer set search_path = public as $$
declare s guest_sessions; p photos;
begin
  select * into s from guest_sessions where session_token_hash = p_session_hash for update;
  if not found then raise exception 'invalid_guest_session' using errcode = 'P0001'; end if;
  select * into p from photos where id = p_photo_id and guest_session_id = s.id for update;
  if not found then raise exception 'photo_not_found' using errcode = 'P0001'; end if;
  if p.status = 'ready' then return 25 - s.shots_uploaded; end if;
  if p.status not in ('reserved', 'uploaded', 'processing') then raise exception 'invalid_photo_state' using errcode = 'P0001'; end if;
  update photos set status='ready', file_size_bytes=p_actual_size, width=p_width, height=p_height, sha256_hash=p_sha256, uploaded_at=now() where id=p.id;
  update guest_sessions set shots_reserved=shots_reserved-1, shots_uploaded=shots_uploaded+1 where id=s.id;
  update events set storage_reserved_bytes=storage_reserved_bytes-p.reserved_size_bytes, storage_used_bytes=storage_used_bytes+p_actual_size where id=p.event_id;
  return 24 - s.shots_uploaded;
end $$;

revoke all on function public.reserve_photo_upload(text,uuid,text,text,bigint,timestamptz,double precision,double precision) from public, anon, authenticated;
revoke all on function public.finalize_photo_upload(text,uuid,bigint,integer,integer,text) from public, anon, authenticated;

insert into public.plans(name, storage_quota_bytes, retention_days, price_minor, currency) values
('MINI ROLL', 5368709120, 30, 149900, 'PHP'),
('CLASSIC ROLL', 21474836480, 90, 299900, 'PHP'),
('PREMIUM ROLL', 53687091200, 180, 499900, 'PHP');
