"use client";

import { useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useApiData } from "@/lib/api/client";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type DonorRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  donationCount: number;
  totalDonated: string;
  lastDonation: string;
  lifecycle: string;
  communicationsOptIn: boolean;
  isAnonymous: boolean;
};

type DonorResponse = {
  kpis: {
    totalDonors: number;
    activeDonors: number;
    repeatDonors: number;
    averageGift: string;
    totalDonated: string;
  };
  donors: DonorRow[];
  recentActivity: {
    id: string;
    donorEmail: string;
    campaign: string;
    amount: string;
    status: string;
    date: string;
  }[];
};

const PIE_COLORS = ["#00338D", "#E63946", "#141414", "#737373"];

export default function AdminDonorsPage() {
  const { data, isLoading, error } = useApiData<DonorResponse>("/api/admin/donors");
  const [query, setQuery] = useState("");

  const filteredDonors = useMemo(() => {
    const donors = data?.donors || [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return donors;

    return donors.filter((donor) => {
      return donor.name.toLowerCase().includes(normalized) || donor.email.toLowerCase().includes(normalized);
    });
  }, [data?.donors, query]);

  const lifecycleData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const donor of data?.donors || []) {
      counts.set(donor.lifecycle, (counts.get(donor.lifecycle) || 0) + 1);
    }

    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [data?.donors]);

  const topDonorsByValue = useMemo(() => {
    return [...(data?.donors || [])]
      .map((donor) => ({
        name: donor.name,
        total: parseCurrencyValue(donor.totalDonated),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [data?.donors]);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-grow p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 space-y-6 lg:space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Donor Management</h1>
          <p className="text-sm text-muted-foreground">Track donor engagement, giving frequency, and recent contributions.</p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load donor analytics: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard label="Total Donors" value={String(data?.kpis.totalDonors || 0)} />
          <MetricCard label="Active Donors" value={String(data?.kpis.activeDonors || 0)} />
          <MetricCard label="Repeat Donors" value={String(data?.kpis.repeatDonors || 0)} />
          <MetricCard label="Average Gift" value={data?.kpis.averageGift || "₹0"} />
          <MetricCard label="Total Donated" value={data?.kpis.totalDonated || "₹0"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="no-line-card p-6">
            <h2 className="font-display font-bold text-xl mb-4">Donor Lifecycle Mix</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={lifecycleData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={95} paddingAngle={3}>
                    {lifecycleData.map((item, index) => (
                      <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="no-line-card p-6">
            <h2 className="font-display font-bold text-xl mb-4">Top Donors by Contribution</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDonorsByValue} layout="vertical" margin={{ left: 8, right: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 11, fill: "#737373" }} />
                  <Tooltip formatter={(value: number) => `₹${Number(value).toLocaleString()}`} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} fill="#00338D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="no-line-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-display font-bold text-xl">Donor Directory</h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by donor name or email"
              className="w-full md:w-80 rounded-xl border border-muted bg-background px-4 py-2 text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Donor</th>
                  <th className="px-3 py-3">Lifecycle</th>
                  <th className="px-3 py-3 text-right">Donations</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3">Last Gift</th>
                  <th className="px-3 py-3">Comms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/70 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Loading donors...</td>
                  </tr>
                ) : filteredDonors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">No donors match this filter.</td>
                  </tr>
                ) : (
                  filteredDonors.map((donor) => (
                    <tr key={donor.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-primary">{donor.name}</p>
                        <p className="text-xs text-muted-foreground">{donor.email}</p>
                      </td>
                      <td className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{donor.lifecycle}</td>
                      <td className="px-3 py-3 text-right font-semibold">{donor.donationCount}</td>
                      <td className="px-3 py-3 text-right font-display font-extrabold">{donor.totalDonated}</td>
                      <td className="px-3 py-3">{donor.lastDonation}</td>
                      <td className="px-3 py-3 text-xs">
                        {donor.communicationsOptIn ? "Opted In" : "Opted Out"}
                        {donor.isAnonymous ? " • Anonymous" : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="no-line-card p-6">
          <h2 className="font-display font-bold text-xl mb-4">Recent Donation Activity</h2>
          <div className="space-y-3">
            {(data?.recentActivity || []).map((entry) => (
              <div key={entry.id} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{entry.donorEmail}</p>
                  <p className="text-xs text-muted-foreground">{entry.campaign} • {entry.status}</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-display font-extrabold">{entry.amount}</p>
                  <p className="text-xs text-muted-foreground">{entry.date}</p>
                </div>
              </div>
            ))}
            {!isLoading && (data?.recentActivity || []).length === 0 && (
              <p className="text-sm text-muted-foreground">No donation activity available.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="no-line-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-display font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function parseCurrencyValue(value: string) {
  const numeric = value.replace(/[^0-9.-]/g, "");
  return Number(numeric || 0);
}
