"use client";

import VolunteerSidebar from "@/components/VolunteerSidebar";
import { motion } from "framer-motion";
import { HandHelping, TrendingUp, ClipboardList, MapPin, Clock, CheckCircle2, WifiOff, RefreshCw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchJson, useApiData } from "@/lib/api/client";

type VolunteerDashboard = {
  volunteerName: string;
  stats: { hoursLogged: string; missionsJoined: string; impactScore: string; certifications: string };
  assignments: { id: string; title: string; location: string; status: string; urgency: string; deadline: string }[];
  syncQueue: { id: number; type: string; status: string; date: string }[];
};

export default function VolunteerHub() {
  const { data, isLoading } = useApiData<VolunteerDashboard>("/api/volunteer/dashboard");
  const [isOnline, setIsOnline] = useState(true);
  const [reportNotes, setReportNotes] = useState("");
  const [reportMetric, setReportMetric] = useState("");
  const [message, setMessage] = useState<string | null>(null);

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

  async function submitReport() {
    try {
      await fetchJson("/api/volunteer/assignments", {
        method: "POST",
        body: JSON.stringify({ impactMetric: Number(reportMetric), notes: reportNotes }),
      });
      setMessage("Report submitted.");
    } catch (error) {
      setMessage((error as Error).message);
    }
  }

  const volunteerStats = [
    { label: "Hours Logged", value: data?.stats.hoursLogged || "0", icon: Clock },
    { label: "Missions Joined", value: data?.stats.missionsJoined || "0", icon: HandHelping },
    { label: "Impact Score", value: data?.stats.impactScore || "0", icon: TrendingUp },
    { label: "Certifications", value: data?.stats.certifications || "0", icon: CheckCircle2 },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <VolunteerSidebar />
      <main className="flex-grow p-8 space-y-8">
        {!isOnline && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-600">
              <WifiOff size={20} />
              <p className="text-sm font-bold">Offline Mode Active</p>
            </div>
            <RefreshCw size={16} className="text-red-400 animate-spin" />
          </motion.div>
        )}

        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Volunteer Impact</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {data?.volunteerName || "Volunteer"}.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {volunteerStats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="no-line-card p-6">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4"><stat.icon size={20} /></div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-display font-extrabold tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 no-line-card p-6">
            <div className="flex items-center justify-between mb-8"><h3 className="font-display font-bold text-xl">Active Assignments</h3><MapPin className="text-muted-foreground" size={18} /></div>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading assignments...</p>
              ) : (
                (data?.assignments || []).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                    <div>
                      <p className="text-sm font-bold">{assignment.title}</p>
                      <p className="text-xs text-muted-foreground">{assignment.location} • Due {assignment.deadline}</p>
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", assignment.urgency === "High" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>{assignment.urgency} Urgency</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="no-line-card p-6">
            <div className="flex items-center justify-between mb-8"><h3 className="font-display font-bold text-xl">Sync Queue</h3><RefreshCw className={cn("text-muted-foreground", !isOnline && "animate-spin")} size={18} /></div>
            <div className="space-y-4">
              {(data?.syncQueue || []).map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <p className="text-sm font-bold">{item.type}</p>
                  <span className="text-[10px] text-muted-foreground">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="no-line-card p-8 bg-white border border-muted">
          <h3 className="text-2xl font-display font-bold mb-4">Quick Field Report</h3>
          <div className="space-y-4">
            <input type="number" value={reportMetric} onChange={(e) => setReportMetric(e.target.value)} className="w-full px-4 py-3 bg-muted/30 rounded-xl" placeholder="Impact metric" />
            <textarea rows={4} value={reportNotes} onChange={(e) => setReportNotes(e.target.value)} className="w-full px-4 py-3 bg-muted/30 rounded-xl" placeholder="Field notes" />
            <button onClick={submitReport} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2">Submit Report <Send size={18} /></button>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
