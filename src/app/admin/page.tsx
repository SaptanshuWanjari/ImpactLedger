"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { motion } from "framer-motion";
import { TrendingUp, Users, Globe, ShieldCheck, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useApiData } from "@/lib/api/client";

type AdminDashboardResponse = {
  kpis: { label: string; value: string; change: string; trend: string }[];
  growth: { name: string; value: number }[];
  recentActivity: { id: string; type: string; user: string; amount: string; status: string; date: string }[];
};

const kpiIcons = [TrendingUp, Users, Globe, ShieldCheck];

export default function AdminDashboard() {
  const { data, isLoading } = useApiData<AdminDashboardResponse>("/api/admin/dashboard");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-grow p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Global Stewardship</h1>
          <p className="text-sm text-muted-foreground">Real-time overview of NGO operations.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(data?.kpis || []).map((kpi, index) => {
            const Icon = kpiIcons[index] || TrendingUp;
            return (
              <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="no-line-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center"><Icon size={20} /></div>
                  <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", kpi.trend === "up" ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground")}>
                    {kpi.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-2xl font-display font-extrabold tracking-tight">{kpi.value}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 no-line-card p-6">
            <h3 className="font-display font-bold text-xl mb-8">Stewardship Growth</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.growth || []}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00338D" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#00338D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#737373" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#737373" }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#00338D" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="no-line-card p-6">
            <h3 className="font-display font-bold text-xl mb-8">Recent Activity</h3>
            <div className="space-y-6">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              ) : (
                (data?.recentActivity || []).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="w-2 h-2 rounded-full mt-2 bg-accent" />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold">{activity.user}</p>
                        <span className="text-[10px] text-muted-foreground">{activity.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{activity.type}: <span className="text-primary font-medium">{activity.amount}</span></p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
