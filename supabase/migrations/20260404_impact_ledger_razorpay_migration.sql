-- Razorpay hard switch: add provider-neutral payment refs and webhook event storage.

alter table public.donations
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text,
  add column if not exists razorpay_signature text,
  add column if not exists payment_provider text not null default 'razorpay'
    check (payment_provider in ('razorpay', 'stripe')),
  add column if not exists provider_event_last_id text;

create unique index if not exists idx_donations_tenant_razorpay_order_unique
  on public.donations (tenant_id, razorpay_order_id)
  where razorpay_order_id is not null;

create unique index if not exists idx_donations_tenant_razorpay_payment_unique
  on public.donations (tenant_id, razorpay_payment_id)
  where razorpay_payment_id is not null;

alter table public.donation_ledger
  add column if not exists provider_event_id text,
  add column if not exists provider_order_id text,
  add column if not exists provider_payment_id text;

alter table public.donation_ledger
  drop constraint if exists donation_ledger_source_check;

alter table public.donation_ledger
  add constraint donation_ledger_source_check
  check (source in ('checkout_api', 'stripe_webhook', 'razorpay_webhook', 'admin_action'));

create unique index if not exists idx_donation_ledger_tenant_provider_event_type_unique
  on public.donation_ledger (tenant_id, provider_event_id, event_type)
  where provider_event_id is not null;

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  provider text not null check (provider in ('razorpay', 'stripe')),
  event_key text not null,
  event_type text not null,
  status text not null default 'received' check (status in ('received', 'processed', 'ignored', 'failed')),
  error_message text,
  payload jsonb not null,
  received_at timestamptz not null default timezone('utc', now()),
  processed_at timestamptz,
  unique (provider, event_key)
);

create index if not exists idx_payment_webhook_events_status_received_at
  on public.payment_webhook_events (status, received_at desc);

create index if not exists idx_payment_webhook_events_tenant_received_at
  on public.payment_webhook_events (tenant_id, received_at desc);

alter table public.payment_webhook_events enable row level security;

drop policy if exists "tenant members can read payment webhook events" on public.payment_webhook_events;
create policy "tenant members can read payment webhook events"
  on public.payment_webhook_events
  for select
  using (
    exists (
      select 1
      from public.tenant_memberships tm
      where tm.tenant_id = payment_webhook_events.tenant_id
        and tm.user_id = auth.uid()
    )
  );

drop policy if exists "deny payment webhook events insert" on public.payment_webhook_events;
create policy "deny payment webhook events insert"
  on public.payment_webhook_events
  for insert
  with check (false);

drop policy if exists "deny payment webhook events update" on public.payment_webhook_events;
create policy "deny payment webhook events update"
  on public.payment_webhook_events
  for update
  using (false)
  with check (false);

drop policy if exists "deny payment webhook events delete" on public.payment_webhook_events;
create policy "deny payment webhook events delete"
  on public.payment_webhook_events
  for delete
  using (false);

revoke all on public.payment_webhook_events from anon;
revoke all on public.payment_webhook_events from authenticated;
