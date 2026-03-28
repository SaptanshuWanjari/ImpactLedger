"use client";

import DonorSidebar from "@/components/DonorSidebar";
import { motion } from "framer-motion";
import { 
  Heart, 
  TrendingUp, 
  Award, 
  Calendar, 
  PieChart as PieChartIcon, 
  ArrowRight, 
  CheckCircle2, 
  Clock,
  Download
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

const impactStats = [
  { label: "Lifetime Donated", value: "$12,450.00", icon: Heart },
  { label: "YTD Impact", value: "$3,200.00", icon: TrendingUp },
  { label: "Patron Since", value: "2022", icon: Calendar },
  { label: "Next Milestone", value: "$15K", icon: Award },
];

const allocationData = [
  { name: "Clean Water", value: 45, color: "#00338D" },
  { name: "Education", value: 25, color: "#E63946" },
  { name: "Emergency Relief", value: 20, color: "#141414" },
  { name: "Operational", value: 10, color: "#737373" },
];

const donationHistory = [
  { id: 1, campaign: "Clean Water Initiative", amount: "$500.00", date: "Oct 12, 2025", status: "Verified" },
  { id: 2, campaign: "Emergency Relief: Cyclone", amount: "$1,200.00", date: "Sep 24, 2025", status: "Verified" },
  { id: 3, campaign: "Youth Education Fund", amount: "$250.00", date: "Aug 15, 2025", status: "Verified" },
  { id: 4, campaign: "Clean Water Initiative", amount: "$500.00", date: "Jul 10, 2025", status: "Verified" },
];

const impactTimeline = [
  { date: "Oct 20, 2025", event: "Clean Water Project Completed", location: "Kenya", impact: "500 families served" },
  { date: "Sep 30, 2025", event: "Cyclone Relief Dispatched", location: "Vietnam", impact: "Emergency kits delivered" },
  { date: "Aug 20, 2025", event: "Education Fund Allocation", location: "Peru", impact: "12 scholarships awarded" },
];

export default function DonorPortal() {
  return (
    <div className="flex min-h-screen bg-background">
      <DonorSidebar />
      
      <main className="flex-grow p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold tracking-tight">Impact Summary</h1>
            <p className="text-sm text-muted-foreground">Welcome back, John. Your stewardship is changing lives.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/donate" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
              New Donation <ArrowRight size={18} />
            </Link>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {impactStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="no-line-card p-6"
            >
              <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-4">
                <stat.icon size={20} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-extrabold tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Allocation and Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Fund Allocation */}
          <div className="no-line-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl">Fund Allocation</h3>
              <PieChartIcon className="text-muted-foreground" size={18} />
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.8)", 
                      backdropFilter: "blur(8px)",
                      border: "1px solid #E5E5E5",
                      borderRadius: "12px"
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {allocationData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Impact Timeline */}
          <div className="lg:col-span-2 no-line-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl">Impact Timeline</h3>
              <Clock className="text-muted-foreground" size={18} />
            </div>
            <div className="space-y-8 relative">
              <div className="absolute left-4 top-2 bottom-2 w-px bg-muted" />
              {impactTimeline.map((item, index) => (
                <div key={index} className="relative pl-12">
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 bg-accent rounded-full border-4 border-white shadow-sm" />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{item.event}</p>
                      <span className="text-xs text-muted-foreground">{item.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Location: <span className="text-primary font-medium">{item.location}</span></p>
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-2">
                      <CheckCircle2 size={10} />
                      {item.impact}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Donation History */}
        <div className="no-line-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-display font-bold text-xl">Donation History</h3>
            <button className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2 hover:underline">
              <Download size={14} /> Download Tax Receipts
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-muted">
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Amount</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="pb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {donationHistory.map((donation) => (
                  <tr key={donation.id} className="group hover:bg-muted/30 transition-colors">
                    <td className="py-4 text-sm font-medium">{donation.campaign}</td>
                    <td className="py-4 text-sm font-bold">{donation.amount}</td>
                    <td className="py-4 text-sm text-muted-foreground">{donation.date}</td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle2 size={10} /> {donation.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <button className="text-xs font-bold text-accent hover:underline">View Receipt</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
