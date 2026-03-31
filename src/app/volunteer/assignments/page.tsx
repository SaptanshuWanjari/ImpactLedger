"use client";

import VolunteerSidebar from "@/components/VolunteerSidebar";
import { motion } from "framer-motion";
import { MapPin, Clock, CheckCircle2, Navigation, FileText, Camera, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/lib/api/client";

type Assignment = {
  id: string;
  title: string;
  location: string;
  status: string;
  deadline: string;
  urgency: string;
  type: string;
};

type Response = { assignments: Assignment[] };

export default function VolunteerAssignmentsPage() {
  const { data, isLoading } = useApiData<Response>("/api/volunteer/assignments");

  return (
    <div className="flex min-h-screen bg-background">
      <VolunteerSidebar />
      <main className="flex-grow p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-primary">Field Assignments</h1>
          <p className="text-sm text-muted-foreground">Manage active missions and submit verification reports.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading assignments...</p>
          ) : (
            (data?.assignments || []).map((asg) => (
              <motion.div key={asg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="no-line-card p-6 space-y-6 group hover:border-accent transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest", asg.urgency === "High" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600")}>{asg.urgency} Priority</span>
                      <span className="px-2 py-0.5 bg-muted rounded-full text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{asg.type}</span>
                    </div>
                    <h3 className="text-xl font-display font-extrabold tracking-tight group-hover:text-accent transition-colors">{asg.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1"><MapPin size={12} /> {asg.location}</div>
                      <div className="flex items-center gap-1 text-red-500"><Clock size={12} /> Due {asg.deadline}</div>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 text-accent">
                    {asg.status === "Completed" ? <CheckCircle2 size={20} /> : <Navigation size={20} />}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-muted">
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-muted/30 rounded-lg text-muted-foreground hover:text-primary transition-colors"><FileText size={16} /></button>
                    <button className="p-2 bg-muted/30 rounded-lg text-muted-foreground hover:text-primary transition-colors"><Camera size={16} /></button>
                    <button className="p-2 bg-muted/30 rounded-lg text-muted-foreground hover:text-primary transition-colors"><MessageSquare size={16} /></button>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{asg.status}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
