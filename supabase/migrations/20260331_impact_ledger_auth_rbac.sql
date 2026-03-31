-- Auth + RBAC support for session-backed role checks.

create schema if not exists app;

create or replace function app.current_user_role(p_tenant_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tm.role
  from public.tenant_memberships tm
  where tm.tenant_id = p_tenant_id
    and tm.user_id = auth.uid()
  limit 1;
$$;

create or replace function app.user_has_any_role(p_tenant_id uuid, p_roles text[])
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
      and tm.role = any (p_roles)
  );
$$;

create unique index if not exists tenant_memberships_tenant_user_unique_idx
  on public.tenant_memberships (tenant_id, user_id);

create unique index if not exists donors_tenant_email_unique_idx
  on public.donors (tenant_id, email);

create unique index if not exists volunteer_profiles_tenant_auth_user_unique_idx
  on public.volunteer_profiles (tenant_id, auth_user_id)
  where auth_user_id is not null;

alter table public.profiles enable row level security;
alter table public.donors enable row level security;
alter table public.volunteer_profiles enable row level security;
alter table public.tenant_memberships enable row level security;

-- Profiles: users can read/update their own profile.
drop policy if exists "profiles self select" on public.profiles;
create policy "profiles self select"
  on public.profiles
  for select
  to public
  using (id = auth.uid());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles
  for update
  to public
  using (id = auth.uid())
  with check (id = auth.uid());

-- Donors: donors can read/update their row; admins can read tenant donors.
drop policy if exists "donors self select" on public.donors;
create policy "donors self select"
  on public.donors
  for select
  to public
  using (
    auth_user_id = auth.uid()
    or app.user_has_any_role(tenant_id, array['org_admin'])
  );

drop policy if exists "donors self update" on public.donors;
create policy "donors self update"
  on public.donors
  for update
  to public
  using (
    auth_user_id = auth.uid()
    or app.user_has_any_role(tenant_id, array['org_admin'])
  )
  with check (
    auth_user_id = auth.uid()
    or app.user_has_any_role(tenant_id, array['org_admin'])
  );

-- Volunteer profiles: volunteers can read/update their row; admins can read all.
drop policy if exists "volunteer profiles select" on public.volunteer_profiles;
create policy "volunteer profiles select"
  on public.volunteer_profiles
  for select
  to public
  using (
    auth_user_id = auth.uid()
    or app.user_has_any_role(tenant_id, array['org_admin'])
  );

drop policy if exists "volunteer profiles update" on public.volunteer_profiles;
create policy "volunteer profiles update"
  on public.volunteer_profiles
  for update
  to public
  using (
    auth_user_id = auth.uid()
    or app.user_has_any_role(tenant_id, array['org_admin'])
  )
  with check (
    auth_user_id = auth.uid()
    or app.user_has_any_role(tenant_id, array['org_admin'])
  );

-- Membership visibility for current user and admins.
drop policy if exists "tenant memberships read self or admin" on public.tenant_memberships;
create policy "tenant memberships read self or admin"
  on public.tenant_memberships
  for select
  to public
  using (
    user_id = auth.uid()
    or app.user_has_any_role(tenant_id, array['org_admin'])
  );
