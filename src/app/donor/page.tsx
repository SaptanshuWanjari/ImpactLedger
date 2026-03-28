"use client";

import DonorSidebar from "@/components/DonorSidebar";
import { motion } from "framer-motion";
import { Heart, TrendingUp, Award, Calendar, PieChart as PieChartIcon, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Link from "next/link";
import { useApiData } from "@/lib/api/client";

type DonorDashboard = {
  donorName: string;
  stats: {
    lifetimeDonated: string;
    ytdImpact: string;
    patronSince: string;
    nextMilestone: string;
  };
  allocation: { name: string; value: number; color: string }[];
  donationHistory: { id: string; campaign: string; amount: string; date: string; status: string }[];
  impactTimeline: { date: string; event: string; location: string; impact: string }[];
};

export default function DonorPortal() {
  const { data, isLoading } = useApiData<DonorDashboard>("/api/donor/dashboard?donorEmail=john@example.com");

  const impactStats = [
    { label: "Lifetime Donated", value: data?.stats.lifetimeDonated || "-", icon: Heart },
    { label: "YTD Impact", value: data?.stats.ytdImpact || "-", icon: TrendingUp },
    { label: "Patron Since", value: data?.stats.patronSince || "-", icon: Calendar },
    { label: "Next Milestone", value: data?.stats.nextMilestone || "-", icon: Award },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <DonorSidebar />

      <main className="flex-grow p-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold tracking-tight">Impact Summary</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {data?.donorName || "Donor"}. Your stewardship is changing lives.</p>
          </div>
          <Link href="/donate" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
            New Donation <ArrowRight size={18} />
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {impactStats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="no-line-card p-6">
              <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-4"><stat.icon size={20} /></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-extrabold tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="no-line-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl">Fund Allocation</h3>
              <PieChartIcon className="text-muted-foreground" size={18} />
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.allocation || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {(data?.allocation || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 no-line-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl">Impact Timeline</h3>
              <Clock className="text-muted-foreground" size={18} />
            </div>
            <div className="space-y-8 relative">
              {(data?.impactTimeline || []).map((item, index) => (
                <div key={index} className="relative pl-12">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{item.event}</p>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Location: <span className="text-primary font-medium">{item.location}</span></p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-2"><CheckCircle2 size={10} />{item.impact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="no-line-card p-6">
          <h3 className="font-display font-bold text-xl mb-8">Donation History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-muted">
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {isLoading ? (
                  <tr><td colSpan={4} className="py-6 text-sm text-muted-foreground">Loading...</td></tr>
                ) : (
                  (data?.donationHistory || []).map((donation) => (
                    <tr key={donation.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-4 text-sm font-medium">{donation.campaign}</td>
                      <td className="py-4 text-sm font-bold">{donation.amount}</td>
                      <td className="py-4 text-sm text-muted-foreground">{donation.date}</td>
                      <td className="py-4"><span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 size={10} /> {donation.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
