"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { Eye, Globe } from "lucide-react";
import { useApiData } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string;
  title: string;
  location: string;
  status: string;
  progress: number;
  goal: string;
  raised: string;
  category: string;
};

type Response = { campaigns: Campaign[] };

export default function AdminCampaignsPage() {
  const { data, isLoading } = useApiData<Response>("/api/admin/campaigns");

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-grow p-4 pt-20 sm:p-6 sm:pt-24 lg:p-8 lg:pt-8 space-y-6 lg:space-y-8">
        <header>
          <h1 className="text-3xl font-display font-extrabold tracking-tight">Campaign Management</h1>
          <p className="text-sm text-muted-foreground">Create, monitor, and manage global stewardship missions.</p>
        </header>

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
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center">Loading campaigns...</td></tr>
                ) : (
                  (data?.campaigns || []).map((campaign) => (
                    <tr key={campaign.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-accent/10 text-accent rounded-lg flex items-center justify-center"><Globe size={20} /></div>
                          <div>
                            <p className="text-sm font-bold">{campaign.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{campaign.location} • {campaign.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className={cn("px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", campaign.status === "Active" ? "bg-green-50 text-green-600" : campaign.status === "Urgent" ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground")}>{campaign.status}</span></td>
                      <td className="px-6 py-4">
                        <div className="w-32 space-y-1.5">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent" style={{ width: `${campaign.progress}%` }} /></div>
                          <p className="text-[10px] font-bold">{campaign.progress}%</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right"><p className="text-sm font-display font-extrabold">{campaign.raised}</p><p className="text-[10px] text-muted-foreground">of {campaign.goal}</p></td>
                      <td className="px-6 py-4 text-center"><button className="p-2 text-muted-foreground hover:text-accent transition-colors" title="View Details"><Eye size={16} /></button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
