"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Users, 
  Globe, 
  ShieldCheck, 
  Bell, 
  Search, 
  Filter, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

const data = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 4500 },
  { name: "May", value: 6000 },
  { name: "Jun", value: 5500 },
  { name: "Jul", value: 7000 },
];

const kpis = [
  { label: "Total Stewardship", value: "$4,250,000", change: "+12.5%", trend: "up", icon: TrendingUp },
  { label: "Active Stewards", value: "12,540", change: "+5.2%", trend: "up", icon: Users },
  { label: "Regional Hubs", value: "24", change: "0%", trend: "neutral", icon: Globe },
  { label: "Transparency Score", value: "99.8%", change: "+0.1%", trend: "up", icon: ShieldCheck },
];

const recentActivity = [
  { id: 1, type: "Donation", user: "John Doe", amount: "$500.00", status: "Verified", date: "2 mins ago" },
  { id: 2, type: "Expense", user: "Regional Hub - Kenya", amount: "$2,400.00", status: "Pending", date: "15 mins ago" },
  { id: 3, type: "Volunteer", user: "Sarah Smith", amount: "Clean Water Project", status: "Active", date: "1 hour ago" },
  { id: 4, type: "Donation", user: "Anonymous", amount: "$1,200.00", status: "Verified", date: "3 hours ago" },
  { id: 5, type: "Verification", user: "Steward Admin", amount: "Cyclone Relief", status: "Completed", date: "5 hours ago" },
];

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-grow p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold tracking-tight">Global Stewardship</h1>
            <p className="text-sm text-muted-foreground">Real-time overview of Lions International operations.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search stewardship logs..." 
                className="pl-10 pr-4 py-2 bg-white border border-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all w-64"
              />
            </div>
            <button className="p-2 bg-white border border-muted rounded-xl text-muted-foreground hover:text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white" />
            </button>
            <button className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
              <Plus size={18} /> New Campaign
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="no-line-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                  <kpi.icon size={20} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                  kpi.trend === "up" ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"
                )}>
                  {kpi.trend === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {kpi.change}
                </div>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{kpi.label}</p>
              <p className="text-2xl font-display font-extrabold tracking-tight">{kpi.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 no-line-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl">Stewardship Growth</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                  <Filter size={18} />
                </button>
                <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00338D" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#00338D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#737373" }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: "#737373" }} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.8)", 
                      backdropFilter: "blur(8px)",
                      border: "1px solid #E5E5E5",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#00338D" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="no-line-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl">Recent Activity</h3>
              <Link href="/admin/logs" className="text-xs font-bold text-accent uppercase tracking-widest hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-6">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 group">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 transition-transform group-hover:scale-150",
                    activity.status === "Verified" ? "bg-green-500" : 
                    activity.status === "Pending" ? "bg-amber-500" : "bg-accent"
                  )} />
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{activity.user}</p>
                      <span className="text-[10px] text-muted-foreground font-medium">{activity.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.type}: <span className="text-primary font-medium">{activity.amount}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                        activity.status === "Verified" ? "bg-green-50 text-green-600" : 
                        activity.status === "Pending" ? "bg-amber-50 text-amber-600" : "bg-accent/10 text-accent"
                      )}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Regional Hub Operations Map Placeholder */}
        <div className="no-line-card p-8 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <Globe size={400} className="translate-x-1/4 translate-y-1/4" />
          </div>
          <div className="relative z-10 space-y-6 max-w-lg">
            <p className="text-accent font-bold uppercase tracking-widest text-xs">Regional Hub Operations</p>
            <h3 className="text-4xl font-display font-extrabold tracking-tighter leading-none">
              Global Impact, <br />
              Local Stewardship.
            </h3>
            <p className="text-primary-foreground/70">
              Monitoring 24 regional hubs across 156 countries. Real-time data sync from field stewards ensures radical transparency at every node.
            </p>
            <div className="flex gap-4">
              <button className="btn-primary bg-accent text-white border-none py-2 px-6 text-sm">
                View Global Map
              </button>
              <button className="btn-outline border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary py-2 px-6 text-sm">
                Hub Reports
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
