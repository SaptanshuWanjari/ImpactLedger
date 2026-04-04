-- Executable full schema reset for Supabase SQL Editor.
-- This file drops and recreates core ImpactLedger schema objects in `public`.

begin;

set search_path = public, app;

create extension if not exists pgcrypto;
create schema if not exists app;

-- Drop tables in dependency-safe order.
drop table if exists public.audit_logs cascade;
drop table if exists public.payment_webhook_events cascade;
drop table if exists public.stripe_webhook_events cascade;
drop table if exists public.donation_ledger cascade;
drop table if exists public.campaign_updates cascade;
drop table if exists public.field_reports cascade;
drop table if exists public.volunteer_assignments cascade;
drop table if exists public.expenses cascade;
drop table if exists public.allocation_ledger cascade;
drop table if exists public.donations cascade;
drop table if exists public.volunteer_profiles cascade;
drop table if exists public.donors cascade;
drop table if exists public.campaigns cascade;
drop table if exists public.tenant_memberships cascade;
drop table if exists public.profiles cascade;
drop table if exists public.tenants cascade;

-- Drop enum types if present.
drop type if exists public.assignment_status cascade;
drop type if exists public.expense_status cascade;
drop type if exists public.donation_status cascade;
drop type if exists public.urgency_level cascade;
drop type if exists public.campaign_status cascade;

-- Enum types.
create type public.campaign_status as enum (
  'planning',
  'active',
  'urgent',
  'completed',
  'archived'
);

create type public.urgency_level as enum (
  'low',
  'medium',
  'high'
);

create type public.donation_status as enum (
  'pending',
  'succeeded',
  'failed',
  'refunded',
  'disputed'
);

create type public.expense_status as enum (
  'draft',
  'submitted',
  'approved',
  'paid',
  'reconciled',
  'rejected'
);

create type public.assignment_status as enum (
  'assigned',
  'accepted',
  'in_progress',
  'completed',
  'cancelled'
);

-- Core tables.
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  country_code text,
  timezone text default 'Asia/Kolkata',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.profiles (
  id uuid primary key references auth.users(id),
  full_name text,
  email text unique,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  user_id uuid not null references auth.users(id),
  role text not null check (role in ('donor', 'volunteer', 'org_admin')),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  title text not null,
  description text,
  category text not null,
  location text not null,
  image_url text,
  goal_amount numeric not null check (goal_amount > 0),
  currency text not null default 'INR',
  status public.campaign_status not null default 'planning',
  urgency public.urgency_level not null default 'medium',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.donors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  auth_user_id uuid references auth.users(id),
  full_name text not null,
  email text not null,
  phone text,
  is_anonymous boolean not null default false,
  communications_opt_in boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.volunteer_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  auth_user_id uuid references auth.users(id),
  full_name text not null,
  email text not null,
  certifications_count integer not null default 0,
  hours_logged integer not null default 0,
  impact_score integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  donor_id uuid references public.donors(id),
  campaign_id uuid references public.campaigns(id),
  amount numeric not null check (amount > 0),
  currency text not null default 'INR',
  status public.donation_status not null default 'pending',
  payment_method text,
  is_recurring boolean not null default false,
  donor_name text,
  donor_email text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  source text not null default 'web',
  donated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  receipt_url text,
  failure_reason text,
  refunded_amount numeric not null default 0 check (refunded_amount >= 0),
  dispute_status text not null default 'none' check (
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
  ),
  stripe_event_last_id text,
  stripe_customer_id text,
  updated_at timestamptz not null default timezone('utc', now()),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payment_provider text not null default 'razorpay' check (payment_provider in ('razorpay', 'stripe')),
  provider_event_last_id text
);

create table public.allocation_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  donation_id uuid references public.donations(id),
  campaign_id uuid references public.campaigns(id),
  event_type text not null check (
    event_type in ('allocation_created', 'allocation_adjusted', 'expense_posted', 'restriction_released')
  ),
  category text not null,
  amount numeric not null check (amount <> 0),
  notes text,
  source text not null default 'system',
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  campaign_id uuid references public.campaigns(id),
  allocation_id uuid references public.allocation_ledger(id),
  category text not null,
  vendor text,
  amount numeric not null check (amount > 0),
  currency text not null default 'INR',
  status public.expense_status not null default 'draft',
  receipt_url text,
  notes text,
  submitted_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  expense_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  campaign_id uuid references public.campaigns(id),
  volunteer_id uuid not null references public.volunteer_profiles(id),
  title text not null,
  location text not null,
  priority public.urgency_level not null default 'medium',
  status public.assignment_status not null default 'assigned',
  assignment_type text not null,
  starts_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.field_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  assignment_id uuid references public.volunteer_assignments(id),
  volunteer_id uuid references public.volunteer_profiles(id),
  impact_metric integer,
  notes text,
  attachment_url text,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'returned')),
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  campaign_id uuid not null references public.campaigns(id),
  title text not null,
  content text not null,
  image_url text,
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.donation_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  donation_id uuid references public.donations(id),
  donor_id uuid references public.donors(id),
  campaign_id uuid references public.campaigns(id),
  event_type text not null check (
    event_type in ('donation_created', 'donation_confirmed', 'donation_failed', 'donation_refunded', 'donation_disputed')
  ),
  amount numeric not null,
  currency text not null default 'INR',
  stripe_event_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  source text not null check (source in ('checkout_api', 'stripe_webhook', 'razorpay_webhook', 'admin_action')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  provider_event_id text,
  provider_order_id text,
  provider_payment_id text
);

create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
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

create table public.payment_webhook_events (
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

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id),
  actor_user_id uuid references auth.users(id),
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- Indexes from migrations / performance + idempotency.
create unique index tenant_memberships_tenant_user_unique_idx
  on public.tenant_memberships (tenant_id, user_id);

create unique index donors_tenant_email_unique_idx
  on public.donors (tenant_id, email);

create unique index volunteer_profiles_tenant_auth_user_unique_idx
  on public.volunteer_profiles (tenant_id, auth_user_id)
  where auth_user_id is not null;

create unique index idx_donations_tenant_checkout_session_unique
  on public.donations (tenant_id, stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create unique index idx_donations_tenant_payment_intent_unique
  on public.donations (tenant_id, stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

create unique index idx_donations_tenant_charge_unique
  on public.donations (tenant_id, stripe_charge_id)
  where stripe_charge_id is not null;

create index idx_donations_tenant_email_donated_at
  on public.donations (tenant_id, donor_email, donated_at desc);

create unique index idx_donations_tenant_razorpay_order_unique
  on public.donations (tenant_id, razorpay_order_id)
  where razorpay_order_id is not null;

create unique index idx_donations_tenant_razorpay_payment_unique
  on public.donations (tenant_id, razorpay_payment_id)
  where razorpay_payment_id is not null;

create index idx_donation_ledger_tenant_occurred_at
  on public.donation_ledger (tenant_id, occurred_at desc);

create index idx_donation_ledger_tenant_donation_occurred_at
  on public.donation_ledger (tenant_id, donation_id, occurred_at desc);

create unique index idx_donation_ledger_tenant_event_type_event_unique
  on public.donation_ledger (tenant_id, stripe_event_id, event_type)
  where stripe_event_id is not null;

create unique index idx_donation_ledger_tenant_provider_event_type_unique
  on public.donation_ledger (tenant_id, provider_event_id, event_type)
  where provider_event_id is not null;

create index idx_stripe_webhook_events_status_received_at
  on public.stripe_webhook_events (status, received_at desc);

create index idx_stripe_webhook_events_tenant_received_at
  on public.stripe_webhook_events (tenant_id, received_at desc);

create index idx_payment_webhook_events_status_received_at
  on public.payment_webhook_events (status, received_at desc);

create index idx_payment_webhook_events_tenant_received_at
  on public.payment_webhook_events (tenant_id, received_at desc);

commit;
