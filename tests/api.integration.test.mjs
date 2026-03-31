import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

process.env.ENABLE_RBAC = "false";
process.env.NEXT_PUBLIC_ENABLE_RBAC = "false";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabase,
}));

const campaignsRoute = await import("@/app/api/campaigns/route");
const campaignByIdRoute = await import("@/app/api/campaigns/[id]/route");
const publicOverviewRoute = await import("@/app/api/public/overview/route");
const transparencyRoute = await import("@/app/api/transparency/route");
const donationsRoute = await import("@/app/api/donations/route");
const donationStatusRoute = await import("@/app/api/donations/[id]/status/route");

const donorDashboardRoute = await import("@/app/api/donor/dashboard/route");
const donorDonationsRoute = await import("@/app/api/donor/donations/route");
const volunteerDashboardRoute = await import("@/app/api/volunteer/dashboard/route");
const volunteerAssignmentsRoute = await import("@/app/api/volunteer/assignments/route");

const adminDashboardRoute = await import("@/app/api/admin/dashboard/route");
const adminCampaignsRoute = await import("@/app/api/admin/campaigns/route");
const adminOperationsRoute = await import("@/app/api/admin/operations/route");
const adminDonorsRoute = await import("@/app/api/admin/donors/route");
const adminReportsRoute = await import("@/app/api/admin/reports/route");
const adminAnalyticsRoute = await import("@/app/api/admin/analytics/route");
const adminSettingsOrganizationRoute = await import("@/app/api/admin/settings/organization/route");
const adminSettingsMembershipRoute = await import("@/app/api/admin/settings/membership/route");
const adminSettingsIntegrationsRoute = await import("@/app/api/admin/settings/integrations/route");
const adminSettingsSecurityRoute = await import("@/app/api/admin/settings/security/route");

let campaignId;
let donationId;

async function parseJson(response) {
  return response.json();
}

async function ensureBaselineData() {
  const tenantSlug = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "lions-global";
  const donorEmail = process.env.SEED_DONOR_EMAIL || "john@example.com";
  const volunteerEmail = process.env.SEED_VOLUNTEER_EMAIL || "sarah@example.com";

  const { data: tenant, error: tenantError } = await supabase
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

  if (tenantError) throw tenantError;

  const tenantId = tenant.id;

  const { data: donor, error: donorError } = await supabase
    .from("donors")
    .upsert(
      {
        tenant_id: tenantId,
        full_name: "Seed Donor",
        email: donorEmail,
      },
      { onConflict: "tenant_id,email" },
    )
    .select("id")
    .single();
  if (donorError) throw donorError;

  const { data: existingVolunteer, error: existingVolunteerError } = await supabase
    .from("volunteer_profiles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", volunteerEmail)
    .maybeSingle();
  if (existingVolunteerError) throw existingVolunteerError;

  let volunteerId = existingVolunteer?.id;
  if (!volunteerId) {
    const { data: insertedVolunteer, error: insertVolunteerError } = await supabase
      .from("volunteer_profiles")
      .insert({
        tenant_id: tenantId,
        full_name: "Seed Volunteer",
        email: volunteerEmail,
        skills: ["field-support"],
      })
      .select("id")
      .single();

    if (insertVolunteerError) throw insertVolunteerError;
    volunteerId = insertedVolunteer.id;
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      tenant_id: tenantId,
      title: `API Seed Campaign ${Date.now()}`,
      description: "Campaign for API integration tests",
      category: "Relief",
      location: "Test Hub",
      goal_amount: 10000,
      currency: "USD",
      status: "active",
      urgency: "medium",
    })
    .select("id")
    .single();
  if (campaignError) throw campaignError;
  campaignId = campaign.id;

  const { error: assignmentError } = await supabase.from("volunteer_assignments").insert({
    tenant_id: tenantId,
    campaign_id: campaignId,
    volunteer_id: volunteerId,
    title: "Test Assignment",
    location: "Test Zone",
    assignment_type: "field",
  });
  if (assignmentError) throw assignmentError;

  const { error: donationError } = await supabase.from("donations").insert({
    tenant_id: tenantId,
    donor_id: donor.id,
    donor_name: "Seed Donor",
    donor_email: donorEmail,
    campaign_id: campaignId,
    amount: 500,
    currency: "USD",
    status: "succeeded",
    payment_method: "Card",
    source: "seed",
  });
  if (donationError) throw donationError;
}

beforeAll(async () => {
  await ensureBaselineData();
});

describe("DB-backed API routes", () => {
  it("GET /api/campaigns", async () => {
    const response = await campaignsRoute.GET();
    const payload = await parseJson(response);

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.campaigns)).toBe(true);
    expect(payload.campaigns.length).toBeGreaterThan(0);
  });

  it("GET /api/campaigns/[id]", async () => {
    const response = await campaignByIdRoute.GET(new Request("http://localhost/api/campaigns/id"), {
      params: Promise.resolve({ id: campaignId }),
    });
    const payload = await parseJson(response);

    expect(response.status).toBe(200);
    expect(payload.id).toBe(campaignId);
    expect(Array.isArray(payload.updates)).toBe(true);
  });

  it("GET /api/public/overview", async () => {
    const response = await publicOverviewRoute.GET();
    const payload = await parseJson(response);

    expect(response.status, payload?.error || "public overview error").toBe(200);
    expect(Array.isArray(payload.stats)).toBe(true);
    expect(Array.isArray(payload.campaigns)).toBe(true);
  });

  it("GET /api/transparency", async () => {
    const request = new NextRequest("http://localhost/api/transparency?limit=5");
    const response = await transparencyRoute.GET(request);
    const payload = await parseJson(response);

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.ledger)).toBe(true);
  });

  it("GET and POST /api/donations", async () => {
    const listRequest = new NextRequest("http://localhost/api/donations?limit=5");
    const listResponse = await donationsRoute.GET(listRequest);
    const listPayload = await parseJson(listResponse);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listPayload.donations)).toBe(true);

    const createResponse = await donationsRoute.POST(
      new NextRequest("http://localhost/api/donations", {
        method: "POST",
        body: JSON.stringify({
          fullName: "API Test Donor",
          email: `api-test-${Date.now()}@example.com`,
          amount: 501,
          campaignId,
          paymentMethod: "UPI",
        }),
      }),
    );
    const createPayload = await parseJson(createResponse);

    expect(createResponse.status).toBe(201);
    expect(typeof createPayload?.donation?.id).toBe("string");

    donationId = createPayload.donation.id;
  });

  it("GET /api/donations/[id]/status", async () => {
    expect(donationId).toBeTruthy();

    const response = await donationStatusRoute.GET(new NextRequest(`http://localhost/api/donations/${donationId}/status`), {
      params: Promise.resolve({ id: donationId }),
    });
    const payload = await parseJson(response);

    expect(response.status).toBe(200);
    expect(payload.donation.id).toBe(donationId);
  });

  it("GET /api/donor/dashboard and /api/donor/donations", async () => {
    const dashboardResponse = await donorDashboardRoute.GET();
    const dashboardPayload = await parseJson(dashboardResponse);

    expect(dashboardResponse.status).toBe(200);
    expect(typeof dashboardPayload.donorName).toBe("string");

    const donationsResponse = await donorDonationsRoute.GET(new NextRequest("http://localhost/api/donor/donations?limit=10"));
    const donationsPayload = await parseJson(donationsResponse);

    expect(donationsResponse.status).toBe(200);
    expect(Array.isArray(donationsPayload.donations)).toBe(true);
  });

  it("GET /api/volunteer/dashboard and /api/volunteer/assignments", async () => {
    const dashboardResponse = await volunteerDashboardRoute.GET();
    const dashboardPayload = await parseJson(dashboardResponse);

    expect(dashboardResponse.status).toBe(200);
    expect(typeof dashboardPayload.volunteerName).toBe("string");

    const assignmentsResponse = await volunteerAssignmentsRoute.GET();
    const assignmentsPayload = await parseJson(assignmentsResponse);

    expect(assignmentsResponse.status).toBe(200);
    expect(Array.isArray(assignmentsPayload.assignments)).toBe(true);
  });

  it("POST /api/volunteer/assignments", async () => {
    const response = await volunteerAssignmentsRoute.POST(
      new NextRequest("http://localhost/api/volunteer/assignments", {
        method: "POST",
        body: JSON.stringify({
          impactMetric: 12,
          notes: "API integration test report",
        }),
      }),
    );
    const payload = await parseJson(response);

    expect(response.status).toBe(201);
    expect(typeof payload?.report?.id).toBe("string");
  });

  it("GET admin endpoints", async () => {
    const endpoints = [
      { name: "dashboard", response: await adminDashboardRoute.GET() },
      { name: "campaigns", response: await adminCampaignsRoute.GET() },
      { name: "operations", response: await adminOperationsRoute.GET() },
      { name: "donors", response: await adminDonorsRoute.GET() },
      { name: "reports", response: await adminReportsRoute.GET(new NextRequest("http://localhost/api/admin/reports?range=30d")) },
      { name: "analytics", response: await adminAnalyticsRoute.GET(new NextRequest("http://localhost/api/admin/analytics?range=30d")) },
      { name: "settings-organization", response: await adminSettingsOrganizationRoute.GET() },
      { name: "settings-membership", response: await adminSettingsMembershipRoute.GET() },
      { name: "settings-integrations", response: await adminSettingsIntegrationsRoute.GET() },
      { name: "settings-security", response: await adminSettingsSecurityRoute.GET() },
    ];

    for (const endpoint of endpoints) {
      const payload = await parseJson(endpoint.response);
      expect(endpoint.response.status, `${endpoint.name}: ${payload?.error || "unknown error"}`).toBe(200);
      expect(payload.error, endpoint.name).toBeUndefined();
    }
  });

  it("POST /api/admin/operations", async () => {
    const response = await adminOperationsRoute.POST(
      new NextRequest("http://localhost/api/admin/operations", {
        method: "POST",
        body: JSON.stringify({
          category: "API Test Expense",
          amount: 333,
          vendor: "Test Vendor",
          notes: "Created by integration test",
        }),
      }),
    );
    const payload = await parseJson(response);

    expect(response.status).toBe(201);
    expect(typeof payload?.expense?.id).toBe("string");
  });
});
