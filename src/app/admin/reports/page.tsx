"use client";

import { useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useApiData } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Range = "7d" | "30d" | "90d" | "all";

type ReportsResponse = {
  range: Range;
  summary: {
    donationsRaised: string;
    donationCount: number;
    expensesPosted: string;
    netFlow: string;
    donationSuccessRate: string;
  };
  donationStatus: { status: string; count: number }[];
  expenseStatus: { status: string; count: number }[];
  campaignFunding: { name: string; goal: string; raised: string; spent: string; progress: number }[];
  recentAudit: { id: string; actor: string; action: string; target: string; date: string }[];
};

const ranges: Range[] = ["7d", "30d", "90d", "all"];
const PIE_COLORS = ["#00338D", "#E63946", "#141414", "#737373", "#9CA3AF"];

export default function AdminReportsPage() {
  const [range, setRange] = useState<Range>("30d");
  const { data, isLoading, error } = useApiData<ReportsResponse>(`/api/admin/reports?range=${range}`);

  const statusPie = useMemo(() => {
    const donation = data?.donationStatus || [];
    const expense = data?.expenseStatus || [];

    const donationTotal = donation.reduce((sum, item) => sum + item.count, 0);
    const expenseTotal = expense.reduce((sum, item) => sum + item.count, 0);

    return [
      { name: "Donation Events", value: donationTotal },
      { name: "Expense Events", value: expenseTotal },
    ].filter((item) => item.value > 0);
  }, [data?.donationStatus, data?.expenseStatus]);

  const fundingChart = (data?.campaignFunding || []).map((item) => ({
    name: item.name.split(" ").slice(0, 2).join(" "),
    progress: item.progress,
  }));

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-grow p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 space-y-6 lg:space-y-8">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">Operational and fundraising snapshots for internal stewardship review.</p>
          </div>
          <div className="w-full sm:w-auto overflow-x-auto">
            <div className="flex min-w-max items-center gap-2 rounded-xl border border-muted p-1">
            {ranges.map((value) => (
              <button
                key={value}
                onClick={() => setRange(value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
                  range === value ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {value}
              </button>
            ))}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <MetricCard label="Donations Raised" value={data?.summary.donationsRaised || "₹0"} />
          <MetricCard label="Donation Count" value={String(data?.summary.donationCount || 0)} />
          <MetricCard label="Expenses Posted" value={data?.summary.expensesPosted || "₹0"} />
          <MetricCard label="Net Flow" value={data?.summary.netFlow || "₹0"} />
          <MetricCard label="Success Rate" value={data?.summary.donationSuccessRate || "0%"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="no-line-card p-6">
            <h2 className="font-display font-bold text-xl mb-4">Event Type Mix</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                    {statusPie.map((item, index) => (
                      <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="no-line-card p-6">
            <h2 className="font-display font-bold text-xl mb-4">Campaign Goal Progress</h2>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundingChart} margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="progress" fill="#00338D" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="no-line-card p-6 space-y-3">
            <h2 className="font-display font-bold text-xl">Donation Status Mix</h2>
            {(data?.donationStatus || []).map((row) => (
              <StatusRow key={row.status} label={row.status} count={row.count} />
            ))}
            {!isLoading && (data?.donationStatus || []).length === 0 && <p className="text-sm text-muted-foreground">No donation records.</p>}
          </div>

          <div className="no-line-card p-6 space-y-3">
            <h2 className="font-display font-bold text-xl">Expense Status Mix</h2>
            {(data?.expenseStatus || []).map((row) => (
              <StatusRow key={row.status} label={row.status} count={row.count} />
            ))}
            {!isLoading && (data?.expenseStatus || []).length === 0 && <p className="text-sm text-muted-foreground">No expense records.</p>}
          </div>
        </div>

        <div className="no-line-card p-6">
          <h2 className="font-display font-bold text-xl mb-4">Campaign Funding Snapshot</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-muted text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-3">Campaign</th>
                  <th className="px-3 py-3 text-right">Raised</th>
                  <th className="px-3 py-3 text-right">Spent</th>
                  <th className="px-3 py-3 text-right">Goal</th>
                  <th className="px-3 py-3 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/70 text-sm">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Loading report data...</td></tr>
                ) : (
                  (data?.campaignFunding || []).map((row) => (
                    <tr key={row.name}>
                      <td className="px-3 py-3 font-semibold">{row.name}</td>
                      <td className="px-3 py-3 text-right">{row.raised}</td>
                      <td className="px-3 py-3 text-right">{row.spent}</td>
                      <td className="px-3 py-3 text-right">{row.goal}</td>
                      <td className="px-3 py-3 text-right font-bold">{row.progress}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="no-line-card p-6">
          <h2 className="font-display font-bold text-xl mb-4">Recent Audit Activity</h2>
          <div className="space-y-3">
            {(data?.recentAudit || []).map((entry) => (
              <div key={entry.id} className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-muted/20 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{entry.action}</p>
                  <p className="text-xs text-muted-foreground">{entry.actor} • {entry.target}</p>
                </div>
                <p className="text-xs text-muted-foreground">{entry.date}</p>
              </div>
            ))}
            {!isLoading && (data?.recentAudit || []).length === 0 && <p className="text-sm text-muted-foreground">No audit rows found.</p>}
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
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

function StatusRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-3">
      <p className="text-sm font-medium">{label}</p>
      <p className="font-display font-extrabold">{count}</p>
    </div>
  );
}
