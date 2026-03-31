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

const mockUsers = [
  {
    role: "org_admin",
    email: process.env.SEED_ADMIN_EMAIL || "org-admin@lions.org",
    password: process.env.SEED_ADMIN_PASSWORD || "ImpactLedgerAdmin#2026",
    fullName: "Org Admin",
  },
  {
    role: "volunteer",
    email: process.env.SEED_VOLUNTEER_EMAIL || "sarah@example.com",
    password: process.env.SEED_VOLUNTEER_PASSWORD || "ImpactLedgerVolunteer#2026",
    fullName: "Sarah Smith",
  },
  {
    role: "donor",
    email: process.env.SEED_DONOR_EMAIL || "john@example.com",
    password: process.env.SEED_DONOR_PASSWORD || "ImpactLedgerDonor#2026",
    fullName: "John Doe",
  },
];

async function getTenantId() {
  const { data, error } = await supabase
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

  if (error) throw error;
  return data.id;
}

async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase()) || null;
}

async function upsertMembership(tenantId, userId, role) {
  const { data: existing, error: findError } = await supabase
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (findError) throw findError;

  if (!existing) {
    const { error: insertError } = await supabase.from("tenant_memberships").insert({
      tenant_id: tenantId,
      user_id: userId,
      role,
    });
    if (insertError) throw insertError;
    return;
  }

  const { error: updateError } = await supabase
    .from("tenant_memberships")
    .update({ role })
    .eq("id", existing.id);

  if (updateError) throw updateError;
}

async function upsertVolunteerProfile(tenantId, userId, email, fullName) {
  const { data: existing, error: findError } = await supabase
    .from("volunteer_profiles")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle();

  if (findError) throw findError;

  if (!existing) {
    const { error: insertError } = await supabase.from("volunteer_profiles").insert({
      tenant_id: tenantId,
      auth_user_id: userId,
      full_name: fullName,
      email,
      skills: ["first-aid", "field-reporting"],
      certifications_count: 2,
      hours_logged: 42,
      impact_score: 87,
    });
    if (insertError) throw insertError;
    return;
  }

  const { error: updateError } = await supabase
    .from("volunteer_profiles")
    .update({ auth_user_id: userId, full_name: fullName })
    .eq("id", existing.id);

  if (updateError) throw updateError;
}

async function upsertDonorProfile(tenantId, userId, email, fullName) {
  const { error } = await supabase.from("donors").upsert(
    {
      tenant_id: tenantId,
      auth_user_id: userId,
      full_name: fullName,
      email,
      communications_opt_in: true,
    },
    { onConflict: "tenant_id,email" },
  );

  if (error) throw error;
}

async function run() {
  const tenantId = await getTenantId();

  for (const mockUser of mockUsers) {
    let authUser = await findUserByEmail(mockUser.email);

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: mockUser.email,
        password: mockUser.password,
        email_confirm: true,
        user_metadata: { full_name: mockUser.fullName },
        app_metadata: {
          app_role: mockUser.role,
          default_tenant_slug: tenantSlug,
        },
      });

      if (error) throw error;
      authUser = data.user;
    } else {
      const { error } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: mockUser.password,
        email_confirm: true,
        user_metadata: {
          ...(authUser.user_metadata || {}),
          full_name: mockUser.fullName,
        },
        app_metadata: {
          ...(authUser.app_metadata || {}),
          app_role: mockUser.role,
          default_tenant_slug: tenantSlug,
        },
      });

      if (error) throw error;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: authUser.id,
        full_name: mockUser.fullName,
        email: mockUser.email,
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    await upsertMembership(tenantId, authUser.id, mockUser.role);
    await upsertDonorProfile(tenantId, authUser.id, mockUser.email, mockUser.fullName);

    if (mockUser.role === "volunteer") {
      await upsertVolunteerProfile(tenantId, authUser.id, mockUser.email, mockUser.fullName);
    }

    console.log(`Seeded ${mockUser.role}: ${mockUser.email}`);
  }

  console.log(`Auth seed complete for tenant ${tenantSlug} (${tenantId})`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
