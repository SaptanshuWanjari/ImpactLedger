-- Fast SQL seed for analytics/admin/donor/volunteer pages.
-- Tenant-scoped and rerunnable.

DO $$
DECLARE
  v_tenant_slug text := 'lions-global';
  v_tenant_id uuid;
  v_admin_user_id uuid;
  v_donor_user_id uuid;
  v_volunteer_user_id uuid;
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

  SELECT id INTO v_admin_user_id FROM auth.users WHERE lower(email) = 'org-admin@lions.org' LIMIT 1;
  SELECT id INTO v_donor_user_id FROM auth.users WHERE lower(email) = 'john@example.com' LIMIT 1;
  SELECT id INTO v_volunteer_user_id FROM auth.users WHERE lower(email) = 'sarah@example.com' LIMIT 1;

  DELETE FROM public.audit_logs WHERE tenant_id = v_tenant_id;
  DELETE FROM public.field_reports WHERE tenant_id = v_tenant_id;
  DELETE FROM public.volunteer_assignments WHERE tenant_id = v_tenant_id;
  DELETE FROM public.volunteer_profiles WHERE tenant_id = v_tenant_id;
  DELETE FROM public.expenses WHERE tenant_id = v_tenant_id;
  DELETE FROM public.allocation_ledger WHERE tenant_id = v_tenant_id;
  DELETE FROM public.donation_ledger WHERE tenant_id = v_tenant_id;
  DELETE FROM public.stripe_webhook_events WHERE tenant_id = v_tenant_id;
  DELETE FROM public.donations WHERE tenant_id = v_tenant_id;
  DELETE FROM public.donors WHERE tenant_id = v_tenant_id;
  DELETE FROM public.campaign_updates WHERE tenant_id = v_tenant_id;
  DELETE FROM public.campaigns WHERE tenant_id = v_tenant_id;

  INSERT INTO public.campaigns (
    tenant_id, title, description, category, location, image_url,
    goal_amount, currency, status, urgency, starts_at, ends_at
  )
  SELECT
    v_tenant_id,
    c.title,
    c.description,
    c.category,
    c.location,
    c.image_url,
    c.goal_amount,
    'INR',
    c.status::public.campaign_status,
    c.urgency::public.urgency_level,
    timezone('utc', now()) - make_interval(days => c.starts_days_ago),
    CASE WHEN c.ends_days_ago IS NULL THEN NULL ELSE timezone('utc', now()) - make_interval(days => c.ends_days_ago) END
  FROM (
    VALUES
      ('Jal Jeevan Rural Water Mission', 'Solar-powered water systems and hygiene training for villages with unsafe drinking water.', 'Health & Sanitation', 'Bihar, India', 'https://images.unsplash.com/photo-1541516166103-3ad240173934?auto=format&fit=crop&q=80&w=1200', 2000000::numeric, 'active', 'high', 180, NULL),
      ('Assam Flood Emergency Relief', 'Rapid deployment of food kits, medicines, and temporary shelters in flood-hit districts.', 'Disaster Relief', 'Assam, India', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200', 5000000::numeric, 'urgent', 'high', 75, NULL),
      ('Udaan Scholarship Program', 'Scholarships, teacher mentoring, and learning kits for first-generation students.', 'Education', 'Uttar Pradesh, India', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200', 1500000::numeric, 'active', 'medium', 240, NULL),
      ('Sehat on Wheels Clinics', 'Deploying mobile primary-care vans and diagnostics in underserved talukas.', 'Healthcare', 'Maharashtra, India', 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200', 2600000::numeric, 'active', 'medium', 120, NULL),
      ('Aravalli Reforestation Drive', 'Native tree plantation and watershed restoration with school eco-clubs.', 'Environment', 'Rajasthan, India', 'https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?auto=format&fit=crop&q=80&w=1200', 1200000::numeric, 'planning', 'low', 30, NULL),
      ('Nayi Disha Women Livelihood Program', 'Vocational training and micro-enterprise support for women self-help groups.', 'Livelihood', 'Karnataka, India', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200', 1800000::numeric, 'completed', 'low', 330, 20)
  ) AS c(title, description, category, location, image_url, goal_amount, status, urgency, starts_days_ago, ends_days_ago);

  INSERT INTO public.donors (
    tenant_id, auth_user_id, full_name, email, phone, communications_opt_in, is_anonymous
  )
  SELECT
    v_tenant_id,
    d.auth_user_id,
    d.full_name,
    d.email,
    d.phone,
    d.communications_opt_in,
    d.is_anonymous
  FROM (
    VALUES
      (v_donor_user_id, 'Aarav Mehta', 'john@example.com', '+91-9000000001', true, false),
      (v_volunteer_user_id, 'Kavya Sharma', 'sarah@example.com', '+91-9000000002', true, false),
      (NULL::uuid, 'Arjun Mehta', 'arjun@example.com', '+91-9000000003', false, false),
      (NULL::uuid, 'Priya Nair', 'priya@example.com', '+91-9000000004', true, false),
      (NULL::uuid, 'Bharat Relief Trust', 'grants@bharatrelief.org', '+91-8040011100', true, false),
      (NULL::uuid, 'Shakti Industries CSR', 'csr@shaktiindustries.in', '+91-8040012200', true, true),
      (NULL::uuid, 'Leena Joseph', 'leena@example.com', '+91-9000000005', true, false),
      (NULL::uuid, 'Nikhil Rao', 'nikhil@example.com', '+91-9000000006', false, false)
  ) AS d(auth_user_id, full_name, email, phone, communications_opt_in, is_anonymous);

  INSERT INTO public.donations (
    tenant_id, donor_id, donor_name, donor_email, campaign_id,
    amount, currency, status, payment_method, source,
    donated_at, receipt_url, failure_reason, refunded_amount, dispute_status,
    stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id,
    stripe_event_last_id, stripe_customer_id, is_recurring, updated_at, payment_provider
  )
  SELECT
    v_tenant_id,
    dn.id,
    COALESCE(dn.full_name, t.donor_email),
    t.donor_email,
    cp.id,
    t.amount,
    'INR',
    t.status::public.donation_status,
    t.payment_method,
    'web',
    timezone('utc', now()) - make_interval(days => t.days_ago),
    CASE WHEN t.status IN ('succeeded', 'refunded', 'disputed') THEN 'https://receipts.example.com/' || v_tenant_slug || '/donation-' || t.seq ELSE NULL END,
    t.failure_reason,
    t.refunded_amount,
    t.dispute_status,
    'cs_test_seed_' || v_tenant_slug || '_' || t.seq,
    'pi_test_seed_' || v_tenant_slug || '_' || t.seq,
    'ch_test_seed_' || v_tenant_slug || '_' || t.seq,
    'evt_test_seed_' || v_tenant_slug || '_' || t.seq,
    CASE WHEN dn.id IS NULL THEN NULL ELSE 'cus_seed_' || substring(replace(dn.id::text, '-', '') from 1 for 12) END,
    (t.seq % 5 = 0),
    timezone('utc', now()) - make_interval(days => GREATEST(t.days_ago - 1, 0)),
    'razorpay'
  FROM (
    VALUES
      (1, 'john@example.com', 'Jal Jeevan Rural Water Mission', 25000::numeric, 'succeeded', 'Visa •••• 4242', 2, NULL::text, 0::numeric, 'none'),
      (2, 'john@example.com', 'Assam Flood Emergency Relief', 40000::numeric, 'succeeded', 'UPI', 10, NULL::text, 0::numeric, 'none'),
      (3, 'john@example.com', 'Udaan Scholarship Program', 18000::numeric, 'refunded', 'Visa •••• 4242', 24, NULL::text, 18000::numeric, 'none'),
      (4, 'sarah@example.com', 'Sehat on Wheels Clinics', 12000::numeric, 'succeeded', 'NetBanking', 5, NULL::text, 0::numeric, 'none'),
      (5, 'arjun@example.com', 'Assam Flood Emergency Relief', 90000::numeric, 'disputed', 'Mastercard •••• 7788', 8, NULL::text, 0::numeric, 'needs_response'),
      (6, 'priya@example.com', 'Jal Jeevan Rural Water Mission', 15000::numeric, 'failed', 'UPI', 11, 'insufficient_funds', 0::numeric, 'none'),
      (7, 'grants@bharatrelief.org', 'Udaan Scholarship Program', 250000::numeric, 'succeeded', 'Bank Transfer', 35, NULL::text, 0::numeric, 'none'),
      (8, 'csr@shaktiindustries.in', 'Sehat on Wheels Clinics', 320000::numeric, 'succeeded', 'Wire Transfer', 42, NULL::text, 0::numeric, 'none'),
      (9, 'leena@example.com', NULL::text, 11000::numeric, 'pending', 'UPI', 1, NULL::text, 0::numeric, 'none'),
      (10, 'nikhil@example.com', 'Aravalli Reforestation Drive', 8000::numeric, 'failed', 'Card', 16, 'card_declined', 0::numeric, 'none'),
      (11, 'priya@example.com', 'Assam Flood Emergency Relief', 22000::numeric, 'succeeded', 'UPI', 52, NULL::text, 0::numeric, 'none'),
      (12, 'leena@example.com', 'Udaan Scholarship Program', 7000::numeric, 'succeeded', 'Wallet', 60, NULL::text, 0::numeric, 'none'),
      (13, 'arjun@example.com', 'Jal Jeevan Rural Water Mission', 10000::numeric, 'succeeded', 'NetBanking', 72, NULL::text, 0::numeric, 'none'),
      (14, 'grants@bharatrelief.org', 'Assam Flood Emergency Relief', 300000::numeric, 'succeeded', 'Bank Transfer', 88, NULL::text, 0::numeric, 'none'),
      (15, 'nikhil@example.com', 'Nayi Disha Women Livelihood Program', 12000::numeric, 'succeeded', 'Card', 102, NULL::text, 0::numeric, 'none'),
      (16, 'john@example.com', NULL::text, 5000::numeric, 'succeeded', 'UPI', 118, NULL::text, 0::numeric, 'none'),
      (17, 'priya@example.com', 'Nayi Disha Women Livelihood Program', 6000::numeric, 'succeeded', 'Wallet', 133, NULL::text, 0::numeric, 'none'),
      (18, 'arjun@example.com', 'Sehat on Wheels Clinics', 8500::numeric, 'succeeded', 'UPI', 146, NULL::text, 0::numeric, 'none'),
      (19, 'nikhil@example.com', 'Aravalli Reforestation Drive', 4500::numeric, 'pending', 'Card', 0, NULL::text, 0::numeric, 'none')
  ) AS t(seq, donor_email, campaign_title, amount, status, payment_method, days_ago, failure_reason, refunded_amount, dispute_status)
  LEFT JOIN public.donors dn ON dn.tenant_id = v_tenant_id AND lower(dn.email) = lower(t.donor_email)
  LEFT JOIN public.campaigns cp ON cp.tenant_id = v_tenant_id AND cp.title = t.campaign_title;

  INSERT INTO public.allocation_ledger (
    tenant_id, donation_id, campaign_id, event_type, category, amount, notes, source, occurred_at
  )
  SELECT
    v_tenant_id,
    d.id,
    d.campaign_id,
    'allocation_created',
    'Direct Aid',
    d.amount,
    'Auto allocation from donation confirmation',
    'system',
    d.donated_at
  FROM public.donations d
  WHERE d.tenant_id = v_tenant_id
    AND d.status IN ('succeeded', 'refunded', 'disputed');

  INSERT INTO public.expenses (
    tenant_id, campaign_id, allocation_id, category, vendor,
    amount, currency, status, notes, expense_date
  )
  SELECT
    v_tenant_id,
    cp.id,
    al.id,
    e.category,
    e.vendor,
    e.amount,
    'INR',
    e.status::public.expense_status,
    e.notes,
    (timezone('utc', now()) - make_interval(days => e.days_ago))::date
  FROM (
    VALUES
      ('Jal Jeevan Rural Water Mission', 1, 'Infrastructure', 'AquaBuild Co', 38000::numeric, 'approved', 'Pipeline repair and pump servicing', 1),
      ('Assam Flood Emergency Relief', 2, 'Logistics', 'Rapid Transit Relief', 94000::numeric, 'submitted', 'Temporary shelter transport', 4),
      ('Udaan Scholarship Program', 7, 'Supplies', 'BrightPath Stationery', 56000::numeric, 'approved', 'School kits for 1,200 students', 15),
      ('Sehat on Wheels Clinics', 8, 'Medical', 'HealthBridge Supplies', 72000::numeric, 'draft', 'Consumables procurement pending approval', 2),
      ('Nayi Disha Women Livelihood Program', 15, 'Training', 'SkillSpark Trainers', 22000::numeric, 'approved', 'Final cohort certification workshops', 33)
  ) AS e(campaign_title, donation_seq, category, vendor, amount, status, notes, days_ago)
  JOIN public.campaigns cp ON cp.tenant_id = v_tenant_id AND cp.title = e.campaign_title
  JOIN public.donations d ON d.tenant_id = v_tenant_id AND d.stripe_event_last_id = 'evt_test_seed_' || v_tenant_slug || '_' || e.donation_seq
  LEFT JOIN public.allocation_ledger al ON al.tenant_id = v_tenant_id AND al.donation_id = d.id;

  INSERT INTO public.campaign_updates (
    tenant_id, campaign_id, title, content, image_url, published_at
  )
  SELECT
    v_tenant_id,
    cp.id,
    u.title,
    u.content,
    u.image_url,
    timezone('utc', now()) - make_interval(days => u.days_ago)
  FROM (
    VALUES
      ('Jal Jeevan Rural Water Mission', 'Water Quality Milestone Achieved', 'Monthly testing confirms safe water output across all operating boreholes.', 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800', 3),
      ('Assam Flood Emergency Relief', 'Shelter Cluster Activated', '3,000 emergency kits delivered and temporary shelters activated in priority zones.', 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800', 6),
      ('Udaan Scholarship Program', 'Semester Grants Released', 'Scholarship disbursements released for the spring cohort.', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800', 18),
      ('Nayi Disha Women Livelihood Program', 'Program Closed with 93% Placement', 'Graduation milestone closed with high placement and local enterprise adoption.', 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800', 25)
  ) AS u(campaign_title, title, content, image_url, days_ago)
  JOIN public.campaigns cp ON cp.tenant_id = v_tenant_id AND cp.title = u.campaign_title;

  INSERT INTO public.volunteer_profiles (
    tenant_id, auth_user_id, full_name, email, certifications_count, hours_logged, impact_score
  )
  VALUES
    (v_tenant_id, v_volunteer_user_id, 'Kavya Sharma', 'sarah@example.com', 3, 138, 96),
    (v_tenant_id, NULL, 'Ravi Kulkarni', 'ravi@example.com', 4, 212, 99),
    (v_tenant_id, NULL, 'Aman Verma', 'alex@example.com', 2, 88, 91),
    (v_tenant_id, NULL, 'Mina Das', 'mina@example.com', 2, 67, 89);

  INSERT INTO public.volunteer_assignments (
    tenant_id, campaign_id, volunteer_id, title, location,
    priority, status, assignment_type, starts_at, due_at
  )
  SELECT
    v_tenant_id,
    cp.id,
    vp.id,
    a.title,
    a.location,
    a.priority::public.urgency_level,
    a.status::public.assignment_status,
    a.assignment_type,
    timezone('utc', now()) - make_interval(days => a.starts_days_ago),
    timezone('utc', now()) - make_interval(days => a.due_days_ago)
  FROM (
    VALUES
      ('Jal Jeevan Rural Water Mission', 'sarah@example.com', 'Pump Pressure Validation', 'Patna Field Hub', 'high', 'assigned', 'Technical', -1, -3),
      ('Assam Flood Emergency Relief', 'sarah@example.com', 'Emergency Kit Distribution', 'Guwahati Operations Hub', 'high', 'accepted', 'Logistics', 1, -5),
      ('Udaan Scholarship Program', 'alex@example.com', 'Scholarship Beneficiary Verification', 'Lucknow Learning Hub', 'medium', 'completed', 'Field Verification', 8, 2),
      ('Sehat on Wheels Clinics', 'mina@example.com', 'Patient Intake Survey', 'Nashik Mobile Unit', 'medium', 'assigned', 'Survey', 0, -2)
  ) AS a(campaign_title, volunteer_email, title, location, priority, status, assignment_type, starts_days_ago, due_days_ago)
  JOIN public.campaigns cp ON cp.tenant_id = v_tenant_id AND cp.title = a.campaign_title
  JOIN public.volunteer_profiles vp ON vp.tenant_id = v_tenant_id AND lower(vp.email) = lower(a.volunteer_email);

  INSERT INTO public.field_reports (
    tenant_id, assignment_id, volunteer_id, impact_metric, notes, status, submitted_at
  )
  SELECT
    v_tenant_id,
    va.id,
    va.volunteer_id,
    r.impact_metric,
    r.notes,
    r.status,
    timezone('utc', now()) - make_interval(days => r.days_ago)
  FROM (
    VALUES
      ('Scholarship Beneficiary Verification', 112, 'Verified 112 scholarship recipients with document evidence.', 'reviewed', 1),
      ('Pump Pressure Validation', 36, '36 pump systems passed pressure validation checklist.', 'submitted', 0),
      ('Patient Intake Survey', 64, 'Patient intake forms need correction for 6 records.', 'returned', 2)
  ) AS r(assignment_title, impact_metric, notes, status, days_ago)
  JOIN public.volunteer_assignments va ON va.tenant_id = v_tenant_id AND va.title = r.assignment_title;

  INSERT INTO public.donation_ledger (
    tenant_id, donation_id, donor_id, campaign_id, event_type,
    amount, currency, stripe_event_id, source, metadata, occurred_at
  )
  SELECT
    v_tenant_id,
    d.id,
    d.donor_id,
    d.campaign_id,
    e.event_type,
    d.amount,
    d.currency,
    e.stripe_event_id,
    e.source,
    '{"seeded": true}'::jsonb,
    d.donated_at
  FROM public.donations d
  JOIN LATERAL (
    SELECT 'donation_created'::text AS event_type, d.stripe_event_last_id || '_created' AS stripe_event_id, 'checkout_api'::text AS source
    UNION ALL
    SELECT 'donation_confirmed', d.stripe_event_last_id || '_confirmed', 'stripe_webhook'
      WHERE d.status IN ('succeeded', 'refunded', 'disputed')
    UNION ALL
    SELECT 'donation_failed', d.stripe_event_last_id || '_failed', 'stripe_webhook'
      WHERE d.status = 'failed'
    UNION ALL
    SELECT 'donation_refunded', d.stripe_event_last_id || '_refunded', 'stripe_webhook'
      WHERE d.status = 'refunded'
    UNION ALL
    SELECT 'donation_disputed', d.stripe_event_last_id || '_disputed', 'stripe_webhook'
      WHERE d.status = 'disputed'
  ) e ON true
  WHERE d.tenant_id = v_tenant_id;

  INSERT INTO public.stripe_webhook_events (
    tenant_id, event_id, event_type, api_version, livemode, status,
    error_message, payload, received_at, processed_at
  )
  SELECT
    v_tenant_id,
    d.stripe_event_last_id || '_wh',
    CASE
      WHEN d.status = 'failed' THEN 'payment_intent.payment_failed'
      WHEN d.status = 'refunded' THEN 'charge.refunded'
      WHEN d.status = 'disputed' THEN 'charge.dispute.created'
      ELSE 'payment_intent.succeeded'
    END,
    '2025-02-24.acacia',
    false,
    CASE
      WHEN t.seq % 4 = 0 THEN 'received'
      WHEN t.seq % 3 = 0 THEN 'failed'
      ELSE 'processed'
    END,
    CASE WHEN t.seq % 3 = 0 THEN 'synthetic webhook processor timeout' ELSE NULL END,
    jsonb_build_object('id', d.stripe_event_last_id, 'object', 'event', 'seeded', true, 'donation_id', d.id),
    d.donated_at,
    CASE WHEN t.seq % 4 = 0 THEN NULL ELSE timezone('utc', now()) - make_interval(days => GREATEST(t.seq::int, 1)) END
  FROM (
    SELECT
      d.id,
      d.status,
      d.donated_at,
      d.stripe_event_last_id,
      row_number() OVER (ORDER BY d.created_at ASC) AS seq
    FROM public.donations d
    WHERE d.tenant_id = v_tenant_id
  ) t
  JOIN public.donations d ON d.id = t.id
  WHERE t.seq <= 10;

  INSERT INTO public.audit_logs (
    tenant_id, actor_user_id, actor_email, action, target_type, target_id, metadata, created_at
  )
  VALUES
    (v_tenant_id, v_admin_user_id, 'org-admin@lions.org', 'campaign_created', 'campaign', (SELECT id::text FROM public.campaigns WHERE tenant_id = v_tenant_id AND title = 'Assam Flood Emergency Relief' LIMIT 1), '{"seeded": true, "category": "Flood Relief"}'::jsonb, timezone('utc', now()) - interval '75 days'),
    (v_tenant_id, v_admin_user_id, 'org-admin@lions.org', 'expense_submitted', 'expense', NULL, '{"seeded": true, "amount": 94000, "currency": "INR"}'::jsonb, timezone('utc', now()) - interval '4 days'),
    (v_tenant_id, v_admin_user_id, 'org-admin@lions.org', 'expense_approved', 'expense', NULL, '{"seeded": true, "amount": 56000, "currency": "INR"}'::jsonb, timezone('utc', now()) - interval '14 days'),
    (v_tenant_id, v_volunteer_user_id, 'sarah@example.com', 'assignment_updated', 'volunteer_assignment', NULL, '{"seeded": true, "status": "accepted"}'::jsonb, timezone('utc', now()) - interval '5 days'),
    (v_tenant_id, v_admin_user_id, 'org-admin@lions.org', 'rbac_policy_reviewed', 'security', NULL, '{"seeded": true, "result": "ok"}'::jsonb, timezone('utc', now()) - interval '3 days'),
    (v_tenant_id, v_donor_user_id, 'john@example.com', 'donation_created', 'donation', (SELECT id::text FROM public.donations WHERE tenant_id = v_tenant_id ORDER BY created_at ASC LIMIT 1), '{"seeded": true, "amount": 25000}'::jsonb, timezone('utc', now()) - interval '2 days');
END $$;
