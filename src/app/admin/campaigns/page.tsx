"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Globe, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const campaigns = [
  { id: 1, title: "Clean Water Initiative", location: "Kenya", status: "Active", progress: 75, goal: "$50,000", raised: "$37,500", category: "Health" },
  { id: 2, title: "Emergency Relief: Cyclone", location: "Vietnam", status: "Urgent", progress: 40, goal: "$100,000", raised: "$40,000", category: "Disaster" },
  { id: 3, title: "Youth Education Fund", location: "Peru", status: "Active", progress: 90, goal: "$25,000", raised: "$22,500", category: "Education" },
  { id: 4, title: "Reforestation Project", location: "Brazil", status: "Planning", progress: 0, goal: "$200,000", raised: "$0", category: "Environment" },
  { id: 5, title: "Mobile Health Clinic", location: "India", status: "Active", progress: 55, goal: "$75,000", raised: "$41,250", category: "Health" },
];

export default function AdminCampaignsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-grow p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold tracking-tight">Campaign Management</h1>
            <p className="text-sm text-muted-foreground">Create, monitor, and manage global stewardship missions.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
              <Plus size={18} /> Create New Campaign
            </button>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-muted shadow-sm">
          <div className="flex items-center gap-2">
            {["All", "Active", "Urgent", "Planning", "Completed"].map((status) => (
              <button 
                key={status}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                  status === "All" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                )}
              >
                {status}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search campaigns..." 
                className="pl-9 pr-4 py-2 bg-muted/30 border-none rounded-xl text-xs focus:ring-2 focus:ring-accent/20 transition-all w-64"
              />
            </div>
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="no-line-card p-0 overflow-hidden border border-muted">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/30 border-b border-muted">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progress</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Raised / Goal</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
                          <Globe size={20} />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold">{campaign.title}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{campaign.location} • {campaign.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        campaign.status === "Active" ? "bg-green-50 text-green-600" : 
                        campaign.status === "Urgent" ? "bg-red-50 text-red-600" : 
                        campaign.status === "Planning" ? "bg-amber-50 text-amber-600" : "bg-muted text-muted-foreground"
                      )}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{campaign.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${campaign.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-display font-extrabold">{campaign.raised}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">of {campaign.goal}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 text-muted-foreground hover:text-accent transition-colors" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-primary transition-colors" title="Edit Campaign">
                          <Edit size={16} />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-red-500 transition-colors" title="Delete Campaign">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="no-line-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Stewardship</p>
              <p className="text-2xl font-display font-extrabold">$450,000.00</p>
            </div>
          </div>
          <div className="no-line-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Completed Missions</p>
              <p className="text-2xl font-display font-extrabold">124</p>
            </div>
          </div>
          <div className="no-line-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Urgent Missions</p>
              <p className="text-2xl font-display font-extrabold">12</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
