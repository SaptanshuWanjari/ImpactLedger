import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRbacEnabled } from "@/lib/config/rbac";

export type AppRole =
  | "donor"
  | "volunteer"
  | "org_admin";

export const ADMIN_ALLOWED_ROLES: AppRole[] = [
  "org_admin",
];

export type AuthContext = {
  user: User;
  tenantId: string;
  tenantSlug: string;
  role: AppRole | null;
  email: string | null;
};

export class AuthHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_TENANT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG || "lions-global";

let cachedTenantId: string | null = null;

function displayNameFromUser(user: User) {
  const fromMetadata =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    "";

  if (fromMetadata.trim()) {
    return fromMetadata.trim();
  }

  if (user.email) {
    return user.email.split("@")[0] || "Supporter";
  }

  return "Supporter";
}

async function getDefaultTenantId() {
  if (cachedTenantId) {
    return cachedTenantId;
  }
  let adminErrorMessage = "";
  try {
    const supabaseAdmin = createAdminClient() as any;
    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .single();

    if (!error && data?.id) {
      cachedTenantId = data.id as string;
      return cachedTenantId;
    }

    adminErrorMessage = error?.message || "unknown admin query error";
  } catch (error) {
    adminErrorMessage = error instanceof Error ? error.message : String(error);
  }

  let sessionErrorMessage = "";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", DEFAULT_TENANT_SLUG)
      .single();

    if (!error && data?.id) {
      cachedTenantId = data.id as string;
      return cachedTenantId;
    }

    sessionErrorMessage = error?.message || "unknown session query error";
  } catch (error) {
    sessionErrorMessage = error instanceof Error ? error.message : String(error);
  }

  throw new Error(
    `Unable to resolve tenant '${DEFAULT_TENANT_SLUG}'. Admin query: ${adminErrorMessage}. Session query: ${sessionErrorMessage}`,
  );
}

function isRoleAllowed(role: AppRole, allowedRoles: AppRole[]) {
  return allowedRoles.includes(role);
}

function isMissingOrStaleSessionError(error: unknown) {
  const code = typeof error === "object" && error !== null ? String((error as { code?: string }).code || "") : "";
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();

  return (
    code === "refresh_token_not_found" ||
    message.includes("auth session missing") ||
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
}

function isSupabaseTimeoutError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
  const causeCode =
    typeof error === "object" && error !== null
      ? String(((error as { cause?: { code?: string } }).cause?.code as string) || "")
      : "";

  return message.includes("fetch failed") || message.includes("connect timeout") || causeCode === "UND_ERR_CONNECT_TIMEOUT";
}

function isTenantPermissionError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || "").toLowerCase();
  return message.includes("permission denied for schema public") || message.includes("permission denied");
}

export function hasAllowedRole(role: AppRole | null, allowedRoles: AppRole[]) {
  if (!role) {
    return false;
  }

  return isRoleAllowed(role, allowedRoles);
}

export function getHomePathForRole(role: AppRole | null) {
  if (role === "org_admin") {
    return "/admin";
  }

  if (role === "volunteer") {
    return "/volunteer";
  }

  return "/donor";
}

export async function getAuthContext(): Promise<AuthContext | null> {
  if (!isRbacEnabled()) {
    const tenantId = await getDefaultTenantId();
    return {
      user: {
        id: "dev-rbac-bypass-user",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User,
      tenantId,
      tenantSlug: DEFAULT_TENANT_SLUG,
      role: "org_admin",
      email: process.env.NEXT_PUBLIC_DEMO_DONOR_EMAIL || "john@example.com",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isMissingOrStaleSessionError(error)) {
      return null;
    }
    if (isSupabaseTimeoutError(error)) {
      throw new AuthHttpError(503, "Authentication service unavailable.");
    }
    throw new AuthHttpError(401, error.message);
  }

  if (!user) {
    return null;
  }

  let tenantId: string;
  try {
    tenantId = await getDefaultTenantId();
  } catch (error) {
    if (isTenantPermissionError(error)) {
      return null;
    }
    throw error;
  }
  const supabaseAdmin = createAdminClient() as any;

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("tenant_memberships")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Unable to resolve membership: ${membershipError.message}`);
  }

  const role = (membership?.role || null) as AppRole | null;

  return {
    user,
    tenantId,
    tenantSlug: DEFAULT_TENANT_SLUG,
    role,
    email: user.email || null,
  };
}

export async function requireAuthContext(allowedRoles?: AppRole[]) {
  if (!isRbacEnabled()) {
    const context = await getAuthContext();
    if (!context) {
      throw new AuthHttpError(500, "Unable to create development auth context.");
    }
    return context;
  }

  const context = await getAuthContext();

  if (!context) {
    throw new AuthHttpError(401, "Authentication required.");
  }

  if (!context.role) {
    throw new AuthHttpError(403, "No tenant role assigned for this account.");
  }

  if (allowedRoles && !isRoleAllowed(context.role, allowedRoles)) {
    throw new AuthHttpError(403, "You do not have access to this resource.");
  }

  return context;
}

export async function ensureUserProvisioned(user: User) {
  const supabaseAdmin = createAdminClient() as any;
  const tenantId = await getDefaultTenantId();
  const fullName = displayNameFromUser(user);

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        email: user.email || null,
      },
      { onConflict: "id" },
    );

  if (profileError) {
    throw new Error(`Unable to create profile: ${profileError.message}`);
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("tenant_memberships")
    .select("id,role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(`Unable to resolve membership: ${membershipError.message}`);
  }

  const membershipRole = membership?.role;
  const role: AppRole =
    membershipRole === "org_admin" || membershipRole === "volunteer" || membershipRole === "donor"
      ? membershipRole
      : "donor";

  if (!membership) {
    const { error: insertMembershipError } = await supabaseAdmin.from("tenant_memberships").insert({
      tenant_id: tenantId,
      user_id: user.id,
      role,
    });

    if (insertMembershipError) {
      throw new Error(`Unable to create tenant membership: ${insertMembershipError.message}`);
    }
  }

  if (user.email) {
    const { error: donorError } = await supabaseAdmin.from("donors").upsert(
      {
        tenant_id: tenantId,
        auth_user_id: user.id,
        full_name: fullName,
        email: user.email,
        communications_opt_in: true,
      },
      { onConflict: "tenant_id,email" },
    );

    if (donorError) {
      throw new Error(`Unable to create donor profile: ${donorError.message}`);
    }
  }

  const existingMetadata = (user.app_metadata || {}) as Record<string, unknown>;
  const appRole = role;

  if (existingMetadata.app_role !== appRole || existingMetadata.default_tenant_slug !== DEFAULT_TENANT_SLUG) {
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...existingMetadata,
        app_role: appRole,
        default_tenant_slug: DEFAULT_TENANT_SLUG,
      },
    });

    if (updateUserError) {
      throw new Error(`Unable to update user metadata: ${updateUserError.message}`);
    }
  }

  return {
    tenantId,
    role,
    homePath: getHomePathForRole(role),
  };
}

export function sanitizeNextPath(nextPath: string | null, fallbackPath: string) {
  if (!nextPath) {
    return fallbackPath;
  }

  if (!nextPath.startsWith("/")) {
    return fallbackPath;
  }

  if (nextPath.startsWith("/auth")) {
    return fallbackPath;
  }

  return nextPath;
}
