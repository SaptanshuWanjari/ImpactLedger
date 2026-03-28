import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatShortDate, titleCase, urgencyLabel } from "@/lib/api/format";

const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "lions-global";
const DEFAULT_DONOR_EMAIL = process.env.NEXT_PUBLIC_DEMO_DONOR_EMAIL || "john@example.com";
const DEFAULT_VOLUNTEER_EMAIL = process.env.NEXT_PUBLIC_DEMO_VOLUNTEER_EMAIL || "sarah@example.com";

export async function getTenantId() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", DEFAULT_TENANT_SLUG)
    .single();

  if (error) {
    throw new Error(`Unable to resolve tenant: ${error.message}`);
  }

  return data.id as string;
}

function mapCampaign(campaign: any) {
  return {
    id: campaign.id,
    title: campaign.title,
    location: campaign.location,
    category: campaign.category,
    urgency: urgencyLabel(campaign.urgency),
    image: campaign.image_url,
    description: campaign.description,
    progress: campaign.progress_percent || 0,
    goal: formatCurrency(campaign.goal_amount, campaign.currency),
    raised: formatCurrency(campaign.raised_amount, campaign.currency),
    goalAmount: Number(campaign.goal_amount || 0),
    raisedAmount: Number(campaign.raised_amount || 0),
    status: titleCase(campaign.status),
  };
}

export async function getCampaigns() {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { data, error } = await supabase
    .from("campaign_funding_summary")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(mapCampaign);
}

export async function getCampaignById(campaignId: string) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const [campaignResponse, updatesResponse] = await Promise.all([
    supabase
      .from("campaign_funding_summary")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", campaignId)
      .single(),
    supabase
      .from("campaign_updates")
      .select("id,title,content,image_url,published_at")
      .eq("tenant_id", tenantId)
      .eq("campaign_id", campaignId)
      .order("published_at", { ascending: false })
      .limit(5),
  ]);

  if (campaignResponse.error) throw new Error(campaignResponse.error.message);
  if (updatesResponse.error) throw new Error(updatesResponse.error.message);

  return {
    ...mapCampaign(campaignResponse.data),
    updates: (updatesResponse.data || []).map((update) => ({
      id: update.id,
      title: update.title,
      content: update.content,
      image: update.image_url,
      date: formatShortDate(update.published_at),
    })),
  };
}

export async function getHomeOverview() {
  const [campaigns, transparency, donations] = await Promise.all([
    getCampaigns(),
    getTransparencyLedger(5),
    getRecentDonations(DEFAULT_DONOR_EMAIL, 3),
  ]);

  const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.raisedAmount, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "Active" || c.status === "Urgent").length;

  return {
    stats: [
      { label: "Total Impact", value: formatCurrency(totalRaised) },
      { label: "Active Missions", value: String(activeCampaigns) },
      { label: "Global Projects", value: String(campaigns.length) },
      { label: "Transparency Score", value: "99.8%" },
    ],
    campaigns: campaigns.slice(0, 3),
    allocationBreakdown: [
      { label: "Direct Aid", value: 85 },
      { label: "Operational Support", value: 10 },
      { label: "Fundraising", value: 5 },
    ],
    latestLedger: transparency,
    recentDonations: donations,
  };
}

export async function getTransparencyLedger(limit = 20) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { data, error } = await supabase
    .from("transparency_ledger")
    .select("id,occurred_at,campaign,location,category,amount,event_type")
    .eq("tenant_id", tenantId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data || []).map((entry) => ({
    id: String(entry.id).slice(0, 8).toUpperCase(),
    date: formatShortDate(entry.occurred_at),
    campaign: entry.campaign,
    hub: entry.location || "Global",
    amount: formatCurrency(entry.amount),
    type: titleCase(entry.category),
    status: "Verified",
  }));
}

export async function getRecentDonations(donorEmail = DEFAULT_DONOR_EMAIL, limit = 10) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { data, error } = await supabase
    .from("donations")
    .select("id,amount,currency,payment_method,status,donated_at,campaigns(title)")
    .eq("tenant_id", tenantId)
    .eq("donor_email", donorEmail)
    .order("donated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data || []).map((donation: any) => ({
    id: `DON-${String(donation.id).slice(0, 6).toUpperCase()}`,
    rawId: donation.id,
    date: formatShortDate(donation.donated_at),
    campaign: donation.campaigns?.title || "General Fund",
    amount: formatCurrency(donation.amount, donation.currency),
    amountValue: Number(donation.amount || 0),
    method: donation.payment_method || "Card",
    status: titleCase(donation.status),
    impact: "Impact verified",
  }));
}

export async function getDonorDashboard(donorEmail = DEFAULT_DONOR_EMAIL) {
  const [donations, ledger] = await Promise.all([
    getRecentDonations(donorEmail, 20),
    getTransparencyLedger(10),
  ]);

  const total = donations.reduce((sum, d) => sum + d.amountValue, 0);

  return {
    donorName: donorEmail === "john@example.com" ? "John" : donorEmail.split("@")[0],
    stats: {
      lifetimeDonated: formatCurrency(total),
      ytdImpact: formatCurrency(total * 0.35),
      patronSince: "2022",
      nextMilestone: formatCurrency(Math.ceil((total + 1) / 5000) * 5000),
    },
    allocation: [
      { name: "Clean Water", value: 45, color: "#00338D" },
      { name: "Education", value: 25, color: "#E63946" },
      { name: "Emergency Relief", value: 20, color: "#141414" },
      { name: "Operational", value: 10, color: "#737373" },
    ],
    donationHistory: donations,
    impactTimeline: ledger.slice(0, 3).map((entry) => ({
      date: entry.date,
      event: `${entry.campaign} Update`,
      location: entry.hub,
      impact: `${entry.type} recorded`,
    })),
  };
}

export async function getAdminDashboard() {
  const [campaigns, donations, operations] = await Promise.all([
    getCampaigns(),
    getRecentDonations(DEFAULT_DONOR_EMAIL, 12),
    getOperations(),
  ]);

  const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.raisedAmount, 0);

  return {
    kpis: [
      { label: "Total Stewardship", value: formatCurrency(totalRaised), change: "+12.5%", trend: "up" },
      { label: "Active Stewards", value: "12,540", change: "+5.2%", trend: "up" },
      { label: "Regional Hubs", value: "24", change: "0%", trend: "neutral" },
      { label: "Transparency Score", value: "99.8%", change: "+0.1%", trend: "up" },
    ],
    growth: campaigns.slice(0, 7).map((campaign, index) => ({
      name: campaign.title.split(" ")[0] || `C${index + 1}`,
      value: campaign.raisedAmount,
    })),
    recentActivity: [
      ...donations.slice(0, 3).map((donation) => ({
        id: donation.id,
        type: "Donation",
        user: DEFAULT_DONOR_EMAIL,
        amount: donation.amount,
        status: donation.status,
        date: donation.date,
      })),
      ...operations.slice(0, 2).map((operation) => ({
        id: operation.id,
        type: operation.type,
        user: operation.hub,
        amount: operation.amount,
        status: operation.status,
        date: operation.date,
      })),
    ],
  };
}

export async function getOperations() {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { data: expenses, error: expenseError } = await supabase
    .from("expenses")
    .select("id,category,vendor,amount,status,expense_date,campaigns(location)")
    .eq("tenant_id", tenantId)
    .order("expense_date", { ascending: false })
    .limit(20);

  if (expenseError) throw new Error(expenseError.message);

  return (expenses || []).map((expense: any) => ({
    id: expense.id,
    type: "Expense",
    title: expense.category,
    hub: expense.campaigns?.location || "Global",
    amount: formatCurrency(expense.amount),
    status: titleCase(expense.status),
    date: formatShortDate(expense.expense_date),
  }));
}

export async function getVolunteerDashboard(volunteerEmail = DEFAULT_VOLUNTEER_EMAIL) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { data: volunteer, error: volunteerError } = await supabase
    .from("volunteer_profiles")
    .select("id,full_name,hours_logged,impact_score,certifications_count")
    .eq("tenant_id", tenantId)
    .eq("email", volunteerEmail)
    .single();

  if (volunteerError) throw new Error(volunteerError.message);

  const { data: assignments, error: assignmentError } = await supabase
    .from("volunteer_assignments")
    .select("id,title,location,status,priority,assignment_type,due_at")
    .eq("tenant_id", tenantId)
    .eq("volunteer_id", volunteer.id)
    .order("due_at", { ascending: true });

  if (assignmentError) throw new Error(assignmentError.message);

  return {
    volunteerName: volunteer.full_name,
    stats: {
      hoursLogged: String(volunteer.hours_logged || 0),
      missionsJoined: String((assignments || []).length),
      impactScore: String(volunteer.impact_score || 0),
      certifications: String(volunteer.certifications_count || 0),
    },
    assignments: (assignments || []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      location: assignment.location,
      status: titleCase(assignment.status),
      urgency: urgencyLabel(assignment.priority),
      type: assignment.assignment_type,
      deadline: assignment.due_at ? formatShortDate(assignment.due_at) : "TBD",
    })),
    syncQueue: [
      { id: 1, type: "Survey Form", status: "Pending Sync", date: "10 mins ago" },
      { id: 2, type: "Photo Log", status: "Pending Sync", date: "15 mins ago" },
    ],
  };
}

export async function createDonation(input: {
  fullName: string;
  email: string;
  amount: number;
  campaignId?: string | null;
  isAnonymous?: boolean;
  paymentMethod?: string;
}) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const donorPayload = {
    tenant_id: tenantId,
    full_name: input.fullName,
    email: input.email,
    is_anonymous: Boolean(input.isAnonymous),
  };

  const { data: donorRow, error: donorError } = await supabase
    .from("donors")
    .upsert(donorPayload, { onConflict: "tenant_id,email" })
    .select("id")
    .single();

  if (donorError) throw new Error(donorError.message);

  const donationPayload = {
    tenant_id: tenantId,
    donor_id: donorRow.id,
    donor_name: input.fullName,
    donor_email: input.email,
    campaign_id: input.campaignId || null,
    amount: input.amount,
    currency: "USD",
    status: "pending",
    payment_method: input.paymentMethod || "Card",
    source: "web",
  };

  const { data: donationRow, error: donationError } = await supabase
    .from("donations")
    .insert(donationPayload)
    .select("id")
    .single();

  if (donationError) throw new Error(donationError.message);

  await supabase
    .from("audit_logs")
    .insert({
      tenant_id: tenantId,
      actor_email: input.email,
      action: "donation_created",
      target_type: "donation",
      target_id: donationRow.id,
      metadata: { amount: input.amount, campaign_id: input.campaignId || null },
    });

  return { id: donationRow.id };
}

export async function createExpense(input: {
  campaignId?: string | null;
  category: string;
  amount: number;
  notes?: string;
  vendor?: string;
}) {
  const supabase = await createClient();
  const tenantId = await getTenantId();

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      tenant_id: tenantId,
      campaign_id: input.campaignId || null,
      category: input.category,
      amount: input.amount,
      notes: input.notes || null,
      vendor: input.vendor || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return data;
}

export async function createFieldReport(input: {
  assignmentId?: string | null;
  volunteerEmail?: string;
  impactMetric?: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const tenantId = await getTenantId();
  const volunteerEmail = input.volunteerEmail || DEFAULT_VOLUNTEER_EMAIL;

  const { data: volunteer, error: volunteerError } = await supabase
    .from("volunteer_profiles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", volunteerEmail)
    .single();

  if (volunteerError) throw new Error(volunteerError.message);

  const { data, error } = await supabase
    .from("field_reports")
    .insert({
      tenant_id: tenantId,
      assignment_id: input.assignmentId || null,
      volunteer_id: volunteer.id,
      impact_metric: input.impactMetric || null,
      notes: input.notes || null,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return data;
}
