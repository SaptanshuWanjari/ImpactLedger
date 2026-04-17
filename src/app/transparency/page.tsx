"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ShieldCheck, Search, CheckCircle2, Clock, FileText, Download } from "lucide-react";
import { useApiData } from "@/lib/api/client";

type LedgerEntry = {
  id: string;
  date: string;
  campaign: string;
  hub: string;
  amount: string;
  type: string;
  status: string;
};

type TransparencyResponse = {
  ledger: LedgerEntry[];
};

export default function TransparencyPage() {
  const { data, isLoading } = useApiData<TransparencyResponse>("/api/transparency?limit=40");
  const ledgerEntries = data?.ledger || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="grow pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-20">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <p className="text-accent font-bold uppercase tracking-widest text-xs">Radical Transparency</p>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-extrabold tracking-tighter leading-none">The Public <span className="text-accent">Ledger.</span></h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { label: "Verified Transactions", value: String(ledgerEntries.length), icon: ShieldCheck },
              { label: "Audit Pass Rate", value: "100%", icon: CheckCircle2 },
              { label: "Real-time Sync", value: "Active", icon: Clock },
            ].map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="no-line-card p-6 sm:p-8 text-center space-y-4">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto"><stat.icon size={24} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <section className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-3xl font-display font-extrabold tracking-tight">Transaction Ledger</h2>
                <p className="text-sm text-muted-foreground">Immutable record of stewardship allocations and usage.</p>
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input type="text" disabled placeholder="Search will be enabled with server filtering" className="w-full sm:w-72 pl-9 pr-4 py-2 bg-muted/30 border-none rounded-xl text-sm" />
              </div>
            </div>

            <div className="no-line-card p-0 overflow-hidden border border-muted">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/30 border-b border-muted">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Campaign</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hub</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {isLoading ? (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">Loading ledger...</td></tr>
                    ) : (
                      ledgerEntries.map((entry) => (
                        <tr key={entry.id} className="group hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono font-bold text-muted-foreground">{entry.id}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{entry.date}</td>
                          <td className="px-6 py-4 text-sm font-bold">{entry.campaign}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{entry.hub}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{entry.type}</td>
                          <td className="px-6 py-4 text-sm font-display font-extrabold text-right">{entry.amount}</td>
                          <td className="px-6 py-4 text-center"><span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 size={10} /> {entry.status}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
