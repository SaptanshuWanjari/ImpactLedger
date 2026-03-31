begin;

set search_path = public, app;

-- Normalize legacy admin-like roles to org_admin before tightening constraints.
update public.tenant_memberships
set role = 'org_admin'
where role in ('finance_admin', 'coordinator', 'super_admin');

-- Keep auth metadata aligned with the new 3-role model.
update auth.users
set raw_app_meta_data = jsonb_set(
  coalesce(raw_app_meta_data, '{}'::jsonb),
  '{app_role}',
  '"org_admin"'::jsonb,
  true
)
where coalesce(raw_app_meta_data ->> 'app_role', '') in ('finance_admin', 'coordinator', 'super_admin');

-- Restrict tenant membership roles to donor/volunteer/org_admin only.
alter table public.tenant_memberships
  drop constraint if exists tenant_memberships_role_check;

alter table public.tenant_memberships
  add constraint tenant_memberships_role_check
  check (role = any (array['donor'::text, 'volunteer'::text, 'org_admin'::text]));

-- Donor policies: donor self + org_admin only.
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

-- Volunteer profile policies: volunteer self + org_admin only.
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

-- Membership visibility: self + org_admin only.
drop policy if exists "tenant memberships read self or admin" on public.tenant_memberships;
create policy "tenant memberships read self or admin"
  on public.tenant_memberships
  for select
  to public
  using (
    user_id = auth.uid()
    or app.user_has_any_role(tenant_id, array['org_admin'])
  );

commit;
