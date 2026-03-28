"use client";

import VolunteerSidebar from "@/components/VolunteerSidebar";
import { motion } from "framer-motion";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  Navigation,
  FileText,
  Camera,
  MessageSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const assignments = [
  { id: "ASG-1024", title: "Borehole Maintenance", location: "Kenya Hub", status: "Active", deadline: "Oct 30, 2025", priority: "High", type: "Technical" },
  { id: "ASG-1025", title: "Food Distribution", location: "Vietnam Hub", status: "Pending", deadline: "Nov 02, 2025", priority: "Medium", type: "Logistics" },
  { id: "ASG-1026", title: "School Supply Delivery", location: "Peru Hub", status: "Active", deadline: "Oct 29, 2025", priority: "High", type: "Education" },
  { id: "ASG-1027", title: "Health Screening Support", location: "India Hub", status: "Completed", deadline: "Oct 25, 2025", priority: "Medium", type: "Medical" },
  { id: "ASG-1028", title: "Community Garden Prep", location: "Brazil Hub", status: "Pending", deadline: "Nov 05, 2025", priority: "Low", type: "Environment" },
];

export default function VolunteerAssignmentsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <VolunteerSidebar />
      
      <main className="flex-grow p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-primary">Field Assignments</h1>
            <p className="text-sm text-muted-foreground">Manage your active missions and submit verification reports.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
              <Navigation size={18} /> Open Field Map
            </button>
          </div>
        </header>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-muted shadow-sm">
          <div className="flex items-center gap-2">
            {["All", "Active", "Pending", "Completed"].map((status) => (
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
                placeholder="Search assignments..." 
                className="pl-9 pr-4 py-2 bg-muted/30 border-none rounded-xl text-xs focus:ring-2 focus:ring-accent/20 transition-all w-64"
              />
            </div>
            <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Assignments List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assignments.map((asg) => (
            <motion.div 
              key={asg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="no-line-card p-6 space-y-6 group hover:border-accent transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest",
                      asg.priority === "High" ? "bg-red-50 text-red-600" : 
                      asg.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {asg.priority} Priority
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded-full text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                      {asg.type}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-extrabold tracking-tight group-hover:text-accent transition-colors">{asg.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                      <MapPin size={12} /> {asg.location}
                    </div>
                    <div className="w-1 h-1 bg-muted rounded-full" />
                    <div className="flex items-center gap-1 text-red-500">
                      <Clock size={12} /> Due {asg.deadline}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  asg.status === "Active" ? "bg-accent/10 text-accent" : 
                  asg.status === "Completed" ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"
                )}>
                  {asg.status === "Active" ? <Navigation size={20} /> : 
                   asg.status === "Completed" ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-muted">
                <div className="flex items-center gap-2">
                  <button className="p-2 bg-muted/30 rounded-lg text-muted-foreground hover:text-primary transition-colors" title="View Instructions">
                    <FileText size={16} />
                  </button>
                  <button className="p-2 bg-muted/30 rounded-lg text-muted-foreground hover:text-primary transition-colors" title="Upload Evidence">
                    <Camera size={16} />
                  </button>
                  <button className="p-2 bg-muted/30 rounded-lg text-muted-foreground hover:text-primary transition-colors" title="Contact Coordinator">
                    <MessageSquare size={16} />
                  </button>
                </div>
                <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent hover:underline">
                  Submit Report <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Offline Sync Status */}
        <div className="no-line-card p-4 bg-muted/10 border-dashed border-2 border-muted flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Online • All reports synced</p>
          </div>
          <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline">
            View Sync History
          </button>
        </div>
      </main>
    </div>
  );
}
