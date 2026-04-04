-- Seed auth-linked app profiles/memberships quickly via SQL.
-- Note: this does NOT create auth users. Create users in Supabase Auth first,
-- then run this file to link them to tenant records.

DO $$
DECLARE
  v_tenant_slug text := 'lions-global';
  v_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants (slug, name, country_code, timezone)
  VALUES (v_tenant_slug, 'Impact Ledger India', 'IN', 'Asia/Kolkata')
  ON CONFLICT (slug)
  DO UPDATE SET
    name = EXCLUDED.name,
    country_code = EXCLUDED.country_code,
    timezone = EXCLUDED.timezone,
    updated_at = timezone('utc', now())
  RETURNING id INTO v_tenant_id;

  IF v_tenant_id IS NULL THEN
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = v_tenant_slug;
  END IF;

  INSERT INTO public.profiles (id, full_name, email)
  SELECT
    u.id,
    m.full_name,
    m.email
  FROM (VALUES
    ('org-admin@lions.org', 'Org Admin'),
    ('john@example.com', 'Aarav Mehta'),
    ('sarah@example.com', 'Kavya Sharma')
  ) AS m(email, full_name)
  JOIN auth.users u ON lower(u.email) = lower(m.email)
  ON CONFLICT (id)
  DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = timezone('utc', now());

  UPDATE public.tenant_memberships tm
  SET role = src.role
  FROM (
    SELECT
      v_tenant_id AS tenant_id,
      u.id AS user_id,
      m.role AS role
    FROM (VALUES
      ('org-admin@lions.org', 'org_admin'),
      ('john@example.com', 'donor'),
      ('sarah@example.com', 'volunteer')
    ) AS m(email, role)
    JOIN auth.users u ON lower(u.email) = lower(m.email)
  ) AS src
  WHERE tm.tenant_id = src.tenant_id
    AND tm.user_id = src.user_id;

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  SELECT
    v_tenant_id,
    u.id,
    m.role
  FROM (VALUES
    ('org-admin@lions.org', 'org_admin'),
    ('john@example.com', 'donor'),
    ('sarah@example.com', 'volunteer')
  ) AS m(email, role)
  JOIN auth.users u ON lower(u.email) = lower(m.email)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = v_tenant_id
      AND tm.user_id = u.id
  );

  UPDATE public.donors d
  SET
    auth_user_id = src.auth_user_id,
    full_name = src.full_name,
    communications_opt_in = src.communications_opt_in,
    is_anonymous = src.is_anonymous,
    updated_at = timezone('utc', now())
  FROM (
    SELECT
      v_tenant_id AS tenant_id,
      u.id AS auth_user_id,
      m.full_name AS full_name,
      m.email AS email,
      true AS communications_opt_in,
      false AS is_anonymous
    FROM (VALUES
      ('org-admin@lions.org', 'Org Admin'),
      ('john@example.com', 'Aarav Mehta'),
      ('sarah@example.com', 'Kavya Sharma')
    ) AS m(email, full_name)
    JOIN auth.users u ON lower(u.email) = lower(m.email)
  ) AS src
  WHERE d.tenant_id = src.tenant_id
    AND lower(d.email) = lower(src.email);

  INSERT INTO public.donors (
    tenant_id,
    auth_user_id,
    full_name,
    email,
    communications_opt_in,
    is_anonymous
  )
  SELECT
    v_tenant_id,
    u.id,
    m.full_name,
    m.email,
    true,
    false
  FROM (VALUES
    ('org-admin@lions.org', 'Org Admin'),
    ('john@example.com', 'Aarav Mehta'),
    ('sarah@example.com', 'Kavya Sharma')
  ) AS m(email, full_name)
  JOIN auth.users u ON lower(u.email) = lower(m.email)
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.donors d
    WHERE d.tenant_id = v_tenant_id
      AND lower(d.email) = lower(m.email)
  );

  UPDATE public.volunteer_profiles vp
  SET
    auth_user_id = u.id,
    full_name = 'Kavya Sharma',
    email = 'sarah@example.com',
    certifications_count = 2,
    hours_logged = 42,
    impact_score = 87,
    updated_at = timezone('utc', now())
  FROM auth.users u
  WHERE lower(u.email) = 'sarah@example.com'
    AND vp.tenant_id = v_tenant_id
    AND (
      vp.auth_user_id = u.id
      OR lower(vp.email) = 'sarah@example.com'
    );

  INSERT INTO public.volunteer_profiles (
    tenant_id,
    auth_user_id,
    full_name,
    email,
    certifications_count,
    hours_logged,
    impact_score
  )
  SELECT
    v_tenant_id,
    u.id,
    'Kavya Sharma',
    'sarah@example.com',
    2,
    42,
    87
  FROM auth.users u
  WHERE lower(u.email) = 'sarah@example.com'
    AND NOT EXISTS (
      SELECT 1
      FROM public.volunteer_profiles vp
      WHERE vp.tenant_id = v_tenant_id
        AND (vp.auth_user_id = u.id OR lower(vp.email) = 'sarah@example.com')
    );
END $$;
