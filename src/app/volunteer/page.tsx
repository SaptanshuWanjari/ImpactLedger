"use client";

import VolunteerSidebar from "@/components/VolunteerSidebar";
import { motion } from "framer-motion";
import { 
  HandHelping, 
  TrendingUp, 
  ClipboardList, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  WifiOff, 
  RefreshCw,
  Camera,
  FileText,
  Send,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const volunteerStats = [
  { label: "Hours Logged", value: "124", icon: Clock },
  { label: "Missions Joined", value: "8", icon: HandHelping },
  { label: "Impact Score", value: "98", icon: TrendingUp },
  { label: "Certifications", value: "3", icon: CheckCircle2 },
];

const assignments = [
  { id: 1, title: "Clean Water Site Survey", location: "Sector 4, Kenya", status: "Active", urgency: "High" },
  { id: 2, title: "Sanitation Workshop", location: "Community Center", status: "Upcoming", urgency: "Medium" },
  { id: 3, title: "Supply Distribution", location: "Regional Hub", status: "Completed", urgency: "High" },
];

const syncQueue = [
  { id: 1, type: "Survey Form", status: "Pending Sync", date: "10 mins ago" },
  { id: 2, type: "Photo Log", status: "Pending Sync", date: "15 mins ago" },
];

export default function VolunteerHub() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <VolunteerSidebar />
      
      <main className="flex-grow p-8 space-y-8">
        {/* Offline Warning */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3 text-red-600">
              <WifiOff size={20} />
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Offline Mode Active</p>
                <p className="text-xs">Changes will be saved locally and synced when you're back online.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">2 items in queue</span>
              <RefreshCw size={16} className="text-red-400 animate-spin" />
            </div>
          </motion.div>
        )}

        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold tracking-tight">Volunteer Impact</h1>
            <p className="text-sm text-muted-foreground">Welcome back, Sarah. Your field work is essential to our mission.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="btn-primary flex items-center gap-2 py-2 px-4 text-sm bg-green-600 hover:bg-green-700">
              <ClipboardList size={18} /> New Field Report
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {volunteerStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="no-line-card p-6"
            >
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4">
                <stat.icon size={20} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-extrabold tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Assignments and Sync Queue */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Assignments */}
          <div className="lg:col-span-2 no-line-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl">Active Assignments</h3>
              <MapPin className="text-muted-foreground" size={18} />
            </div>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl group hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      assignment.status === "Active" ? "bg-green-100 text-green-600" : 
                      assignment.status === "Upcoming" ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                    )}>
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{assignment.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                      assignment.urgency === "High" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {assignment.urgency} Urgency
                    </div>
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Queue */}
          <div className="no-line-card p-6">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl">Sync Queue</h3>
              <RefreshCw className={cn("text-muted-foreground", !isOnline && "animate-spin")} size={18} />
            </div>
            <div className="space-y-6">
              {syncQueue.map((item) => (
                <div key={item.id} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                    {item.type === "Survey Form" ? <FileText size={16} /> : <Camera size={16} />}
                  </div>
                  <div className="flex-grow space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{item.type}</p>
                      <span className="text-[10px] text-muted-foreground">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
              {syncQueue.length === 0 && (
                <div className="text-center py-10 space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-green-500" />
                  <p className="text-sm font-bold">All data synced.</p>
                  <p className="text-xs text-muted-foreground">Your field reports are up to date.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Field Form Submission Placeholder */}
        <div className="no-line-card p-8 bg-white border border-muted">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-display font-bold">Quick Field Report</h3>
              <p className="text-sm text-muted-foreground">Submit impact data directly from the field. Works offline.</p>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assignment</label>
                  <select className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 transition-all">
                    <option>Clean Water Site Survey</option>
                    <option>Sanitation Workshop</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impact Metric</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 50 families" 
                    className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Field Notes</label>
                <textarea 
                  rows={4}
                  placeholder="Describe the impact or any challenges encountered..." 
                  className="w-full px-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                />
              </div>
              <div className="flex items-center gap-4">
                <button className="flex-grow btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                  Submit Report <Send size={18} />
                </button>
                <button className="p-3 bg-muted rounded-xl text-muted-foreground hover:text-primary transition-colors">
                  <Camera size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
