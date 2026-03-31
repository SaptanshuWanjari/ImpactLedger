"use client";

import VolunteerSidebar from "@/components/VolunteerSidebar";
import { useApiData } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type VerificationQueueItem = {
  id: string;
  assignmentId: string | null;
  status: string;
  submittedAt: string;
  impactMetric: number;
};

type VolunteerVerificationResponse = {
  volunteerName: string;
  assignmentCoverage: {
    totalAssignments: number;
    reportedAssignments: number;
    completionRate: number;
  };
  reportStatus: {
    submitted: number;
    reviewed: number;
    returned: number;
  };
  verificationQueue: VerificationQueueItem[];
};

export default function VolunteerVerificationPage() {
  const { data, isLoading, error } = useApiData<VolunteerVerificationResponse>("/api/volunteer/verification");

  return (
    <div className="flex min-h-screen bg-background">
      <VolunteerSidebar />
      <main className="flex-grow p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Verification</h1>
          <p className="text-sm text-muted-foreground">Track report review states and assignment coverage for {data?.volunteerName || "your"} workflow.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="no-line-card p-6 space-y-4 xl:col-span-2">
            <h2 className="font-display font-bold text-xl">Assignment Coverage</h2>
            <div className="rounded-xl bg-muted/20 p-4">
              <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted-foreground">Reported Assignments</span>
                <span className="font-bold">{data?.assignmentCoverage.reportedAssignments || 0} / {data?.assignmentCoverage.totalAssignments || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-green-600" style={{ width: `${data?.assignmentCoverage.completionRate || 0}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{data?.assignmentCoverage.completionRate || 0}% coverage</p>
            </div>
          </section>

          <section className="no-line-card p-6 space-y-3">
            <h2 className="font-display font-bold text-xl">Report Status</h2>
            <StatusRow label="Submitted" value={data?.reportStatus.submitted || 0} tone="warning" />
            <StatusRow label="Reviewed" value={data?.reportStatus.reviewed || 0} tone="success" />
            <StatusRow label="Returned" value={data?.reportStatus.returned || 0} tone="danger" />
          </section>
        </div>

        <section className="no-line-card p-6 space-y-4">
          <h2 className="font-display font-bold text-xl">Verification Queue</h2>
          <div className="space-y-3">
            {(data?.verificationQueue || []).map((item) => (
              <div key={item.id} className="rounded-xl border border-muted px-4 py-3 bg-white flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Report #{item.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">Submitted {item.submittedAt} • Impact {item.impactMetric}</p>
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                  item.status === "Submitted" && "bg-amber-50 text-amber-700",
                  item.status === "Returned" && "bg-red-50 text-red-700",
                  item.status === "Reviewed" && "bg-green-50 text-green-700",
                )}>
                  {item.status}
                </span>
              </div>
            ))}
            {!isLoading && (data?.verificationQueue || []).length === 0 && <p className="text-sm text-muted-foreground">No reports in queue.</p>}
          </div>
        </section>

        {isLoading && <p className="text-sm text-muted-foreground">Loading verification data...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}

function StatusRow({ label, value, tone }: { label: string; value: number; tone: "success" | "warning" | "danger" }) {
  return (
    <div className="rounded-xl bg-muted/20 px-4 py-3 flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className={cn(
        "font-display font-extrabold",
        tone === "success" && "text-green-700",
        tone === "warning" && "text-amber-700",
        tone === "danger" && "text-red-700",
      )}>
        {value}
      </span>
    </div>
  );
}
