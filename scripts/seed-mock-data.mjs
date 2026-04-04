import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required env vars for seeding.");
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? "set" : "missing"}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing"}`);
  console.error(`SUPABASE_SERVICE_ROLE: ${process.env.SUPABASE_SERVICE_ROLE ? "set" : "missing"}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const tenantSlug = process.env.SEED_TENANT_SLUG || process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "lions-global";

const roleEmails = {
  orgAdmin: process.env.SEED_ADMIN_EMAIL || "org-admin@lions.org",
  donor: process.env.SEED_DONOR_EMAIL || "john@example.com",
  volunteer: process.env.SEED_VOLUNTEER_EMAIL || "sarah@example.com",
};

function isoDaysAgo(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function dateDaysAgo(days) {
  return isoDaysAgo(days).slice(0, 10);
}

async function getTenantId() {
  const { data, error } = await supabase
    .from("tenants")
    .upsert(
      {
        slug: tenantSlug,
        name: "Impact Ledger",
        country_code: "IN",
        timezone: "Asia/Kolkata",
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function listAuthUsersByEmail(emails) {
  const wanted = new Set(emails.map((email) => email.toLowerCase()));
  const usersByEmail = new Map();

  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const users = data?.users || [];
    for (const user of users) {
      const email = user.email?.toLowerCase();
      if (email && wanted.has(email)) {
        usersByEmail.set(email, user);
      }
    }

    if (users.length < 200) break;
    page += 1;
  }

  return usersByEmail;
}

async function deleteByTenant(table, tenantId) {
  const { error } = await supabase.from(table).delete().eq("tenant_id", tenantId);

  if (error && error.code === "42P01") {
    console.warn(`Skipping missing table '${table}'.`);
    return;
  }

  if (error) throw error;
}

async function insertIfTableExists(table, rows, selectColumns = "id") {
  if (!rows.length) return [];

  const response = await supabase.from(table).insert(rows).select(selectColumns);

  if (response.error && response.error.code === "42P01") {
    console.warn(`Skipping optional table '${table}' (not found).`);
    return [];
  }

  if (response.error) throw response.error;
  return response.data || [];
}

async function run() {
  const tenantId = await getTenantId();

  for (const table of [
    "audit_logs",
    "field_reports",
    "volunteer_assignments",
    "volunteer_profiles",
    "expenses",
    "allocation_ledger",
    "donation_ledger",
    "stripe_webhook_events",
    "donations",
    "donors",
    "campaign_updates",
    "campaigns",
  ]) {
    await deleteByTenant(table, tenantId);
  }

  const authUsers = await listAuthUsersByEmail(Object.values(roleEmails));

  const campaignRows = [
    {
      tenant_id: tenantId,
      title: "Jal Jeevan Rural Water Mission",
      description: "Solar-powered water systems and hygiene training for villages with unsafe drinking water.",
      category: "Health & Sanitation",
      location: "Bihar, India",
      image_url: "https://images.unsplash.com/photo-1541516166103-3ad240173934?auto=format&fit=crop&q=80&w=1200",
      goal_amount: 2000000,
      currency: "INR",
      status: "active",
      urgency: "high",
      starts_at: isoDaysAgo(180),
    },
    {
      tenant_id: tenantId,
      title: "Assam Flood Emergency Relief",
      description: "Rapid deployment of food kits, medicines, and temporary shelters in flood-hit districts.",
      category: "Disaster Relief",
      location: "Assam, India",
      image_url: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200",
      goal_amount: 5000000,
      currency: "INR",
      status: "urgent",
      urgency: "high",
      starts_at: isoDaysAgo(75),
    },
    {
      tenant_id: tenantId,
      title: "Udaan Scholarship Program",
      description: "Scholarships, teacher mentoring, and learning kits for first-generation students.",
      category: "Education",
      location: "Uttar Pradesh, India",
      image_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200",
      goal_amount: 1500000,
      currency: "INR",
      status: "active",
      urgency: "medium",
      starts_at: isoDaysAgo(240),
    },
    {
      tenant_id: tenantId,
      title: "Sehat on Wheels Clinics",
      description: "Deploying mobile primary-care vans and diagnostics in underserved talukas.",
      category: "Healthcare",
      location: "Maharashtra, India",
      image_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=1200",
      goal_amount: 2600000,
      currency: "INR",
      status: "active",
      urgency: "medium",
      starts_at: isoDaysAgo(120),
    },
    {
      tenant_id: tenantId,
      title: "Aravalli Reforestation Drive",
      description: "Native tree plantation and watershed restoration with school eco-clubs.",
      category: "Environment",
      location: "Rajasthan, India",
      image_url: "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?auto=format&fit=crop&q=80&w=1200",
      goal_amount: 1200000,
      currency: "INR",
      status: "planning",
      urgency: "low",
      starts_at: isoDaysAgo(30),
    },
    {
      tenant_id: tenantId,
      title: "Nayi Disha Women Livelihood Program",
      description: "Vocational training and micro-enterprise support for women self-help groups.",
      category: "Livelihood",
      location: "Karnataka, India",
      image_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200",
      goal_amount: 1800000,
      currency: "INR",
      status: "completed",
      urgency: "low",
      starts_at: isoDaysAgo(330),
      ends_at: isoDaysAgo(20),
    },
  ];

  const campaigns = await insertIfTableExists(tableName("campaigns"), campaignRows, "id,title,location");
  const campaignMap = Object.fromEntries(campaigns.map((campaign) => [campaign.title, campaign]));

  const donorRows = [
    { full_name: "Aarav Mehta", email: roleEmails.donor, phone: "+91-9000000001", communications_opt_in: true, is_anonymous: false },
    { full_name: "Kavya Sharma", email: roleEmails.volunteer, phone: "+91-9000000002", communications_opt_in: true, is_anonymous: false },
    { full_name: "Arjun Mehta", email: "arjun@example.com", phone: "+91-9000000003", communications_opt_in: false, is_anonymous: false },
    { full_name: "Priya Nair", email: "priya@example.com", phone: "+91-9000000004", communications_opt_in: true, is_anonymous: false },
    { full_name: "Bharat Relief Trust", email: "grants@bharatrelief.org", phone: "+91-8040011100", communications_opt_in: true, is_anonymous: false },
    { full_name: "Shakti Industries CSR", email: "csr@shaktiindustries.in", phone: "+91-8040012200", communications_opt_in: true, is_anonymous: true },
    { full_name: "Leena Joseph", email: "leena@example.com", phone: "+91-9000000005", communications_opt_in: true, is_anonymous: false },
    { full_name: "Nikhil Rao", email: "nikhil@example.com", phone: "+91-9000000006", communications_opt_in: false, is_anonymous: false },
  ].map((donor) => ({
    tenant_id: tenantId,
    ...donor,
    auth_user_id: authUsers.get(donor.email.toLowerCase())?.id || null,
  }));

  const donors = await insertIfTableExists(tableName("donors"), donorRows, "id,email,full_name");
  const donorMap = Object.fromEntries(donors.map((donor) => [donor.email, donor]));

  const donationTemplates = [
    { donorEmail: roleEmails.donor, campaignTitle: "Jal Jeevan Rural Water Mission", amount: 25000, status: "succeeded", paymentMethod: "Visa •••• 4242", daysAgo: 2 },
    { donorEmail: roleEmails.donor, campaignTitle: "Assam Flood Emergency Relief", amount: 40000, status: "succeeded", paymentMethod: "UPI", daysAgo: 10 },
    { donorEmail: roleEmails.donor, campaignTitle: "Udaan Scholarship Program", amount: 18000, status: "refunded", paymentMethod: "Visa •••• 4242", daysAgo: 24, refundedAmount: 18000 },
    { donorEmail: roleEmails.volunteer, campaignTitle: "Sehat on Wheels Clinics", amount: 12000, status: "succeeded", paymentMethod: "NetBanking", daysAgo: 5 },
    { donorEmail: "arjun@example.com", campaignTitle: "Assam Flood Emergency Relief", amount: 90000, status: "disputed", paymentMethod: "Mastercard •••• 7788", daysAgo: 8, disputeStatus: "needs_response" },
    { donorEmail: "priya@example.com", campaignTitle: "Jal Jeevan Rural Water Mission", amount: 15000, status: "failed", paymentMethod: "UPI", daysAgo: 11, failureReason: "insufficient_funds" },
    { donorEmail: "grants@bharatrelief.org", campaignTitle: "Udaan Scholarship Program", amount: 250000, status: "succeeded", paymentMethod: "Bank Transfer", daysAgo: 35 },
    { donorEmail: "csr@shaktiindustries.in", campaignTitle: "Sehat on Wheels Clinics", amount: 320000, status: "succeeded", paymentMethod: "Wire Transfer", daysAgo: 42 },
    { donorEmail: "leena@example.com", campaignTitle: null, amount: 11000, status: "pending", paymentMethod: "UPI", daysAgo: 1 },
    { donorEmail: "nikhil@example.com", campaignTitle: "Aravalli Reforestation Drive", amount: 8000, status: "failed", paymentMethod: "Card", daysAgo: 16, failureReason: "card_declined" },
    { donorEmail: "priya@example.com", campaignTitle: "Assam Flood Emergency Relief", amount: 22000, status: "succeeded", paymentMethod: "UPI", daysAgo: 52 },
    { donorEmail: "leena@example.com", campaignTitle: "Udaan Scholarship Program", amount: 7000, status: "succeeded", paymentMethod: "Wallet", daysAgo: 60 },
    { donorEmail: "arjun@example.com", campaignTitle: "Jal Jeevan Rural Water Mission", amount: 10000, status: "succeeded", paymentMethod: "NetBanking", daysAgo: 72 },
    { donorEmail: "grants@bharatrelief.org", campaignTitle: "Assam Flood Emergency Relief", amount: 300000, status: "succeeded", paymentMethod: "Bank Transfer", daysAgo: 88 },
    { donorEmail: "nikhil@example.com", campaignTitle: "Nayi Disha Women Livelihood Program", amount: 12000, status: "succeeded", paymentMethod: "Card", daysAgo: 102 },
    { donorEmail: roleEmails.donor, campaignTitle: null, amount: 5000, status: "succeeded", paymentMethod: "UPI", daysAgo: 118 },
    { donorEmail: "priya@example.com", campaignTitle: "Nayi Disha Women Livelihood Program", amount: 6000, status: "succeeded", paymentMethod: "Wallet", daysAgo: 133 },
    { donorEmail: "arjun@example.com", campaignTitle: "Sehat on Wheels Clinics", amount: 8500, status: "succeeded", paymentMethod: "UPI", daysAgo: 146 },
    { donorEmail: "nikhil@example.com", campaignTitle: "Aravalli Reforestation Drive", amount: 4500, status: "pending", paymentMethod: "Card", daysAgo: 0 },
  ];

  const donationRows = donationTemplates.map((item, index) => {
    const donor = donorMap[item.donorEmail];
    const campaign = item.campaignTitle ? campaignMap[item.campaignTitle] : null;
    const status = item.status;

    const isConfirmedLike = status === "succeeded" || status === "refunded" || status === "disputed";

    return {
      tenant_id: tenantId,
      donor_id: donor?.id || null,
      donor_name: donor?.full_name || item.donorEmail,
      donor_email: item.donorEmail,
      campaign_id: campaign?.id || null,
      amount: item.amount,
      currency: "INR",
      status,
      payment_method: item.paymentMethod,
      source: "web",
      donated_at: isoDaysAgo(item.daysAgo),
      receipt_url: isConfirmedLike ? `https://receipts.example.com/${tenantSlug}/donation-${index + 1}` : null,
      failure_reason: item.failureReason || null,
      refunded_amount: item.refundedAmount || 0,
      dispute_status: item.disputeStatus || "none",
      stripe_checkout_session_id: `cs_test_seed_${tenantSlug}_${index + 1}`,
      stripe_payment_intent_id: `pi_test_seed_${tenantSlug}_${index + 1}`,
      stripe_charge_id: `ch_test_seed_${tenantSlug}_${index + 1}`,
      stripe_event_last_id: `evt_test_seed_${tenantSlug}_${index + 1}`,
      stripe_customer_id: donor?.id ? `cus_seed_${String(donor.id).replace(/-/g, "").slice(0, 12)}` : null,
      is_recurring: index % 5 === 0,
      updated_at: isoDaysAgo(Math.max(item.daysAgo - 1, 0)),
    };
  });

  const insertedDonations = await insertIfTableExists(
    tableName("donations"),
    donationRows,
    "id,donor_id,campaign_id,amount,currency,status,donated_at,stripe_event_last_id"
  );

  const allocationRows = insertedDonations
    .filter((donation) => donation.status === "succeeded" || donation.status === "refunded" || donation.status === "disputed")
    .map((donation) => ({
      tenant_id: tenantId,
      donation_id: donation.id,
      campaign_id: donation.campaign_id,
      event_type: "allocation_created",
      category: "Direct Aid",
      amount: donation.amount,
      notes: "Auto allocation from donation confirmation",
      source: "system",
      occurred_at: donation.donated_at,
    }));

  const allocations = await insertIfTableExists(tableName("allocation_ledger"), allocationRows, "id,campaign_id,donation_id");

  const allocationByDonation = new Map(allocations.map((row) => [row.donation_id, row]));

  const expenseRows = [
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Jal Jeevan Rural Water Mission"].id,
      allocation_id: allocationByDonation.get(insertedDonations[0]?.id)?.id || null,
      category: "Infrastructure",
      vendor: "AquaBuild Co",
      amount: 38000,
      currency: "INR",
      status: "approved",
      notes: "Pipeline repair and pump servicing",
      expense_date: dateDaysAgo(1),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Assam Flood Emergency Relief"].id,
      allocation_id: allocationByDonation.get(insertedDonations[1]?.id)?.id || null,
      category: "Logistics",
      vendor: "Rapid Transit Relief",
      amount: 94000,
      currency: "INR",
      status: "submitted",
      notes: "Temporary shelter transport",
      expense_date: dateDaysAgo(4),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Udaan Scholarship Program"].id,
      allocation_id: allocationByDonation.get(insertedDonations[6]?.id)?.id || null,
      category: "Supplies",
      vendor: "BrightPath Stationery",
      amount: 56000,
      currency: "INR",
      status: "approved",
      notes: "School kits for 1,200 students",
      expense_date: dateDaysAgo(15),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Sehat on Wheels Clinics"].id,
      allocation_id: allocationByDonation.get(insertedDonations[7]?.id)?.id || null,
      category: "Medical",
      vendor: "HealthBridge Supplies",
      amount: 72000,
      currency: "INR",
      status: "draft",
      notes: "Consumables procurement pending approval",
      expense_date: dateDaysAgo(2),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Nayi Disha Women Livelihood Program"].id,
      allocation_id: allocationByDonation.get(insertedDonations[14]?.id)?.id || null,
      category: "Training",
      vendor: "SkillSpark Trainers",
      amount: 22000,
      currency: "INR",
      status: "approved",
      notes: "Final cohort certification workshops",
      expense_date: dateDaysAgo(33),
    },
  ];

  await insertIfTableExists(tableName("expenses"), expenseRows, "id");

  const updateRows = [
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Jal Jeevan Rural Water Mission"].id,
      title: "Water Quality Milestone Achieved",
      content: "Monthly testing confirms safe water output across all operating boreholes.",
      image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=800",
      published_at: isoDaysAgo(3),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Assam Flood Emergency Relief"].id,
      title: "Shelter Cluster Activated",
      content: "3,000 emergency kits delivered and temporary shelters activated in priority zones.",
      image_url: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800",
      published_at: isoDaysAgo(6),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Udaan Scholarship Program"].id,
      title: "Semester Grants Released",
      content: "Scholarship disbursements released for the spring cohort.",
      image_url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800",
      published_at: isoDaysAgo(18),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Nayi Disha Women Livelihood Program"].id,
      title: "Program Closed with 93% Placement",
      content: "Graduation milestone closed with high placement and local enterprise adoption.",
      image_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800",
      published_at: isoDaysAgo(25),
    },
  ];

  await insertIfTableExists(tableName("campaign_updates"), updateRows, "id");

  const volunteerRows = [
    {
      tenant_id: tenantId,
      auth_user_id: authUsers.get(roleEmails.volunteer.toLowerCase())?.id || null,
      full_name: "Kavya Sharma",
      email: roleEmails.volunteer,
      certifications_count: 3,
      hours_logged: 138,
      impact_score: 96,
    },
    {
      tenant_id: tenantId,
      auth_user_id: null,
      full_name: "Ravi Kulkarni",
      email: "ravi@example.com",
      certifications_count: 4,
      hours_logged: 212,
      impact_score: 99,
    },
    {
      tenant_id: tenantId,
      auth_user_id: null,
      full_name: "Aman Verma",
      email: "alex@example.com",
      certifications_count: 2,
      hours_logged: 88,
      impact_score: 91,
    },
    {
      tenant_id: tenantId,
      auth_user_id: null,
      full_name: "Mina Das",
      email: "mina@example.com",
      certifications_count: 2,
      hours_logged: 67,
      impact_score: 89,
    },
  ];

  const volunteers = await insertIfTableExists(tableName("volunteer_profiles"), volunteerRows, "id,email");
  const volunteerMap = Object.fromEntries(volunteers.map((volunteer) => [volunteer.email, volunteer]));

  const assignmentRows = [
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Jal Jeevan Rural Water Mission"].id,
      volunteer_id: volunteerMap[roleEmails.volunteer].id,
      title: "Pump Pressure Validation",
      location: "Patna Field Hub",
      priority: "high",
      status: "assigned",
      assignment_type: "Technical",
      starts_at: isoDaysAgo(-1),
      due_at: isoDaysAgo(-3),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Assam Flood Emergency Relief"].id,
      volunteer_id: volunteerMap[roleEmails.volunteer].id,
      title: "Emergency Kit Distribution",
      location: "Guwahati Operations Hub",
      priority: "high",
      status: "accepted",
      assignment_type: "Logistics",
      starts_at: isoDaysAgo(1),
      due_at: isoDaysAgo(-5),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Udaan Scholarship Program"].id,
      volunteer_id: volunteerMap["alex@example.com"].id,
      title: "Scholarship Beneficiary Verification",
      location: "Lucknow Learning Hub",
      priority: "medium",
      status: "completed",
      assignment_type: "Field Verification",
      starts_at: isoDaysAgo(8),
      due_at: isoDaysAgo(2),
    },
    {
      tenant_id: tenantId,
      campaign_id: campaignMap["Sehat on Wheels Clinics"].id,
      volunteer_id: volunteerMap["mina@example.com"].id,
      title: "Patient Intake Survey",
      location: "Nashik Mobile Unit",
      priority: "medium",
      status: "assigned",
      assignment_type: "Survey",
      starts_at: isoDaysAgo(0),
      due_at: isoDaysAgo(-2),
    },
  ];

  const assignments = await insertIfTableExists(tableName("volunteer_assignments"), assignmentRows, "id,volunteer_id");

  const reportRows = [
    {
      tenant_id: tenantId,
      assignment_id: assignments[2]?.id || null,
      volunteer_id: assignments[2]?.volunteer_id || null,
      impact_metric: 112,
      notes: "Verified 112 scholarship recipients with document evidence.",
      status: "reviewed",
      submitted_at: isoDaysAgo(1),
    },
    {
      tenant_id: tenantId,
      assignment_id: assignments[0]?.id || null,
      volunteer_id: assignments[0]?.volunteer_id || null,
      impact_metric: 36,
      notes: "36 pump systems passed pressure validation checklist.",
      status: "submitted",
      submitted_at: isoDaysAgo(0),
    },
    {
      tenant_id: tenantId,
      assignment_id: assignments[3]?.id || null,
      volunteer_id: assignments[3]?.volunteer_id || null,
      impact_metric: 64,
      notes: "Patient intake forms need correction for 6 records.",
      status: "returned",
      submitted_at: isoDaysAgo(2),
    },
  ];

  await insertIfTableExists(tableName("field_reports"), reportRows, "id");

  const donationLedgerRows = [];
  for (const donation of insertedDonations) {
    donationLedgerRows.push({
      tenant_id: tenantId,
      donation_id: donation.id,
      donor_id: donation.donor_id,
      campaign_id: donation.campaign_id,
      event_type: "donation_created",
      amount: donation.amount,
      currency: donation.currency,
      stripe_event_id: `${donation.stripe_event_last_id}_created`,
      source: "checkout_api",
      metadata: { seeded: true },
      occurred_at: donation.donated_at,
    });

    if (donation.status === "succeeded" || donation.status === "refunded" || donation.status === "disputed") {
      donationLedgerRows.push({
        tenant_id: tenantId,
        donation_id: donation.id,
        donor_id: donation.donor_id,
        campaign_id: donation.campaign_id,
        event_type: "donation_confirmed",
        amount: donation.amount,
        currency: donation.currency,
        stripe_event_id: `${donation.stripe_event_last_id}_confirmed`,
        source: "stripe_webhook",
        metadata: { seeded: true },
        occurred_at: donation.donated_at,
      });
    }

    if (donation.status === "failed") {
      donationLedgerRows.push({
        tenant_id: tenantId,
        donation_id: donation.id,
        donor_id: donation.donor_id,
        campaign_id: donation.campaign_id,
        event_type: "donation_failed",
        amount: donation.amount,
        currency: donation.currency,
        stripe_event_id: `${donation.stripe_event_last_id}_failed`,
        source: "stripe_webhook",
        metadata: { seeded: true },
        occurred_at: donation.donated_at,
      });
    }

    if (donation.status === "refunded") {
      donationLedgerRows.push({
        tenant_id: tenantId,
        donation_id: donation.id,
        donor_id: donation.donor_id,
        campaign_id: donation.campaign_id,
        event_type: "donation_refunded",
        amount: donation.amount,
        currency: donation.currency,
        stripe_event_id: `${donation.stripe_event_last_id}_refunded`,
        source: "stripe_webhook",
        metadata: { seeded: true },
        occurred_at: donation.donated_at,
      });
    }

    if (donation.status === "disputed") {
      donationLedgerRows.push({
        tenant_id: tenantId,
        donation_id: donation.id,
        donor_id: donation.donor_id,
        campaign_id: donation.campaign_id,
        event_type: "donation_disputed",
        amount: donation.amount,
        currency: donation.currency,
        stripe_event_id: `${donation.stripe_event_last_id}_disputed`,
        source: "stripe_webhook",
        metadata: { seeded: true },
        occurred_at: donation.donated_at,
      });
    }
  }

  await insertIfTableExists(tableName("donation_ledger"), donationLedgerRows, "id");

  const webhookRows = insertedDonations.slice(0, 10).map((donation, index) => ({
    tenant_id: tenantId,
    event_id: `${donation.stripe_event_last_id || `evt_seed_${index + 1}`}_wh`,
    event_type:
      donation.status === "failed"
        ? "payment_intent.payment_failed"
        : donation.status === "refunded"
          ? "charge.refunded"
          : donation.status === "disputed"
            ? "charge.dispute.created"
            : "payment_intent.succeeded",
    api_version: "2025-02-24.acacia",
    livemode: false,
    status: index % 4 === 0 ? "received" : index % 3 === 0 ? "failed" : "processed",
    error_message: index % 3 === 0 ? "synthetic webhook processor timeout" : null,
    payload: {
      id: donation.stripe_event_last_id || `evt_seed_${index + 1}`,
      object: "event",
      seeded: true,
      donation_id: donation.id,
    },
    received_at: donation.donated_at,
    processed_at: index % 4 === 0 ? null : isoDaysAgo(Math.max(index, 1)),
  }));

  await insertIfTableExists(tableName("stripe_webhook_events"), webhookRows, "id");

  const auditRows = [
    {
      tenant_id: tenantId,
      actor_user_id: authUsers.get(roleEmails.orgAdmin.toLowerCase())?.id || null,
      actor_email: roleEmails.orgAdmin,
      action: "campaign_created",
      target_type: "campaign",
      target_id: campaignMap["Assam Flood Emergency Relief"].id,
      metadata: { seeded: true, category: "Flood Relief" },
      created_at: isoDaysAgo(75),
    },
    {
      tenant_id: tenantId,
      actor_user_id: authUsers.get(roleEmails.orgAdmin.toLowerCase())?.id || null,
      actor_email: roleEmails.orgAdmin,
      action: "expense_submitted",
      target_type: "expense",
      metadata: { seeded: true, amount: 94000, currency: "INR" },
      created_at: isoDaysAgo(4),
    },
    {
      tenant_id: tenantId,
      actor_user_id: authUsers.get(roleEmails.orgAdmin.toLowerCase())?.id || null,
      actor_email: roleEmails.orgAdmin,
      action: "expense_approved",
      target_type: "expense",
      metadata: { seeded: true, amount: 56000, currency: "INR" },
      created_at: isoDaysAgo(14),
    },
    {
      tenant_id: tenantId,
      actor_user_id: authUsers.get(roleEmails.volunteer.toLowerCase())?.id || null,
      actor_email: roleEmails.volunteer,
      action: "assignment_updated",
      target_type: "volunteer_assignment",
      metadata: { seeded: true, status: "accepted" },
      created_at: isoDaysAgo(5),
    },
    {
      tenant_id: tenantId,
      actor_user_id: authUsers.get(roleEmails.orgAdmin.toLowerCase())?.id || null,
      actor_email: roleEmails.orgAdmin,
      action: "rbac_policy_reviewed",
      target_type: "security",
      metadata: { seeded: true, result: "ok" },
      created_at: isoDaysAgo(3),
    },
    {
      tenant_id: tenantId,
      actor_user_id: authUsers.get(roleEmails.donor.toLowerCase())?.id || null,
      actor_email: roleEmails.donor,
      action: "donation_created",
      target_type: "donation",
      target_id: insertedDonations[0]?.id || null,
      metadata: { seeded: true, amount: insertedDonations[0]?.amount || 0 },
      created_at: isoDaysAgo(2),
    },
  ];

  await insertIfTableExists(tableName("audit_logs"), auditRows, "id");

  console.log(`Seed complete for tenant ${tenantSlug} (${tenantId})`);
  console.log(`Campaigns: ${campaignRows.length}`);
  console.log(`Donors: ${donorRows.length}`);
  console.log(`Donations: ${insertedDonations.length}`);
  console.log(`Expenses: ${expenseRows.length}`);
  console.log(`Volunteer Profiles: ${volunteerRows.length}`);
  console.log(`Assignments: ${assignmentRows.length}`);
  console.log(`Field Reports: ${reportRows.length}`);
  console.log(`Donation Ledger Events: ${donationLedgerRows.length}`);
  console.log(`Webhook Events: ${webhookRows.length}`);
  console.log(`Audit Logs: ${auditRows.length}`);
}

function tableName(value) {
  return value;
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
