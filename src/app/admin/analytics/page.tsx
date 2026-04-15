"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { useApiData } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Range = "7d" | "30d" | "90d" | "all";

type AnalyticsResponse = {
  range: Range;
  kpis: {
    totalRaised: string;
    totalSpent: string;
    netFlow: string;
    activeCampaigns: number;
  };
  trends: {
    donations: { date: string; value: number; label: string }[];
    expenses: { date: string; value: number; label: string }[];
  };
  campaignPerformance: { campaign: string; raised: number; spent: number; efficiency: number }[];
  statusBreakdown: {
    donations: { status: string; count: number }[];
    expenses: { status: string; count: number }[];
  };
};

const ranges: Range[] = ["7d", "30d", "90d", "all"];
const STATUS_COLORS = ["#00338D", "#E63946", "#141414", "#737373", "#9CA3AF"];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const { data, isLoading, error } = useApiData<AnalyticsResponse>(`/api/admin/analytics?range=${range}`);

  const chartData = (data?.trends.donations || []).map((row, index) => ({
    label: row.label,
    donations: row.value,
    expenses: data?.trends.expenses?.[index]?.value || 0,
  }));

  const efficiencyChart = (data?.campaignPerformance || []).map((item) => ({
    campaign: item.campaign.split(" ").slice(0, 2).join(" "),
    efficiency: item.efficiency,
  }));

  const statusPie = [
    ...((data?.statusBreakdown.donations || []).map((item) => ({
      name: `Donations - ${item.status}`,
      value: item.count,
    })) || []),
    ...((data?.statusBreakdown.expenses || []).map((item) => ({
      name: `Expenses - ${item.status}`,
      value: item.count,
    })) || []),
  ].filter((row) => row.value > 0);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-grow p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 space-y-6 lg:space-y-8">
        <header className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight">Analytics</h1>
            <p className="text-sm text-muted-foreground">Trend visibility for donation flow, spending, and campaign efficiency.</p>
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

        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load analytics: {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard label="Total Raised" value={data?.kpis.totalRaised || "₹0"} />
          <MetricCard label="Total Spent" value={data?.kpis.totalSpent || "₹0"} />
          <MetricCard label="Net Flow" value={data?.kpis.netFlow || "₹0"} />
          <MetricCard label="Active Campaigns" value={String(data?.kpis.activeCampaigns || 0)} />
        </div>

        <div className="no-line-card p-6">
          <h2 className="font-display font-bold text-xl mb-6">Donation vs Expense Trend</h2>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="donationsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00338D" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00338D" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E63946" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#E63946" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                <Tooltip />
                <Area type="monotone" dataKey="donations" stroke="#00338D" fill="url(#donationsGradient)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="expenses" stroke="#E63946" fill="url(#expensesGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {!isLoading && chartData.length === 0 && <p className="text-sm text-muted-foreground">No trend data available for this range.</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="no-line-card p-6">
            <h2 className="font-display font-bold text-xl mb-4">Campaign Performance</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyChart} margin={{ left: 8, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="campaign" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} domain={[-100, 100]} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="efficiency" fill="#00338D" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {!isLoading && (data?.campaignPerformance || []).length === 0 && <p className="text-sm text-muted-foreground">No campaign performance rows.</p>}
          </div>

          <div className="no-line-card p-6">
            <h2 className="font-display font-bold text-xl mb-4">Status Breakdown</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={2}>
                    {statusPie.map((row, index) => (
                      <Cell key={row.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {!isLoading &&
              (data?.statusBreakdown.donations || []).length === 0 &&
              (data?.statusBreakdown.expenses || []).length === 0 && (
                <p className="text-sm text-muted-foreground">No status distribution available.</p>
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
