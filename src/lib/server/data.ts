import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatShortDate, titleCase, urgencyLabel } from "@/lib/api/format";
import { ADMIN_ALLOWED_ROLES, requireAuthContext } from "@/lib/server/auth";
import { isRbacEnabled } from "@/lib/config/rbac";

const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "lions-global";
const DEFAULT_DONOR_EMAIL = process.env.NEXT_PUBLIC_DEMO_DONOR_EMAIL || "john@example.com";
const DEFAULT_VOLUNTEER_EMAIL = process.env.NEXT_PUBLIC_DEMO_VOLUNTEER_EMAIL || "sarah@example.com";
const MS_IN_DAY = 24 * 60 * 60 * 1000;

type ReportRange = "7d" | "30d" | "90d" | "all";

function isTransientFetchError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.toLowerCase().includes("fetch failed");
}

async function runWithFetchRetry<T>(operation: () => Promise<T>, attempts = 3, delayMs = 250): Promise<T> {
  let lastError: unknown = null;

  for (let index = 0; index < attempts; index += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLastAttempt = index === attempts - 1;

      if (!isTransientFetchError(error) || isLastAttempt) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * (index + 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown fetch retry failure.");
}

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
    .select("id,amount,currency,payment_method,status,receipt_url,donated_at,campaigns(title)")
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
    rawStatus: donation.status,
    status: titleCase(donation.status),
    receiptUrl: donation.receipt_url || null,
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

export async function getRecentTenantDonations(limit = 10) {
  const supabase = await createClient();
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);

  const { data, error } = await supabase
    .from("donations")
    .select("id,amount,currency,payment_method,status,receipt_url,donated_at,donor_email,campaigns(title)")
    .eq("tenant_id", tenantId)
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
    rawStatus: donation.status,
    status: titleCase(donation.status),
    receiptUrl: donation.receipt_url || null,
    impact: "Impact verified",
    donorEmail: donation.donor_email || "anonymous",
  }));
}

async function getCampaignFundingSummaryForTenant(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaign_funding_summary")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map(mapCampaign);
}

export async function getAdminCampaigns() {
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);
  return getCampaignFundingSummaryForTenant(tenantId);
}

export async function getAdminDashboard() {
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);
  const [campaigns, donations, operations] = await Promise.all([
    getCampaignFundingSummaryForTenant(tenantId),
    getRecentTenantDonations(12),
    getOperationsForTenant(tenantId),
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
        user: donation.donorEmail,
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
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);
  return getOperationsForTenant(tenantId);
}

async function getOperationsForTenant(tenantId: string) {
  const supabase = await createClient();

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

function parseRangeStart(range: ReportRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  return new Date(Date.now() - (days - 1) * MS_IN_DAY);
}

function inDateRange(value: string | null, start: Date | null) {
  if (!value) return false;
  if (!start) return true;
  return new Date(value) >= start;
}

function toDayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildDayBuckets(
  points: { date: string; amount: number }[],
  fallbackDays: number,
) {
  if (points.length === 0) return [];

  const latest = new Date(points[0].date);
  const earliest = new Date(points[points.length - 1].date);
  const spanDays = Math.max(1, Math.ceil((latest.getTime() - earliest.getTime()) / MS_IN_DAY) + 1);
  const totalDays = Math.max(fallbackDays, Math.min(180, spanDays));
  const start = new Date(latest.getTime() - (totalDays - 1) * MS_IN_DAY);

  const sums = new Map<string, number>();
  for (const point of points) {
    const key = toDayKey(point.date);
    sums.set(key, (sums.get(key) || 0) + point.amount);
  }

  const buckets: { date: string; value: number }[] = [];
  for (let index = 0; index < totalDays; index += 1) {
    const current = new Date(start.getTime() + index * MS_IN_DAY);
    const key = current.toISOString().slice(0, 10);
    buckets.push({
      date: key,
      value: Number((sums.get(key) || 0).toFixed(2)),
    });
  }

  return buckets;
}

export async function getAdminDonors(limit = 100) {
  const supabase = await createClient();
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);

  const [donorsResponse, donationsResponse] = await Promise.all([
    supabase
      .from("donors")
      .select("id,full_name,email,phone,is_anonymous,communications_opt_in,created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("donations")
      .select("id,donor_id,donor_email,amount,currency,status,donated_at,campaigns(title)")
      .eq("tenant_id", tenantId)
      .order("donated_at", { ascending: false })
      .limit(500),
  ]);

  if (donorsResponse.error) throw new Error(donorsResponse.error.message);
  if (donationsResponse.error) throw new Error(donationsResponse.error.message);

  const donors = donorsResponse.data || [];
  const donations = donationsResponse.data || [];
  const succeededDonations = donations.filter((item: any) => item.status === "succeeded");

  const byDonorKey = new Map<string, any[]>();
  for (const donation of succeededDonations as any[]) {
    const key = donation.donor_id || donation.donor_email || "unknown";
    const entries = byDonorKey.get(key) || [];
    entries.push(donation);
    byDonorKey.set(key, entries);
  }

  const donorRows = donors.map((donor: any) => {
    const key = donor.id || donor.email;
    const rows = byDonorKey.get(key) || [];
    const totalAmount = rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const latestDonation = rows[0]?.donated_at || null;

    return {
      id: donor.id,
      name: donor.full_name || donor.email || "Anonymous",
      email: donor.email,
      phone: donor.phone || "—",
      donationCount: rows.length,
      totalDonated: formatCurrency(totalAmount),
      lastDonation: latestDonation ? formatShortDate(latestDonation) : "—",
      lifecycle: rows.length > 1 ? "Repeat" : rows.length === 1 ? "Active" : "New",
      communicationsOptIn: Boolean(donor.communications_opt_in),
      isAnonymous: Boolean(donor.is_anonymous),
    };
  });

  const totalDonatedValue = succeededDonations.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const repeatDonors = donorRows.filter((donor) => donor.donationCount > 1).length;
  const avgGiftValue = succeededDonations.length ? totalDonatedValue / succeededDonations.length : 0;

  return {
    kpis: {
      totalDonors: donorRows.length,
      activeDonors: donorRows.filter((donor) => donor.donationCount > 0).length,
      repeatDonors,
      averageGift: formatCurrency(avgGiftValue),
      totalDonated: formatCurrency(totalDonatedValue),
    },
    donors: donorRows,
    recentActivity: donations.slice(0, 12).map((donation: any) => ({
      id: donation.id,
      donorEmail: donation.donor_email || "anonymous",
      campaign: donation.campaigns?.title || "General Fund",
      amount: formatCurrency(donation.amount, donation.currency),
      status: titleCase(donation.status),
      date: formatShortDate(donation.donated_at),
    })),
  };
}

export async function getAdminReports(range: ReportRange = "30d") {
  const supabase = await createClient();
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);
  const rangeStart = parseRangeStart(range);

  const [donationsResponse, expensesResponse, campaignsResponse, auditsResponse] = await Promise.all([
    supabase
      .from("donations")
      .select("id,amount,currency,status,donated_at,campaign_id,campaigns(title)")
      .eq("tenant_id", tenantId)
      .order("donated_at", { ascending: false })
      .limit(1000),
    supabase
      .from("expenses")
      .select("id,amount,currency,status,expense_date,campaign_id,campaigns(title),category")
      .eq("tenant_id", tenantId)
      .order("expense_date", { ascending: false })
      .limit(1000),
    supabase
      .from("campaigns")
      .select("id,title,goal_amount,currency,status,created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    supabase
      .from("audit_logs")
      .select("id,action,target_type,actor_email,created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (donationsResponse.error) throw new Error(donationsResponse.error.message);
  if (expensesResponse.error) throw new Error(expensesResponse.error.message);
  if (campaignsResponse.error) throw new Error(campaignsResponse.error.message);
  if (auditsResponse.error) throw new Error(auditsResponse.error.message);

  const donations = (donationsResponse.data || []).filter((item: any) => inDateRange(item.donated_at, rangeStart));
  const expenses = (expensesResponse.data || []).filter((item: any) => inDateRange(item.expense_date, rangeStart));
  const campaigns = campaignsResponse.data || [];
  const audits = (auditsResponse.data || []).filter((item: any) => inDateRange(item.created_at, rangeStart));

  const donationTotal = donations.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const expenseTotal = expenses.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const successfulCount = donations.filter((item: any) => item.status === "succeeded").length;
  const successRate = donations.length ? (successfulCount / donations.length) * 100 : 0;

  const donationStatusMap = new Map<string, number>();
  for (const donation of donations as any[]) {
    const key = titleCase(donation.status || "unknown");
    donationStatusMap.set(key, (donationStatusMap.get(key) || 0) + 1);
  }

  const expenseStatusMap = new Map<string, number>();
  for (const expense of expenses as any[]) {
    const key = titleCase(expense.status || "unknown");
    expenseStatusMap.set(key, (expenseStatusMap.get(key) || 0) + 1);
  }

  const campaignMetrics = new Map<string, { title: string; goal: number; raised: number; spent: number; currency: string }>();
  for (const campaign of campaigns as any[]) {
    campaignMetrics.set(campaign.id, {
      title: campaign.title,
      goal: Number(campaign.goal_amount || 0),
      raised: 0,
      spent: 0,
      currency: campaign.currency || "INR",
    });
  }

  for (const donation of donations as any[]) {
    if (!donation.campaign_id) continue;
    const metric = campaignMetrics.get(donation.campaign_id);
    if (!metric) continue;
    metric.raised += Number(donation.amount || 0);
  }

  for (const expense of expenses as any[]) {
    if (!expense.campaign_id) continue;
    const metric = campaignMetrics.get(expense.campaign_id);
    if (!metric) continue;
    metric.spent += Number(expense.amount || 0);
  }

  return {
    range,
    summary: {
      donationsRaised: formatCurrency(donationTotal),
      donationCount: donations.length,
      expensesPosted: formatCurrency(expenseTotal),
      netFlow: formatCurrency(donationTotal - expenseTotal),
      donationSuccessRate: `${successRate.toFixed(1)}%`,
    },
    donationStatus: Array.from(donationStatusMap.entries()).map(([status, count]) => ({ status, count })),
    expenseStatus: Array.from(expenseStatusMap.entries()).map(([status, count]) => ({ status, count })),
    campaignFunding: Array.from(campaignMetrics.values())
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 8)
      .map((item) => ({
        name: item.title,
        goal: formatCurrency(item.goal, item.currency),
        raised: formatCurrency(item.raised, item.currency),
        spent: formatCurrency(item.spent, item.currency),
        progress: item.goal > 0 ? Math.min(100, Math.round((item.raised / item.goal) * 100)) : 0,
      })),
    recentAudit: audits.slice(0, 10).map((entry: any) => ({
      id: entry.id,
      actor: entry.actor_email || "system",
      action: entry.action,
      target: entry.target_type || "n/a",
      date: formatShortDate(entry.created_at),
    })),
  };
}

export async function getAdminAnalytics(range: ReportRange = "30d") {
  const supabase = await createClient();
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);
  const rangeStart = parseRangeStart(range);

  const [donationsResponse, expensesResponse, campaignsResponse] = await runWithFetchRetry(() =>
    Promise.all([
      supabase
        .from("donations")
        .select("id,amount,status,donated_at,campaign_id,campaigns(title)")
        .eq("tenant_id", tenantId)
        .order("donated_at", { ascending: false })
        .limit(1000),
      supabase
        .from("expenses")
        .select("id,amount,status,expense_date,campaign_id,campaigns(title)")
        .eq("tenant_id", tenantId)
        .order("expense_date", { ascending: false })
        .limit(1000),
      supabase
        .from("campaigns")
        .select("id,title,goal_amount,status")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false }),
    ]),
  );

  if (donationsResponse.error) throw new Error(donationsResponse.error.message);
  if (expensesResponse.error) throw new Error(expensesResponse.error.message);
  if (campaignsResponse.error) throw new Error(campaignsResponse.error.message);

  const donations = (donationsResponse.data || []).filter((item: any) => inDateRange(item.donated_at, rangeStart));
  const expenses = (expensesResponse.data || []).filter((item: any) => inDateRange(item.expense_date, rangeStart));
  const campaigns = campaignsResponse.data || [];

  const donationsTrend = buildDayBuckets(
    donations
      .filter((item: any) => item.donated_at)
      .map((item: any) => ({ date: item.donated_at, amount: Number(item.amount || 0) })),
    range === "7d" ? 7 : range === "90d" ? 90 : 30,
  );

  const expensesTrend = buildDayBuckets(
    expenses
      .filter((item: any) => item.expense_date)
      .map((item: any) => ({ date: item.expense_date, amount: Number(item.amount || 0) })),
    range === "7d" ? 7 : range === "90d" ? 90 : 30,
  );

  const campaignRollup = new Map<string, { title: string; goal: number; raised: number; spent: number }>();
  for (const campaign of campaigns as any[]) {
    campaignRollup.set(campaign.id, {
      title: campaign.title,
      goal: Number(campaign.goal_amount || 0),
      raised: 0,
      spent: 0,
    });
  }

  for (const donation of donations as any[]) {
    if (!donation.campaign_id) continue;
    const row = campaignRollup.get(donation.campaign_id);
    if (!row) continue;
    row.raised += Number(donation.amount || 0);
  }

  for (const expense of expenses as any[]) {
    if (!expense.campaign_id) continue;
    const row = campaignRollup.get(expense.campaign_id);
    if (!row) continue;
    row.spent += Number(expense.amount || 0);
  }

  const donationStatusMap = new Map<string, number>();
  for (const donation of donations as any[]) {
    const key = titleCase(donation.status || "unknown");
    donationStatusMap.set(key, (donationStatusMap.get(key) || 0) + 1);
  }

  const expenseStatusMap = new Map<string, number>();
  for (const expense of expenses as any[]) {
    const key = titleCase(expense.status || "unknown");
    expenseStatusMap.set(key, (expenseStatusMap.get(key) || 0) + 1);
  }

  const totalRaised = donations.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
  const totalSpent = expenses.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);

  return {
    range,
    kpis: {
      totalRaised: formatCurrency(totalRaised),
      totalSpent: formatCurrency(totalSpent),
      netFlow: formatCurrency(totalRaised - totalSpent),
      activeCampaigns: campaigns.filter((item: any) => item.status === "active" || item.status === "urgent").length,
    },
    trends: {
      donations: donationsTrend.map((point) => ({
        date: point.date,
        value: point.value,
        label: formatShortDate(point.date),
      })),
      expenses: expensesTrend.map((point) => ({
        date: point.date,
        value: point.value,
        label: formatShortDate(point.date),
      })),
    },
    campaignPerformance: Array.from(campaignRollup.values())
      .sort((a, b) => b.raised - a.raised)
      .slice(0, 10)
      .map((item) => ({
        campaign: item.title,
        raised: item.raised,
        spent: item.spent,
        efficiency: item.raised > 0 ? Number((((item.raised - item.spent) / item.raised) * 100).toFixed(1)) : 0,
      })),
    statusBreakdown: {
      donations: Array.from(donationStatusMap.entries()).map(([status, count]) => ({ status, count })),
      expenses: Array.from(expenseStatusMap.entries()).map(([status, count]) => ({ status, count })),
    },
  };
}

export async function getAdminSettings() {
  const supabase = await createClient();
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);

  const [tenantResponse, membershipsResponse] = await Promise.all([
    supabase
      .from("tenants")
      .select("id,slug,name,country_code,timezone,created_at,updated_at")
      .eq("id", tenantId)
      .single(),
    supabase
      .from("tenant_memberships")
      .select("role")
      .eq("tenant_id", tenantId),
  ]);

  if (tenantResponse.error) throw new Error(tenantResponse.error.message);
  if (membershipsResponse.error) throw new Error(membershipsResponse.error.message);

  const roleCounts = new Map<string, number>();
  for (const row of membershipsResponse.data || []) {
    roleCounts.set(row.role, (roleCounts.get(row.role) || 0) + 1);
  }

  return {
    organization: {
      name: tenantResponse.data.name,
      slug: tenantResponse.data.slug,
      countryCode: tenantResponse.data.country_code || "N/A",
      timezone: tenantResponse.data.timezone || "N/A",
      createdAt: formatShortDate(tenantResponse.data.created_at),
      updatedAt: formatShortDate(tenantResponse.data.updated_at),
    },
    members: {
      total: (membershipsResponse.data || []).length,
      byRole: Array.from(roleCounts.entries()).map(([role, count]) => ({
        role: titleCase(role.replaceAll("_", " ")),
        count,
      })),
    },
    integrations: {
      supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      defaultTenantSlug: DEFAULT_TENANT_SLUG,
    },
    security: {
      rbacEnabled: isRbacEnabled(),
      middlewareGuard: true,
      protectedPrefixes: ["/admin", "/api/admin"],
    },
  };
}

export async function getAdminSettingsOrganization() {
  const supabase = await createClient();
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);

  const { data, error } = await supabase
    .from("tenants")
    .select("name,slug,country_code,timezone,created_at,updated_at")
    .eq("id", tenantId)
    .single();

  if (error) throw new Error(error.message);

  return {
    name: data.name,
    slug: data.slug,
    countryCode: data.country_code || "N/A",
    timezone: data.timezone || "N/A",
    createdAt: formatShortDate(data.created_at),
    updatedAt: formatShortDate(data.updated_at),
  };
}

export async function getAdminSettingsMembership() {
  const supabase = await createClient();
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);

  const { data, error } = await supabase
    .from("tenant_memberships")
    .select("role")
    .eq("tenant_id", tenantId);

  if (error) throw new Error(error.message);

  const roleCounts = new Map<string, number>();
  for (const row of data || []) {
    roleCounts.set(row.role, (roleCounts.get(row.role) || 0) + 1);
  }

  return {
    total: (data || []).length,
    byRole: Array.from(roleCounts.entries()).map(([role, count]) => ({
      role: titleCase(role.replaceAll("_", " ")),
      count,
    })),
  };
}

export async function getAdminSettingsIntegrations() {
  await requireAuthContext(ADMIN_ALLOWED_ROLES);

  return {
    supabase: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
    defaultTenantSlug: DEFAULT_TENANT_SLUG,
  };
}

export async function getAdminSettingsSecurity() {
  await requireAuthContext(ADMIN_ALLOWED_ROLES);

  return {
    rbacEnabled: isRbacEnabled(),
    middlewareGuard: true,
    protectedPrefixes: ["/admin", "/api/admin"],
  };
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

async function getVolunteerIdentityForCurrentUser() {
  if (!isRbacEnabled()) {
    const supabase = await createClient();
    const tenantId = await getTenantId();

    const { data: volunteer, error: volunteerError } = await supabase
      .from("volunteer_profiles")
      .select("id,full_name,email,skills,hours_logged,impact_score,certifications_count")
      .eq("tenant_id", tenantId)
      .eq("email", DEFAULT_VOLUNTEER_EMAIL)
      .single();

    if (volunteerError) throw new Error(volunteerError.message);

    return {
      tenantId,
      role: "volunteer",
      userId: "dev-rbac-bypass-user",
      userEmail: DEFAULT_VOLUNTEER_EMAIL,
      volunteer,
    };
  }

  const supabase = await createClient();
  const { tenantId, user, role } = await requireAuthContext(["volunteer", "org_admin"]);

  const { data: volunteer, error: volunteerError } = await supabase
    .from("volunteer_profiles")
    .select("id,full_name,email,skills,hours_logged,impact_score,certifications_count")
    .eq("tenant_id", tenantId)
    .eq("auth_user_id", user.id)
    .single();

  if (volunteerError) throw new Error(volunteerError.message);

  return {
    tenantId,
    role: role || "volunteer",
    userId: user.id,
    userEmail: user.email || volunteer.email,
    volunteer,
  };
}

export async function getVolunteerDashboardForCurrentUser() {
  const supabase = await createClient();
  const identity = await getVolunteerIdentityForCurrentUser();
  const { tenantId, volunteer } = identity;

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

export async function getVolunteerResourcesForCurrentUser() {
  const supabase = await createClient();
  const identity = await getVolunteerIdentityForCurrentUser();
  const { tenantId, volunteer } = identity;

  const { data: assignments, error: assignmentError } = await supabase
    .from("volunteer_assignments")
    .select("id,title,location,status,assignment_type,due_at")
    .eq("tenant_id", tenantId)
    .eq("volunteer_id", volunteer.id)
    .order("due_at", { ascending: true })
    .limit(10);

  if (assignmentError) throw new Error(assignmentError.message);

  const assignmentTypes = Array.from(
    new Set((assignments || []).map((row) => row.assignment_type).filter(Boolean)),
  );

  const generatedResources = assignmentTypes.map((type, index) => ({
    id: `type-${index + 1}`,
    title: `${type} Field Playbook`,
    kind: "Playbook",
    audience: "Assignment",
    description: `Checklist and SOP template for ${type.toLowerCase()} assignments.`,
    ctaLabel: "Open Guide",
    href: "/volunteer/assignments",
  }));

  const skillResources = (volunteer.skills || []).slice(0, 5).map((skill: string, index: number) => ({
    id: `skill-${index + 1}`,
    title: `${titleCase(skill.replaceAll("-", " "))} Reference`,
    kind: "Reference",
    audience: "Skill",
    description: "Best-practice notes and quality checks mapped to your profile skills.",
    ctaLabel: "View Notes",
    href: "/volunteer/logs",
  }));

  return {
    volunteerName: volunteer.full_name,
    skills: volunteer.skills || [],
    assignments: (assignments || []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      location: assignment.location,
      status: titleCase(assignment.status),
      type: assignment.assignment_type,
      deadline: assignment.due_at ? formatShortDate(assignment.due_at) : "TBD",
    })),
    resources: [
      ...generatedResources,
      ...skillResources,
      {
        id: "offline-pack",
        title: "Offline Capture SOP",
        kind: "Policy",
        audience: "All Volunteers",
        description: "Fallback workflow for low-connectivity field updates and delayed sync.",
        ctaLabel: "Review SOP",
        href: "/volunteer",
      },
    ],
  };
}

export async function getVolunteerImpactLogsForCurrentUser() {
  const supabase = await createClient();
  const identity = await getVolunteerIdentityForCurrentUser();
  const { tenantId, volunteer } = identity;

  const { data: reports, error: reportsError } = await supabase
    .from("field_reports")
    .select(`
      id,
      impact_metric,
      notes,
      status,
      submitted_at,
      volunteer_assignments (
        title,
        location,
        assignment_type
      )
    `)
    .eq("tenant_id", tenantId)
    .eq("volunteer_id", volunteer.id)
    .order("submitted_at", { ascending: false })
    .limit(30);

  if (reportsError) throw new Error(reportsError.message);

  const totalImpact = (reports || []).reduce((sum, report: any) => sum + Number(report.impact_metric || 0), 0);
  const reviewedCount = (reports || []).filter((report) => report.status === "reviewed").length;
  const submittedCount = (reports || []).filter((report) => report.status === "submitted").length;
  const returnedCount = (reports || []).filter((report) => report.status === "returned").length;

  return {
    volunteerName: volunteer.full_name,
    summary: {
      totalReports: (reports || []).length,
      reviewed: reviewedCount,
      pendingReview: submittedCount,
      needsCorrection: returnedCount,
      totalImpact,
    },
    logs: (reports || []).map((report: any) => ({
      id: report.id,
      assignment: report.volunteer_assignments?.title || "General field report",
      location: report.volunteer_assignments?.location || "Global",
      type: report.volunteer_assignments?.assignment_type || "General",
      submittedAt: formatShortDate(report.submitted_at),
      impactMetric: Number(report.impact_metric || 0),
      status: titleCase(report.status),
      notes: report.notes || "—",
    })),
  };
}

export async function getVolunteerVerificationForCurrentUser() {
  const supabase = await createClient();
  const identity = await getVolunteerIdentityForCurrentUser();
  const { tenantId, volunteer } = identity;

  const [assignmentsResponse, reportsResponse] = await Promise.all([
    supabase
      .from("volunteer_assignments")
      .select("id,title,status,due_at")
      .eq("tenant_id", tenantId)
      .eq("volunteer_id", volunteer.id)
      .order("due_at", { ascending: true }),
    supabase
      .from("field_reports")
      .select("id,assignment_id,status,submitted_at,impact_metric")
      .eq("tenant_id", tenantId)
      .eq("volunteer_id", volunteer.id)
      .order("submitted_at", { ascending: false })
      .limit(50),
  ]);

  if (assignmentsResponse.error) throw new Error(assignmentsResponse.error.message);
  if (reportsResponse.error) throw new Error(reportsResponse.error.message);

  const assignments = assignmentsResponse.data || [];
  const reports = reportsResponse.data || [];

  const reportedAssignmentIds = new Set(reports.map((row) => row.assignment_id).filter(Boolean));
  const submitted = reports.filter((row) => row.status === "submitted").length;
  const reviewed = reports.filter((row) => row.status === "reviewed").length;
  const returned = reports.filter((row) => row.status === "returned").length;
  const coverage = assignments.length ? Math.round((reportedAssignmentIds.size / assignments.length) * 100) : 0;

  return {
    volunteerName: volunteer.full_name,
    assignmentCoverage: {
      totalAssignments: assignments.length,
      reportedAssignments: reportedAssignmentIds.size,
      completionRate: coverage,
    },
    reportStatus: {
      submitted,
      reviewed,
      returned,
    },
    verificationQueue: reports
      .filter((row) => row.status === "submitted" || row.status === "returned")
      .slice(0, 10)
      .map((row) => ({
        id: row.id,
        assignmentId: row.assignment_id,
        status: titleCase(row.status),
        submittedAt: formatShortDate(row.submitted_at),
        impactMetric: Number(row.impact_metric || 0),
      })),
  };
}

export async function getVolunteerSettingsForCurrentUser() {
  const identity = await getVolunteerIdentityForCurrentUser();
  const { role, userId, userEmail, volunteer } = identity;

  return {
    profile: {
      fullName: volunteer.full_name,
      email: volunteer.email,
      hoursLogged: Number(volunteer.hours_logged || 0),
      impactScore: Number(volunteer.impact_score || 0),
      certifications: Number(volunteer.certifications_count || 0),
    },
    skills: volunteer.skills || [],
    account: {
      role: titleCase(role.replaceAll("_", " ")),
      userId,
      userEmail: userEmail || volunteer.email,
    },
  };
}

export async function getRecentDonationsForCurrentUser(limit = 10) {
  if (!isRbacEnabled()) {
    return getRecentDonations(DEFAULT_DONOR_EMAIL, limit);
  }

  const supabase = await createClient();
  const { tenantId, user, email } = await requireAuthContext(["donor", "org_admin"]);

  const { data: donorRow } = await supabase
    .from("donors")
    .select("id,full_name,email")
    .eq("tenant_id", tenantId)
    .eq("auth_user_id", user.id)
    .maybeSingle();

  let query = supabase
    .from("donations")
    .select("id,amount,currency,payment_method,status,receipt_url,donated_at,campaigns(title)")
    .eq("tenant_id", tenantId)
    .order("donated_at", { ascending: false })
    .limit(limit);

  if (donorRow?.id) {
    query = query.eq("donor_id", donorRow.id);
  } else if (email) {
    query = query.eq("donor_email", email);
  } else {
    return [];
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((donation: any) => ({
    id: `DON-${String(donation.id).slice(0, 6).toUpperCase()}`,
    rawId: donation.id,
    date: formatShortDate(donation.donated_at),
    campaign: donation.campaigns?.title || "General Fund",
    amount: formatCurrency(donation.amount, donation.currency),
    amountValue: Number(donation.amount || 0),
    method: donation.payment_method || "Card",
    rawStatus: donation.status,
    status: titleCase(donation.status),
    receiptUrl: donation.receipt_url || null,
    impact: "Impact verified",
  }));
}

export async function getDonorDashboardForCurrentUser() {
  if (!isRbacEnabled()) {
    return getDonorDashboard(DEFAULT_DONOR_EMAIL);
  }

  const supabase = await createClient();
  const { tenantId, user, email } = await requireAuthContext(["donor", "org_admin"]);

  const [donations, ledger, donorResult] = await Promise.all([
    getRecentDonationsForCurrentUser(20),
    getTransparencyLedger(10),
    supabase
      .from("donors")
      .select("full_name")
      .eq("tenant_id", tenantId)
      .eq("auth_user_id", user.id)
      .maybeSingle(),
  ]);

  const total = donations.reduce((sum, d) => sum + d.amountValue, 0);
  const donorName =
    donorResult.data?.full_name ||
    (email ? email.split("@")[0] : "Donor");

  return {
    donorName,
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
  const { tenantId } = await requireAuthContext(ADMIN_ALLOWED_ROLES);

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

export async function createFieldReportForCurrentUser(input: {
  assignmentId?: string | null;
  impactMetric?: number;
  notes?: string;
}) {
  if (!isRbacEnabled()) {
    return createFieldReport({
      assignmentId: input.assignmentId,
      impactMetric: input.impactMetric,
      notes: input.notes,
      volunteerEmail: DEFAULT_VOLUNTEER_EMAIL,
    });
  }

  const supabase = await createClient();
  const { tenantId, user } = await requireAuthContext(["volunteer", "org_admin"]);

  const { data: volunteer, error: volunteerError } = await supabase
    .from("volunteer_profiles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("auth_user_id", user.id)
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
