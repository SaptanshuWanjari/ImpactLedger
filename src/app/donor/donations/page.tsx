"use client";

import DonorSidebar from "@/components/DonorSidebar";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Receipt,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const donations = [
  { id: "DON-9842", date: "Oct 28, 2025", campaign: "Clean Water Initiative", amount: "$250.00", method: "Visa •••• 4242", status: "Completed", impact: "5 people for 1 year" },
  { id: "DON-9841", date: "Oct 15, 2025", campaign: "Emergency Relief", amount: "$1,000.00", method: "Bank Transfer", status: "Completed", impact: "100 emergency kits" },
  { id: "DON-9840", date: "Sep 22, 2025", campaign: "Youth Education Fund", amount: "$150.00", method: "Visa •••• 4242", status: "Completed", impact: "2 months of schooling" },
  { id: "DON-9839", date: "Sep 05, 2025", campaign: "Clean Water Initiative", amount: "$250.00", method: "Visa •••• 4242", status: "Completed", impact: "5 people for 1 year" },
  { id: "DON-9838", date: "Aug 12, 2025", campaign: "Reforestation Project", amount: "$500.00", method: "Apple Pay", status: "Completed", impact: "50 trees planted" },
];

export default function DonorDonationsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <DonorSidebar />
      
      <main className="flex-grow p-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-extrabold tracking-tight text-primary">Donation History</h1>
            <p className="text-sm text-muted-foreground">Track your stewardship and download official tax receipts.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/donate" className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
              <Plus size={18} /> New Donation
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="no-line-card p-6 space-y-4">
            <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Stewardship</p>
              <p className="text-2xl font-display font-extrabold">$2,150.00</p>
            </div>
          </div>
          <div className="no-line-card p-6 space-y-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-display font-extrabold">2</p>
            </div>
          </div>
          <div className="no-line-card p-6 space-y-4">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next Donation</p>
              <p className="text-2xl font-display font-extrabold">Nov 15</p>
            </div>
          </div>
          <div className="no-line-card p-6 space-y-4">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Receipt size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tax Receipts</p>
              <p className="text-2xl font-display font-extrabold">2025 Ready</p>
            </div>
          </div>
        </div>

        {/* Donations List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-display font-extrabold tracking-tight">Recent Activity</h2>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                <input 
                  type="text" 
                  placeholder="Search donations..." 
                  className="pl-9 pr-4 py-2 bg-muted/30 border-none rounded-xl text-xs focus:ring-2 focus:ring-accent/20 transition-all w-64"
                />
              </div>
              <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
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
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Impact</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {donations.map((donation) => (
                    <tr key={donation.id} className="group hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono font-bold text-muted-foreground">{donation.id}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{donation.date}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold">{donation.campaign}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{donation.method}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-accent/5 text-accent rounded-lg text-[10px] font-bold uppercase tracking-widest">
                          <CheckCircle2 size={10} /> {donation.impact}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-display font-extrabold text-primary">{donation.amount}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 text-muted-foreground hover:text-accent transition-colors" title="Download Receipt">
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recurring Donations */}
        <section className="space-y-4">
          <h2 className="text-xl font-display font-extrabold tracking-tight">Active Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { campaign: "Clean Water Initiative", amount: "$250.00", frequency: "Monthly", next: "Nov 15, 2025" },
              { campaign: "Youth Education Fund", amount: "$150.00", frequency: "Monthly", next: "Dec 02, 2025" },
            ].map((sub) => (
              <div key={sub.campaign} className="no-line-card p-6 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                    <Calendar size={24} />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-display font-bold text-lg">{sub.campaign}</h4>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                      {sub.amount} • {sub.frequency}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Next Charge</p>
                  <p className="text-sm font-bold">{sub.next}</p>
                  <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:underline">Manage</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
