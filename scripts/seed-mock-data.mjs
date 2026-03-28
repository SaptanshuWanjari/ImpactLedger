import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const tenantSlug = process.env.SEED_TENANT_SLUG || "lions-global";

function isoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

async function run() {
  const { data: tenantRow, error: tenantErr } = await supabase
    .from("tenants")
    .upsert(
      {
        slug: tenantSlug,
        name: "Lions International Global",
        country_code: "IN",
        timezone: "Asia/Kolkata",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (tenantErr) throw tenantErr;
  const tenantId = tenantRow.id;

  for (const table of [
    "audit_logs",
    "field_reports",
    "volunteer_assignments",
    "volunteer_profiles",
    "expenses",
    "allocation_ledger",
    "donations",
    "donors",
    "campaign_updates",
    "campaigns",
  ]) {
    const { error } = await supabase.from(table).delete().eq("tenant_id", tenantId);
    if (error) throw error;
  }

  const { data: campaigns, error: campaignErr } = await supabase
    .from("campaigns")
    .insert([
      {
        tenant_id: tenantId,
        title: "Clean Water Initiative",
        description:
          "Providing sustainable clean water access through solar-powered boreholes and sanitation programs.",
        category: "Health & Sanitation",
        location: "Kenya",
        image_url:
          "https://images.unsplash.com/photo-1541516166103-3ad240173934?auto=format&fit=crop&q=80&w=1200",
        goal_amount: 50000,
        currency: "USD",
        status: "active",
        urgency: "high",
        starts_at: isoDaysAgo(120),
      },
      {
        tenant_id: tenantId,
        title: "Emergency Relief: Cyclone",
        description:
          "Immediate emergency relief support for cyclone-affected communities.",
        category: "Disaster Relief",
        location: "Vietnam",
        image_url:
          "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200",
        goal_amount: 100000,
        currency: "USD",
        status: "urgent",
        urgency: "high",
        starts_at: isoDaysAgo(60),
      },
      {
        tenant_id: tenantId,
        title: "Youth Education Fund",
        description: "Scholarships, school supplies, and education access programs.",
        category: "Education",
        location: "Peru",
        image_url:
          "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200",
        goal_amount: 25000,
        currency: "USD",
        status: "active",
        urgency: "medium",
        starts_at: isoDaysAgo(180),
      },
      {
        tenant_id: tenantId,
        title: "Reforestation Project",
        description: "Native tree restoration and long-term ecosystem stewardship.",
        category: "Environment",
        location: "Brazil",
        image_url:
          "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?auto=format&fit=crop&q=80&w=1200",
        goal_amount: 200000,
        currency: "USD",
        status: "planning",
        urgency: "low",
        starts_at: isoDaysAgo(30),
      },
      {
        tenant_id: tenantId,
        title: "Mobile Health Clinic",
        description: "Field health screenings and primary care support in remote regions.",
        category: "Health & Sanitation",
        location: "India",
        image_url:
          "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200",
        goal_amount: 75000,
        currency: "USD",
        status: "active",
        urgency: "medium",
        starts_at: isoDaysAgo(90),
      },
    ])
    .select("id,title,location");

  if (campaignErr) throw campaignErr;

  const campaignMap = Object.fromEntries(campaigns.map((c) => [c.title, c]));

  const { data: donors, error: donorErr } = await supabase
    .from("donors")
    .insert([
      {
        tenant_id: tenantId,
        full_name: "John Doe",
        email: "john@example.com",
        phone: "+1-555-0100",
        communications_opt_in: true,
      },
      {
        tenant_id: tenantId,
        full_name: "Sarah Smith",
        email: "sarah@example.com",
        phone: "+1-555-0199",
        communications_opt_in: true,
      },
    ])
    .select("id,email,full_name");

  if (donorErr) throw donorErr;

  const donorMap = Object.fromEntries(donors.map((d) => [d.email, d]));

  const donationRows = [
    {
      tenant_id: tenantId,
      donor_id: donorMap["john@example.com"].id,
      donor_name: "John Doe",
      donor_email: "john@example.com",
      campaign_id: campaignMap["Clean Water Initiative"].id,
      amount: 500,
      status: "succeeded",
      payment_method: "Visa •••• 4242",
      donated_at: isoDaysAgo(10),
      source: "web",
    },
    {
      tenant_id: tenantId,
      donor_id: donorMap["john@example.com"].id,
      donor_name: "John Doe",
      donor_email: "john@example.com",
      campaign_id: campaignMap["Emergency Relief: Cyclone"].id,
      amount: 1200,
      status: "succeeded",
      payment_method: "Bank Transfer",
      donated_at: isoDaysAgo(24),
      source: "web",
    },
    {
      tenant_id: tenantId,
      donor_id: donorMap["john@example.com"].id,
      donor_name: "John Doe",
      donor_email: "john@example.com",
      campaign_id: campaignMap["Youth Education Fund"].id,
      amount: 250,
      status: "succeeded",
      payment_method: "Visa •••• 4242",
      donated_at: isoDaysAgo(45),
      source: "web",
    },
    {
      tenant_id: tenantId,
      donor_id: donorMap["sarah@example.com"].id,
      donor_name: "Sarah Smith",
      donor_email: "sarah@example.com",
      campaign_id: campaignMap["Mobile Health Clinic"].id,
      amount: 900,
      status: "succeeded",
      payment_method: "Apple Pay",
      donated_at: isoDaysAgo(12),
      source: "web",
    },
  ];

  const { data: insertedDonations, error: donationErr } = await supabase
    .from("donations")
    .insert(donationRows)
    .select("id,campaign_id,amount,donated_at,donor_email");

  if (donationErr) throw donationErr;

  const allocations = insertedDonations.map((d) => ({
    tenant_id: tenantId,
    donation_id: d.id,
    campaign_id: d.campaign_id,
    event_type: "allocation_created",
    category: "Direct Aid",
    amount: d.amount,
    notes: "Initial allocation from confirmed donation",
    source: "system",
    occurred_at: d.donated_at,
  }));

  const { data: allocationRows, error: allocationErr } = await supabase
    .from("allocation_ledger")
    .insert(allocations)
    .select("id,campaign_id");

  if (allocationErr) throw allocationErr;

  const { error: expenseErr } = await supabase.from("expenses").insert([
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Clean Water Initiative"].id,
      allocation_id: allocationRows[0]?.id,
      category: "Infrastructure",
      vendor: "Kenya Water Works",
      amount: 1250,
      status: "approved",
      notes: "Borehole maintenance and water testing",
      expense_date: isoDaysAgo(7).slice(0, 10),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Emergency Relief: Cyclone"].id,
      allocation_id: allocationRows[1]?.id,
      category: "Logistics",
      vendor: "Rapid Relief Transit",
      amount: 2400,
      status: "submitted",
      notes: "Transport for emergency kits",
      expense_date: isoDaysAgo(3).slice(0, 10),
    },
  ]);

  if (expenseErr) throw expenseErr;

  const { data: updates, error: updatesErr } = await supabase
    .from("campaign_updates")
    .insert([
      {
        tenant_id: tenantId,
        campaign_id: campaignMap["Clean Water Initiative"].id,
        title: "Phase 3 Completion",
        content:
          "Third solar-powered borehole is operational and now serves 150 additional families.",
        image_url:
          "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400",
        published_at: isoDaysAgo(6),
      },
      {
        tenant_id: tenantId,
        campaign_id: campaignMap["Clean Water Initiative"].id,
        title: "Community Training Session",
        content:
          "Local leaders completed sanitation and maintenance workshop certification.",
        image_url:
          "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400",
        published_at: isoDaysAgo(20),
      },
      {
        tenant_id: tenantId,
        campaign_id: campaignMap["Emergency Relief: Cyclone"].id,
        title: "Emergency Kits Delivered",
        content:
          "First response distribution reached three priority districts.",
        image_url:
          "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=400",
        published_at: isoDaysAgo(4),
      },
    ])
    .select("id");

  if (updatesErr) throw updatesErr;

  const { data: volunteers, error: volunteerErr } = await supabase
    .from("volunteer_profiles")
    .insert([
      {
        tenant_id: tenantId,
        full_name: "Sarah Smith",
        email: "sarah@example.com",
        skills: ["first-aid", "field-reporting", "logistics"],
        certifications_count: 3,
        hours_logged: 124,
        impact_score: 98,
      },
      {
        tenant_id: tenantId,
        full_name: "Alex Rivera",
        email: "alex@example.com",
        skills: ["water-testing", "community-outreach"],
        certifications_count: 2,
        hours_logged: 88,
        impact_score: 91,
      },
    ])
    .select("id,email");

  if (volunteerErr) throw volunteerErr;

  const volunteerMap = Object.fromEntries(volunteers.map((v) => [v.email, v]));

  const { data: assignments, error: assignmentErr } = await supabase
    .from("volunteer_assignments")
    .insert([
      {
        tenant_id: tenantId,
        campaign_id: campaignMap["Clean Water Initiative"].id,
        volunteer_id: volunteerMap["sarah@example.com"].id,
        title: "Borehole Maintenance",
        location: "Kenya Hub",
        priority: "high",
        status: "assigned",
        assignment_type: "Technical",
        due_at: isoDaysAgo(-2),
      },
      {
        tenant_id: tenantId,
        campaign_id: campaignMap["Emergency Relief: Cyclone"].id,
        volunteer_id: volunteerMap["sarah@example.com"].id,
        title: "Food Distribution",
        location: "Vietnam Hub",
        priority: "medium",
        status: "accepted",
        assignment_type: "Logistics",
        due_at: isoDaysAgo(-5),
      },
      {
        tenant_id: tenantId,
        campaign_id: campaignMap["Youth Education Fund"].id,
        volunteer_id: volunteerMap["alex@example.com"].id,
        title: "School Supply Delivery",
        location: "Peru Hub",
        priority: "high",
        status: "completed",
        assignment_type: "Education",
        due_at: isoDaysAgo(-1),
      },
    ])
    .select("id,volunteer_id");

  if (assignmentErr) throw assignmentErr;

  const { error: reportErr } = await supabase.from("field_reports").insert([
    {
      tenant_id: tenantId,
      assignment_id: assignments[2]?.id,
      volunteer_id: assignments[2]?.volunteer_id,
      impact_metric: 120,
      notes: "Supplies distributed to 120 students",
      status: "reviewed",
      submitted_at: isoDaysAgo(1),
    },
    {
      tenant_id: tenantId,
      assignment_id: assignments[0]?.id,
      volunteer_id: assignments[0]?.volunteer_id,
      impact_metric: 45,
      notes: "Maintenance checklist completed for Sector 4 site",
      status: "submitted",
      submitted_at: isoDaysAgo(0),
    },
  ]);

  if (reportErr) throw reportErr;

  const { error: auditErr } = await supabase.from("audit_logs").insert([
    {
      tenant_id: tenantId,
      actor_email: "finance-admin@lions.org",
      action: "expense_submitted",
      target_type: "expense",
      metadata: { amount: 2400, currency: "USD" },
    },
    {
      tenant_id: tenantId,
      actor_email: "org-admin@lions.org",
      action: "campaign_updated",
      target_type: "campaign",
      metadata: { title: "Clean Water Initiative" },
    },
  ]);

  if (auditErr) throw auditErr;

  console.log(`Seed complete for tenant ${tenantSlug} (${tenantId})`);
  console.log(`Campaigns: ${campaigns.length}, Donations: ${insertedDonations.length}, Updates: ${updates.length}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
