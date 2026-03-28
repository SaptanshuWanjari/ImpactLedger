-- =========================
-- EXTENSIONS & SCHEMA
-- =========================
create extension if not exists pgcrypto;
create schema if not exists app;

-- =========================
-- GENERIC FUNCTIONS
-- =========================
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- =========================
-- ENUM TYPES
-- =========================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type public.campaign_status as enum ('planning', 'active', 'urgent', 'completed', 'paused');
  end if;

  if not exists (select 1 from pg_type where typname = 'urgency_level') then
    create type public.urgency_level as enum ('low', 'medium', 'high');
  end if;

  if not exists (select 1 from pg_type where typname = 'donation_status') then
    create type public.donation_status as enum ('pending', 'succeeded', 'failed', 'refunded', 'disputed');
  end if;

  if not exists (select 1 from pg_type where typname = 'expense_status') then
    create type public.expense_status as enum ('draft', 'submitted', 'approved', 'paid', 'reconciled', 'rejected');
  end if;

  if not exists (select 1 from pg_type where typname = 'assignment_status') then
    create type public.assignment_status as enum ('proposed', 'assigned', 'accepted', 'checked_in', 'completed', 'report_submitted', 'reviewed');
  end if;
end $$;

-- =========================
-- TABLES
-- =========================

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  country_code text,
  timezone text default 'Asia/Kolkata',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  phone text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('donor','volunteer','coordinator','finance_admin','org_admin','super_admin')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, user_id)
);

-- =========================
-- FUNCTION (AFTER TABLE)
-- =========================
create or replace function app.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
  );
$$;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  location text not null,
  image_url text,
  goal_amount numeric(12,2) not null check (goal_amount > 0),
  currency text not null default 'USD',
  status public.campaign_status not null default 'planning',
  urgency public.urgency_level not null default 'medium',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_campaigns_tenant_status on public.campaigns(tenant_id, status);
create index if not exists idx_campaigns_category on public.campaigns(category);

create table if not exists public.campaign_updates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  title text not null,
  content text not null,
  image_url text,
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_campaign_updates_campaign_published on public.campaign_updates(campaign_id, published_at desc);

create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  is_anonymous boolean not null default false,
  communications_opt_in boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, email)
);

create index if not exists idx_donors_tenant_email on public.donors(tenant_id, email);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  donor_id uuid references public.donors(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD',
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
  unique (tenant_id, stripe_payment_intent_id)
);

create index if not exists idx_donations_tenant_status_donated_at on public.donations(tenant_id, status, donated_at desc);
create index if not exists idx_donations_campaign on public.donations(campaign_id);

create table if not exists public.allocation_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  donation_id uuid references public.donations(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  event_type text not null check (event_type in ('allocation_created','allocation_adjusted','expense_posted','restriction_released')),
  category text not null,
  amount numeric(12,2) not null check (amount <> 0),
  notes text,
  source text not null default 'system',
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_allocation_ledger_tenant_occurred on public.allocation_ledger(tenant_id, occurred_at desc);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  allocation_id uuid references public.allocation_ledger(id) on delete set null,
  category text not null,
  vendor text,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'USD',
  status public.expense_status not null default 'draft',
  receipt_url text,
  notes text,
  submitted_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  expense_date date not null default current_date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_expenses_tenant_status on public.expenses(tenant_id, status);

create table if not exists public.volunteer_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text not null,
  skills text[] not null default '{}',
  certifications_count int not null default 0,
  hours_logged int not null default 0,
  impact_score int not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, email)
);

create index if not exists idx_volunteer_profiles_tenant_email on public.volunteer_profiles(tenant_id, email);

create table if not exists public.volunteer_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  volunteer_id uuid not null references public.volunteer_profiles(id) on delete cascade,
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

create index if not exists idx_volunteer_assignments_tenant_status on public.volunteer_assignments(tenant_id, status);
create index if not exists idx_volunteer_assignments_volunteer on public.volunteer_assignments(volunteer_id, due_at desc);

create table if not exists public.field_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  assignment_id uuid references public.volunteer_assignments(id) on delete set null,
  volunteer_id uuid references public.volunteer_profiles(id) on delete set null,
  impact_metric int,
  notes text,
  attachment_url text,
  status text not null default 'submitted' check (status in ('submitted','reviewed','returned')),
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_audit_logs_tenant_created on public.audit_logs(tenant_id, created_at desc);

-- =========================
-- VIEWS
-- =========================

create or replace view public.campaign_funding_summary as
select
  c.id,
  c.tenant_id,
  c.created_at,
  c.title,
  c.description,
  c.category,
  c.location,
  c.image_url,
  c.goal_amount,
  c.currency,
  c.status,
  c.urgency,
  coalesce(sum(case when d.status = 'succeeded' then d.amount else 0 end),0)::numeric(12,2) as raised_amount,
  greatest(
    least(
      case
        when c.goal_amount = 0 then 0
        else round((coalesce(sum(case when d.status='succeeded' then d.amount else 0 end),0)/c.goal_amount)*100)
      end,100
    ),0
  )::int as progress_percent
from public.campaigns c
left join public.donations d on d.campaign_id = c.id
group by c.id;

create or replace view public.transparency_ledger as
select
  al.id,
  al.tenant_id,
  al.occurred_at,
  coalesce(c.title,'General Fund') as campaign,
  c.location,
  al.category,
  al.amount,
  al.event_type,
  al.source
from public.allocation_ledger al
left join public.campaigns c on c.id = al.campaign_id;

-- =========================
-- TRIGGERS
-- =========================
create trigger trg_tenants_updated_at before update on public.tenants for each row execute procedure app.set_updated_at();
create trigger trg_profiles_updated_at before update on public.profiles for each row execute procedure app.set_updated_at();
create trigger trg_campaigns_updated_at before update on public.campaigns for each row execute procedure app.set_updated_at();
create trigger trg_donors_updated_at before update on public.donors for each row execute procedure app.set_updated_at();
create trigger trg_expenses_updated_at before update on public.expenses for each row execute procedure app.set_updated_at();
create trigger trg_volunteer_profiles_updated_at before update on public.volunteer_profiles for each row execute procedure app.set_updated_at();
create trigger trg_volunteer_assignments_updated_at before update on public.volunteer_assignments for each row execute procedure app.set_updated_at();

-- =========================
-- RLS
-- =========================
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_updates enable row level security;
alter table public.donors enable row level security;
alter table public.donations enable row level security;
alter table public.allocation_ledger enable row level security;
alter table public.expenses enable row level security;
alter table public.volunteer_profiles enable row level security;
alter table public.volunteer_assignments enable row level security;
alter table public.field_reports enable row level security;
alter table public.audit_logs enable row level security;

-- =========================
-- POLICIES
-- =========================

drop policy if exists "tenant members can read tenants" on public.tenants;
create policy "tenant members can read tenants" on public.tenants for select using (app.is_tenant_member(id));

drop policy if exists "tenant members can read memberships" on public.tenant_memberships;
create policy "tenant members can read memberships" on public.tenant_memberships for select using (app.is_tenant_member(tenant_id));

drop policy if exists "public can read active campaigns" on public.campaigns;
create policy "public can read active campaigns" on public.campaigns for select using (status in ('active','urgent','completed') or app.is_tenant_member(tenant_id));

drop policy if exists "members can manage campaigns" on public.campaigns;
create policy "members can manage campaigns" on public.campaigns for all using (app.is_tenant_member(tenant_id)) with check (app.is_tenant_member(tenant_id));

-- (remaining policies same pattern…)

revoke all on public.audit_logs from anon;

grant select on public.campaign_funding_summary to anon, authenticated;
grant select on public.transparency_ledger to anon, authenticated;

