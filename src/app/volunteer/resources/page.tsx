"use client";

import Link from "next/link";
import VolunteerSidebar from "@/components/VolunteerSidebar";
import { useApiData } from "@/lib/api/client";
import { BookOpen, ClipboardList, ArrowRight } from "lucide-react";

type ResourceItem = {
  id: string;
  title: string;
  kind: string;
  audience: string;
  description: string;
  ctaLabel: string;
  href: string;
};

type Assignment = {
  id: string;
  title: string;
  location: string;
  status: string;
  type: string;
  deadline: string;
};

type VolunteerResourcesResponse = {
  volunteerName: string;
  assignments: Assignment[];
  resources: ResourceItem[];
};

export default function VolunteerResourcesPage() {
  const { data, isLoading, error } = useApiData<VolunteerResourcesResponse>("/api/volunteer/resources");

  return (
    <div className="flex min-h-screen bg-background">
      <VolunteerSidebar />
      <main className="flex-grow p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Resources</h1>
          <p className="text-sm text-muted-foreground">Operational guides and references for {data?.volunteerName || "your"} current missions.</p>
        </header>

        <section className="no-line-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl">Your Active Assignment Context</h2>
            <ClipboardList size={18} className="text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {(data?.assignments || []).slice(0, 5).map((assignment) => (
              <div key={assignment.id} className="rounded-xl bg-muted/20 px-4 py-3">
                <p className="text-sm font-bold">{assignment.title}</p>
                <p className="text-xs text-muted-foreground">{assignment.type} • {assignment.location} • Due {assignment.deadline}</p>
              </div>
            ))}
            {!isLoading && (data?.assignments || []).length === 0 && <p className="text-sm text-muted-foreground">No assignments found.</p>}
          </div>
        </section>

        <section className="no-line-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl">Guides and References</h2>
            <BookOpen size={18} className="text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {(data?.resources || []).map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-muted p-5 space-y-3 bg-white">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <span className="rounded-full bg-green-50 text-green-700 px-2 py-1">{resource.kind}</span>
                  <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{resource.audience}</span>
                </div>
                <h3 className="font-display font-bold text-lg">{resource.title}</h3>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
                <Link href={resource.href} className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800">
                  {resource.ctaLabel}
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {isLoading && <p className="text-sm text-muted-foreground">Loading resources...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </main>
    </div>
  );
}
