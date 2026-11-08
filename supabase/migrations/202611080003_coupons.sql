create type public.coupon_discount_type as enum ('percentage', 'fixed');

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.plans(id) on delete restrict,
  code text not null unique check (code = upper(trim(code)) and char_length(code) between 4 and 40),
  description text not null check (char_length(description) <= 200),
  discount_type public.coupon_discount_type not null,
  discount_value bigint not null check (discount_value > 0),
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check ((discount_type = 'percentage' and discount_value <= 100) or discount_type = 'fixed'),
  check (max_redemptions is null or redemption_count <= max_redemptions)
);

alter table public.orders
  add column subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  add column discount_minor bigint not null default 0 check (discount_minor >= 0),
  add column coupon_id uuid references public.coupons(id) on delete restrict;

update public.orders set subtotal_minor = amount_minor where subtotal_minor = 0;
alter table public.orders add constraint orders_discount_not_above_subtotal check (discount_minor <= subtotal_minor);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  discount_minor bigint not null check (discount_minor >= 0),
  redeemed_at timestamptz not null default now()
);

create index coupons_lookup_idx on public.coupons(code, is_active, starts_at, ends_at);
create index coupon_redemptions_user_idx on public.coupon_redemptions(coupon_id, user_id);

alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

create policy "redemptions owned" on public.coupon_redemptions for select using (user_id = auth.uid());

create or replace function public.redeem_coupon_order(
  p_user_id uuid,
  p_plan_id uuid,
  p_code text,
  p_allow_test boolean
) returns table(order_id uuid, subtotal_minor bigint, discount_minor bigint, amount_minor bigint, currency text)
language plpgsql security definer set search_path=public as $$
declare
  selected_plan plans;
  selected_coupon coupons;
  user_redemptions integer;
  calculated_discount bigint;
  new_order_id uuid := gen_random_uuid();
begin
  select * into selected_plan from plans where id=p_plan_id and is_active=true;
  if not found then raise exception 'plan_not_found' using errcode='P0001'; end if;

  select * into selected_coupon from coupons
  where code=upper(trim(p_code)) and is_active=true and starts_at<=now()
    and (ends_at is null or ends_at>now()) and (plan_id is null or plan_id=p_plan_id)
  for update;
  if not found then raise exception 'coupon_invalid' using errcode='P0001'; end if;
  if selected_coupon.is_test and not p_allow_test then raise exception 'coupon_not_available' using errcode='P0001'; end if;
  if selected_coupon.max_redemptions is not null and selected_coupon.redemption_count>=selected_coupon.max_redemptions then raise exception 'coupon_exhausted' using errcode='P0001'; end if;

  select count(*) into user_redemptions from coupon_redemptions where coupon_id=selected_coupon.id and user_id=p_user_id;
  if user_redemptions>=selected_coupon.per_user_limit then raise exception 'coupon_user_limit' using errcode='P0001'; end if;

  calculated_discount := case when selected_coupon.discount_type='percentage'
    then (selected_plan.price_minor*selected_coupon.discount_value)/100
    else selected_coupon.discount_value end;
  calculated_discount := least(calculated_discount, selected_plan.price_minor);
  if selected_plan.price_minor-calculated_discount<>0 then raise exception 'payment_provider_required' using errcode='P0001'; end if;

  insert into orders(id,user_id,plan_id,subtotal_minor,discount_minor,amount_minor,currency,payment_provider,provider_reference,status,coupon_id)
  values(new_order_id,p_user_id,p_plan_id,selected_plan.price_minor,calculated_discount,0,selected_plan.currency,'coupon',concat('coupon_',selected_coupon.id,'_',new_order_id),'paid',selected_coupon.id);
  insert into coupon_redemptions(coupon_id,user_id,order_id,discount_minor) values(selected_coupon.id,p_user_id,new_order_id,calculated_discount);
  update coupons set redemption_count=redemption_count+1,updated_at=now() where id=selected_coupon.id;

  return query select new_order_id,selected_plan.price_minor,calculated_discount,0::bigint,selected_plan.currency;
end $$;

revoke all on function public.redeem_coupon_order(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.redeem_coupon_order(uuid,uuid,text,boolean) to service_role;

insert into public.coupons(plan_id,code,description,discount_type,discount_value,max_redemptions,per_user_limit,is_test)
select id,'MINI-BETA-100','Development coupon for one Mini Roll entitlement','percentage'::public.coupon_discount_type,100,1000,1,true from public.plans where name='MINI ROLL'
union all
select id,'CLASSIC-BETA-100','Development coupon for one Classic Roll entitlement','percentage'::public.coupon_discount_type,100,1000,1,true from public.plans where name='CLASSIC ROLL'
union all
select id,'PREMIUM-BETA-100','Development coupon for one Premium Roll entitlement','percentage'::public.coupon_discount_type,100,1000,1,true from public.plans where name='PREMIUM ROLL';
