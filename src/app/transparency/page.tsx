"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Lock,
  Download,
  ExternalLink,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";

const ledgerEntries = [
  { id: "TX-9842", date: "Oct 28, 2025", campaign: "Clean Water Initiative", hub: "Kenya", amount: "$1,250.00", type: "Infrastructure", status: "Verified" },
  { id: "TX-9841", date: "Oct 27, 2025", campaign: "Emergency Relief", hub: "Vietnam", amount: "$2,400.00", type: "Logistics", status: "Verified" },
  { id: "TX-9840", date: "Oct 26, 2025", campaign: "Youth Education Fund", hub: "Peru", amount: "$850.00", type: "Scholarship", status: "Verified" },
  { id: "TX-9839", date: "Oct 25, 2025", campaign: "Clean Water Initiative", hub: "Kenya", amount: "$450.00", type: "Maintenance", status: "Verified" },
  { id: "TX-9838", date: "Oct 24, 2025", campaign: "Reforestation Project", hub: "Brazil", amount: "$1,100.00", type: "Seedlings", status: "Verified" },
  { id: "TX-9837", date: "Oct 23, 2025", campaign: "Mobile Health Clinic", hub: "India", amount: "$2,200.00", type: "Medical Supplies", status: "Verified" },
  { id: "TX-9836", date: "Oct 22, 2025", campaign: "Clean Water Initiative", hub: "Kenya", amount: "$3,000.00", type: "Borehole Drilling", status: "Verified" },
];

const auditReports = [
  { id: "AUD-2025-Q3", title: "Q3 2025 Stewardship Audit", date: "Oct 05, 2025", auditor: "Global Transparency Group", status: "Passed" },
  { id: "AUD-2025-Q2", title: "Q2 2025 Stewardship Audit", date: "Jul 08, 2025", auditor: "Global Transparency Group", status: "Passed" },
  { id: "AUD-2025-Q1", title: "Q1 2025 Stewardship Audit", date: "Apr 12, 2025", auditor: "Global Transparency Group", status: "Passed" },
];

export default function TransparencyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <p className="text-accent font-bold uppercase tracking-widest text-xs">Radical Transparency</p>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tighter leading-none">
              The Public <br />
              <span className="text-accent">Ledger.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              LNMS provides a real-time, immutable record of every transaction and impact verification. Trust is built through visibility.
            </p>
          </div>

          {/* Verification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Verified Transactions", value: "15,240", icon: ShieldCheck },
              { label: "Audit Pass Rate", value: "100%", icon: CheckCircle2 },
              { label: "Real-time Sync", value: "Active", icon: Clock },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="no-line-card p-8 text-center space-y-4"
              >
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto">
                  <stat.icon size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                  <p className="text-4xl font-display font-extrabold tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Public Ledger Table */}
          <section className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-3xl font-display font-extrabold tracking-tight">Transaction Ledger</h2>
                <p className="text-sm text-muted-foreground">Immutable record of all stewardship allocations.</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <input 
                    type="text" 
                    placeholder="Search ledger..." 
                    className="pl-9 pr-4 py-2 bg-muted/30 border-none rounded-xl text-sm focus:ring-2 focus:ring-accent/20 transition-all w-64"
                  />
                </div>
                <button className="p-2 bg-white border border-muted rounded-xl text-muted-foreground hover:text-primary transition-colors">
                  <Filter size={18} />
                </button>
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
                    {ledgerEntries.map((entry) => (
                      <tr key={entry.id} className="group hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono font-bold text-muted-foreground">{entry.id}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{entry.date}</td>
                        <td className="px-6 py-4 text-sm font-bold">{entry.campaign}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{entry.hub}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-muted rounded-lg text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-display font-extrabold text-right">{entry.amount}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            <CheckCircle2 size={10} /> {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-muted/10 text-center">
                <button className="text-xs font-bold text-accent uppercase tracking-widest hover:underline">
                  Load More Transactions
                </button>
              </div>
            </div>
          </section>

          {/* Audit Reports */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-3xl font-display font-extrabold tracking-tight">Audit Reports</h2>
              <p className="text-muted-foreground leading-relaxed">
                External audits are conducted every quarter to verify the integrity of our digital stewardship system and fund allocation.
              </p>
              <div className="p-6 bg-primary text-primary-foreground rounded-3xl space-y-4">
                <div className="flex items-center gap-4">
                  <Lock className="text-accent" />
                  <h4 className="font-display font-bold">End-to-End Security</h4>
                </div>
                <p className="text-xs text-primary-foreground/70 leading-relaxed">
                  Our ledger is cryptographically signed and distributed across regional nodes to prevent tampering.
                </p>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {auditReports.map((report) => (
                <div key={report.id} className="no-line-card p-6 flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:text-white transition-colors">
                      <FileText size={24} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-display font-bold text-lg">{report.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        <span>{report.date}</span>
                        <div className="w-1 h-1 bg-muted rounded-full" />
                        <span>Auditor: {report.auditor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {report.status}
                    </span>
                    <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                      <Download size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Blockchain Verification Placeholder */}
          <section className="no-line-card p-12 bg-accent text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <ShieldCheck size={400} className="translate-x-1/4 translate-y-1/4" />
            </div>
            <div className="max-w-2xl space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                <ExternalLink size={12} />
                Blockchain Verified
              </div>
              <h2 className="text-5xl font-display font-extrabold tracking-tighter leading-none">
                Immutable <br />
                Stewardship.
              </h2>
              <p className="text-lg text-white/80 leading-relaxed">
                Every transaction on LNMS is mirrored to a private blockchain network, ensuring that once a dollar is allocated, its record can never be altered or deleted.
              </p>
              <div className="flex gap-4">
                <button className="btn-primary bg-white text-accent border-none py-3 px-8">
                  Explore Network
                </button>
                <button className="btn-outline border-white text-white hover:bg-white hover:text-accent py-3 px-8">
                  Technical Specs
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
