"use client";

import VolunteerSidebar from "@/components/VolunteerSidebar";
import { useApiData } from "@/lib/api/client";

type VolunteerSettingsResponse = {
  profile: {
    fullName: string;
    email: string;
    hoursLogged: number;
    impactScore: number;
    certifications: number;
  };
  skills: string[];
  account: {
    role: string;
    userId: string;
    userEmail: string;
  };
};

export default function VolunteerSettingsPage() {
  const { data, isLoading, error } = useApiData<VolunteerSettingsResponse>("/api/volunteer/settings");

  return (
    <div className="flex min-h-screen bg-background">
      <VolunteerSidebar />
      <main className="flex-grow p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Your volunteer profile and account metadata.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="no-line-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Profile</h2>
            <Row label="Full Name" value={data?.profile.fullName || "—"} />
            <Row label="Email" value={data?.profile.email || "—"} />
            <Row label="Hours Logged" value={String(data?.profile.hoursLogged || 0)} />
            <Row label="Impact Score" value={String(data?.profile.impactScore || 0)} />
            <Row label="Certifications" value={String(data?.profile.certifications || 0)} />
          </section>

          <section className="no-line-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Account</h2>
            <Row label="Role" value={data?.account.role || "—"} />
            <Row label="Auth Email" value={data?.account.userEmail || "—"} />
            <Row label="User ID" value={data?.account.userId || "—"} mono />
          </section>
        </div>

        <section className="no-line-card p-6 space-y-4">
          <h2 className="font-display font-bold text-xl">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {(data?.skills || []).map((skill) => (
              <span key={skill} className="rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                {skill.replaceAll("-", " ")}
              </span>
            ))}
            {!isLoading && (data?.skills || []).length === 0 && <p className="text-sm text-muted-foreground">No skills tagged.</p>}
          </div>
        </section>

        {isLoading && <p className="text-sm text-muted-foreground">Loading settings...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/20 px-4 py-3 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={mono ? "text-xs font-mono text-primary truncate" : "text-sm font-semibold text-primary"}>{value}</p>
    </div>
  );
}
