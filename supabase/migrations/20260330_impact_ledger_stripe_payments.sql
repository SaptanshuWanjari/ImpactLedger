begin;

set search_path = public, app;

create extension if not exists pgcrypto;

-- Impact Ledger: donation table upgrades for Stripe payment lifecycle tracking.
alter table public.donations
  alter column currency set default 'INR';

update public.donations
set currency = 'INR'
where currency is null
   or upper(currency) = 'USD';

alter table public.donations
  add column if not exists receipt_url text,
  add column if not exists failure_reason text,
  add column if not exists refunded_amount numeric(12,2) not null default 0,
  add column if not exists dispute_status text not null default 'none',
  add column if not exists stripe_event_last_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.donations
  drop constraint if exists donations_refunded_amount_check;

alter table public.donations
  add constraint donations_refunded_amount_check
  check (refunded_amount >= 0);

alter table public.donations
  drop constraint if exists donations_dispute_status_check;

alter table public.donations
  add constraint donations_dispute_status_check
  check (
    dispute_status in (
      'none',
      'warning_needs_response',
      'warning_under_review',
      'warning_closed',
      'needs_response',
      'under_review',
      'won',
      'lost'
    )
  );

create unique index if not exists idx_donations_tenant_checkout_session_unique
  on public.donations (tenant_id, stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index if not exists idx_donations_tenant_payment_intent_unique
  on public.donations (tenant_id, stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index if not exists idx_donations_tenant_charge_unique
  on public.donations (tenant_id, stripe_charge_id)
  where stripe_charge_id is not null;

create index if not exists idx_donations_tenant_email_donated_at
  on public.donations (tenant_id, donor_email, donated_at desc);

-- Donation lifecycle ledger (append-only event table).
create table if not exists public.donation_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  donation_id uuid references public.donations(id) on delete set null,
  donor_id uuid references public.donors(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  event_type text not null check (
    event_type in (
      'donation_created',
      'donation_confirmed',
      'donation_failed',
      'donation_refunded',
      'donation_disputed'
    )
  ),
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  stripe_event_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  source text not null check (source in ('checkout_api', 'stripe_webhook', 'admin_action')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_donation_ledger_tenant_occurred_at
  on public.donation_ledger (tenant_id, occurred_at desc);

create index if not exists idx_donation_ledger_tenant_donation_occurred_at
  on public.donation_ledger (tenant_id, donation_id, occurred_at desc);

create unique index if not exists idx_donation_ledger_tenant_event_type_event_unique
  on public.donation_ledger (tenant_id, stripe_event_id, event_type)
  where stripe_event_id is not null;

-- Stripe webhook event ingestion + idempotency table.
create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  event_id text not null unique,
  event_type text not null,
  api_version text,
  livemode boolean not null default false,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  payload jsonb not null,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz
);

create index if not exists idx_stripe_webhook_events_status_received_at
  on public.stripe_webhook_events (status, received_at desc);

create index if not exists idx_stripe_webhook_events_tenant_received_at
  on public.stripe_webhook_events (tenant_id, received_at desc);

-- Impact Ledger naming alignment (no slug changes).
update public.tenants
set name = 'Impact Ledger'
where lower(name) in ('impact lodger', 'impact ledger');

-- RLS for new Stripe tables.
alter table public.donation_ledger enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- Donation ledger: tenant members can read.
drop policy if exists "tenant members can read donation ledger" on public.donation_ledger;
create policy "tenant members can read donation ledger"
  on public.donation_ledger
  for select
  using (app.is_tenant_member(tenant_id));

-- Donation ledger: block direct client writes/updates/deletes.
drop policy if exists "deny donation ledger insert" on public.donation_ledger;
create policy "deny donation ledger insert"
  on public.donation_ledger
  for insert
  with check (false);

drop policy if exists "deny donation ledger update" on public.donation_ledger;
create policy "deny donation ledger update"
  on public.donation_ledger
  for update
  using (false)
  with check (false);

drop policy if exists "deny donation ledger delete" on public.donation_ledger;
create policy "deny donation ledger delete"
  on public.donation_ledger
  for delete
  using (false);

-- Stripe webhook events: tenant members can read.
drop policy if exists "tenant members can read stripe webhook events" on public.stripe_webhook_events;
create policy "tenant members can read stripe webhook events"
  on public.stripe_webhook_events
  for select
  using (tenant_id is not null and app.is_tenant_member(tenant_id));

-- Stripe webhook events: block direct client writes/updates/deletes.
drop policy if exists "deny stripe webhook events insert" on public.stripe_webhook_events;
create policy "deny stripe webhook events insert"
  on public.stripe_webhook_events
  for insert
  with check (false);

drop policy if exists "deny stripe webhook events update" on public.stripe_webhook_events;
create policy "deny stripe webhook events update"
  on public.stripe_webhook_events
  for update
  using (false)
  with check (false);

drop policy if exists "deny stripe webhook events delete" on public.stripe_webhook_events;
create policy "deny stripe webhook events delete"
  on public.stripe_webhook_events
  for delete
  using (false);

revoke all on public.donation_ledger from anon;
revoke all on public.stripe_webhook_events from anon;

commit;
