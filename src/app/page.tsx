"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, CheckCircle2, PieChart, Globe } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useApiData } from "@/lib/api/client";

type OverviewResponse = {
  stats: { label: string; value: string }[];
  campaigns: {
    id: string;
    title: string;
    location: string;
    progress: number;
    goal: string;
    raised: string;
    image: string;
  }[];
  allocationBreakdown: { label: string; value: number }[];
};

export default function LandingPage() {
  const { data, isLoading } = useApiData<OverviewResponse>("/api/public/overview");

  const stats = data?.stats ?? [];
  const campaigns = data?.campaigns ?? [];
  const allocationBreakdown = data?.allocationBreakdown ?? [];

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow">
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-accent/5 to-transparent -z-10" />
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-bold tracking-wide uppercase">
                <ShieldCheck size={16} />
                Radical Transparency in Stewardship
              </div>
              <h1 className="text-6xl md:text-7xl font-display font-extrabold tracking-tighter leading-[0.9]">
                The Digital <br />
                <span className="text-accent">Steward.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Impact Lodger empowers Lions International to manage global impact with modern efficiency, absolute transparency, and human-centric design.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/donate" className="btn-primary flex items-center gap-2">
                  Fund the Mission <ArrowRight size={20} />
                </Link>
                <Link href="/campaigns" className="btn-outline">
                  Explore Campaigns
                </Link>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=1200"
                  alt="Lions Impact"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-6 bg-white border-y border-muted">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              {(isLoading ? Array.from({ length: 4 }) : stats).map((_, index) => (
                <motion.div key={stats[index]?.label || index} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="space-y-2">
                  <div className="flex items-center gap-2 text-accent">
                    <Globe size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">{stats[index]?.label || "Loading"}</span>
                  </div>
                  <p className="text-4xl font-display font-extrabold tracking-tight">{stats[index]?.value || "..."}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="space-y-4">
                <p className="text-accent font-bold uppercase tracking-widest text-xs">Active Stewardship</p>
                <h2 className="text-5xl font-display font-extrabold tracking-tighter">Current Missions.</h2>
              </div>
              <Link href="/campaigns" className="text-sm font-bold flex items-center gap-2 hover:text-accent transition-colors">
                View All Missions <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {campaigns.map((campaign, index) => (
                <motion.div key={campaign.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} viewport={{ once: true }} className="group no-line-card flex flex-col h-full">
                  <div className="aspect-video rounded-xl overflow-hidden mb-6 relative">
                    <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest">{campaign.location}</div>
                  </div>
                  <h3 className="text-xl font-display font-bold mb-2">{campaign.title}</h3>
                  <div className="mt-auto space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-muted-foreground uppercase tracking-widest">Progress</span>
                        <span>{campaign.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} whileInView={{ width: `${campaign.progress}%` }} transition={{ duration: 1, delay: 0.5 }} viewport={{ once: true }} className="h-full bg-accent" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Raised</p>
                        <p className="font-bold">{campaign.raised}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Goal</p>
                        <p className="font-bold">{campaign.goal}</p>
                      </div>
                    </div>
                    <Link href={`/campaigns/${campaign.id}`} className="btn-primary w-full text-center py-2 text-sm">
                      Fund Mission
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-primary text-primary-foreground overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">
                Every Dollar <br />
                Accounted For.
              </h2>
              <p className="text-lg text-primary-foreground/70 leading-relaxed">
                We believe trust is earned through visibility. Impact Lodger provides a real-time breakdown of fund allocation, operational costs, and direct impact metrics.
              </p>
              <ul className="space-y-4">
                {[
                  "Real-time budget tracking",
                  "Verified expense reporting",
                  "Direct impact verification",
                  "Webhook-backed payment reconciliation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                      <CheckCircle2 size={12} />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass bg-white/10 border-white/10 p-8 rounded-3xl relative z-10">
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-display font-bold text-xl">Fund Allocation</h4>
                <PieChart className="text-blue-500" />
              </div>
              <div className="space-y-6">
                {allocationBreakdown.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.value}%` }} transition={{ duration: 1 }} viewport={{ once: true }} className={cn("h-full", item.label === "Direct Aid" ? "bg-blue-600" : "bg-white/40")} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
