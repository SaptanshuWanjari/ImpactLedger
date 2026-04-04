"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useApiData } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type OrganizationSettings = {
  name: string;
  slug: string;
  countryCode: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

type MembershipSettings = {
  total: number;
  byRole: { role: string; count: number }[];
};

type IntegrationsSettings = {
  supabase: boolean;
  razorpay: boolean;
  defaultTenantSlug: string;
};

type SecuritySettings = {
  rbacEnabled: boolean;
  middlewareGuard: boolean;
  protectedPrefixes: string[];
};

const SETTINGS_COLORS = ["#00338D", "#E63946", "#141414", "#737373", "#9CA3AF"];

export default function AdminSettingsPage() {
  const organization = useApiData<OrganizationSettings>("/api/admin/settings/organization");
  const membership = useApiData<MembershipSettings>("/api/admin/settings/membership");
  const integrations = useApiData<IntegrationsSettings>("/api/admin/settings/integrations");
  const security = useApiData<SecuritySettings>("/api/admin/settings/security");

  const rolePieData = membership.data?.byRole || [];

  const errors = [organization.error, membership.error, integrations.error, security.error].filter(Boolean);
  const isLoadingAny = organization.isLoading || membership.isLoading || integrations.isLoading || security.isLoading;

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-grow p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Read-only organization and system configuration for this tenant.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="no-line-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Organization</h2>
            <SettingRow label="Name" value={organization.data?.name || "—"} />
            <SettingRow label="Slug" value={organization.data?.slug || "—"} mono />
            <SettingRow label="Country" value={organization.data?.countryCode || "—"} />
            <SettingRow label="Timezone" value={organization.data?.timezone || "—"} />
            <SettingRow label="Created" value={organization.data?.createdAt || "—"} />
            <SettingRow label="Updated" value={organization.data?.updatedAt || "—"} />
          </section>

          <section className="no-line-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Membership</h2>
            <SettingRow label="Total Members" value={String(membership.data?.total || 0)} />
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rolePieData} dataKey="count" nameKey="role" innerRadius={45} outerRadius={78} paddingAngle={2}>
                    {rolePieData.map((row, index) => (
                      <Cell key={row.role} fill={SETTINGS_COLORS[index % SETTINGS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {(membership.data?.byRole || []).map((row) => (
                <div key={row.role} className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
                  <p className="text-sm font-medium">{row.role}</p>
                  <p className="font-display font-extrabold">{row.count}</p>
                </div>
              ))}
              {!membership.isLoading && (membership.data?.byRole || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No memberships found.</p>
              )}
            </div>
          </section>

          <section className="no-line-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Integrations</h2>
            <IntegrationRow label="Supabase" enabled={Boolean(integrations.data?.supabase)} />
            <IntegrationRow label="Razorpay" enabled={Boolean(integrations.data?.razorpay)} />
            <SettingRow label="Default Tenant Slug" value={integrations.data?.defaultTenantSlug || "—"} mono />
          </section>

          <section className="no-line-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Security Controls</h2>
            <IntegrationRow label="RBAC Checks" enabled={Boolean(security.data?.rbacEnabled)} />
            <IntegrationRow label="Middleware Guard" enabled={Boolean(security.data?.middlewareGuard)} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Protected Prefixes</p>
              <div className="flex items-center gap-2 flex-wrap">
                {(security.data?.protectedPrefixes || []).map((prefix) => (
                  <span key={prefix} className="rounded-full bg-muted px-3 py-1 text-xs font-bold">
                    {prefix}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        {isLoadingAny && <p className="text-sm text-muted-foreground">Loading settings...</p>}
        {errors.map((message) => (
          <p key={message} className="text-sm text-red-600">{message}</p>
        ))}
      </main>
    </div>
  );
}

function SettingRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold text-primary", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function IntegrationRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider", enabled ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
        {enabled ? "Enabled" : "Missing"}
      </span>
    </div>
  );
}
