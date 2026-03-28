"use client";

import DonorSidebar from "@/components/DonorSidebar";
import { Plus, Search, Download, TrendingUp, Calendar, CheckCircle2, Receipt } from "lucide-react";
import Link from "next/link";
import { useApiData } from "@/lib/api/client";

type Donation = {
  id: string;
  date: string;
  campaign: string;
  amount: string;
  method: string;
  status: string;
  impact: string;
};

type DonationsResponse = {
  donations: Donation[];
};

export default function DonorDonationsPage() {
  const { data, isLoading } = useApiData<DonationsResponse>("/api/donor/donations?donorEmail=john@example.com");
  const donations = data?.donations || [];

  return (
    <div className="flex min-h-screen bg-background">
      <DonorSidebar />
      <main className="flex-grow p-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-primary">Donation History</h1>
            <p className="text-sm text-muted-foreground">Track your stewardship and download receipts.</p>
          </div>
          <Link href="/donate" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
            <Plus size={18} /> New Donation
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="no-line-card p-6 space-y-2"><TrendingUp size={20} className="text-accent" /><p className="text-xs uppercase">Total Stewardship</p><p className="text-2xl font-display font-extrabold">{donations.reduce((sum, d) => sum + Number(d.amount.replace(/[^0-9.]/g, "")), 0).toLocaleString("en-US", { style: "currency", currency: "USD" })}</p></div>
          <div className="no-line-card p-6 space-y-2"><CheckCircle2 size={20} className="text-green-600" /><p className="text-xs uppercase">Completed</p><p className="text-2xl font-display font-extrabold">{donations.length}</p></div>
          <div className="no-line-card p-6 space-y-2"><Calendar size={20} className="text-blue-600" /><p className="text-xs uppercase">Next Donation</p><p className="text-2xl font-display font-extrabold">TBD</p></div>
          <div className="no-line-card p-6 space-y-2"><Receipt size={20} className="text-purple-600" /><p className="text-xs uppercase">Tax Receipts</p><p className="text-2xl font-display font-extrabold">Ready</p></div>
        </div>

        <div className="no-line-card p-0 overflow-hidden border border-muted">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/30 border-b border-muted">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center">Loading...</td></tr>
                ) : (
                  donations.map((donation) => (
                    <tr key={donation.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono font-bold text-muted-foreground">{donation.id}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{donation.date}</td>
                      <td className="px-6 py-4"><p className="text-sm font-bold">{donation.campaign}</p><p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{donation.method}</p></td>
                      <td className="px-6 py-4 text-right"><p className="text-sm font-display font-extrabold text-primary">{donation.amount}</p></td>
                      <td className="px-6 py-4 text-center"><button className="p-2 text-muted-foreground hover:text-accent transition-colors" title="Download Receipt"><Download size={18} /></button></td>
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
