"use client";

import VolunteerSidebar from "@/components/VolunteerSidebar";
import { useApiData } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type ImpactLog = {
  id: string;
  assignment: string;
  location: string;
  type: string;
  submittedAt: string;
  impactMetric: number;
  status: string;
  notes: string;
};

type VolunteerLogsResponse = {
  volunteerName: string;
  summary: {
    totalReports: number;
    reviewed: number;
    pendingReview: number;
    needsCorrection: number;
    totalImpact: number;
  };
  logs: ImpactLog[];
};

export default function VolunteerLogsPage() {
  const { data, isLoading, error } = useApiData<VolunteerLogsResponse>("/api/volunteer/logs");

  const stats = [
    { label: "Total Reports", value: String(data?.summary.totalReports || 0) },
    { label: "Reviewed", value: String(data?.summary.reviewed || 0) },
    { label: "Pending Review", value: String(data?.summary.pendingReview || 0) },
    { label: "Total Impact Metric", value: String(data?.summary.totalImpact || 0) },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <VolunteerSidebar />
      <main className="flex-grow p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 space-y-6 lg:space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Impact Logs</h1>
          <p className="text-sm text-muted-foreground">Field submissions and review outcomes for {data?.volunteerName || "your"} account.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="no-line-card p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{stat.label}</p>
              <p className="text-2xl font-display font-extrabold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="no-line-card p-6 space-y-4">
          <h2 className="font-display font-bold text-xl">Recent Logs</h2>
          <div className="space-y-3">
            {(data?.logs || []).map((log) => (
              <article key={log.id} className="rounded-xl border border-muted p-4 bg-white">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-bold">{log.assignment}</p>
                    <p className="text-xs text-muted-foreground">{log.type} • {log.location} • Submitted {log.submittedAt}</p>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                    log.status === "Reviewed" && "bg-green-50 text-green-700",
                    log.status === "Submitted" && "bg-amber-50 text-amber-700",
                    log.status === "Returned" && "bg-red-50 text-red-700",
                  )}>
                    {log.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{log.notes}</p>
                <p className="text-xs font-semibold text-primary">Impact Metric: {log.impactMetric}</p>
              </article>
            ))}
            {!isLoading && (data?.logs || []).length === 0 && <p className="text-sm text-muted-foreground">No impact logs yet.</p>}
          </div>
        </section>

        {isLoading && <p className="text-sm text-muted-foreground">Loading logs...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}
