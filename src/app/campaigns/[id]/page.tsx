"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Globe, 
  Heart, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Clock, 
  PieChart,
  Share2,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const campaignData = {
  id: 1,
  title: "Clean Water Initiative",
  location: "Kenya",
  progress: 75,
  goal: "$50,000",
  raised: "$37,500",
  image: "https://images.unsplash.com/photo-1541516166103-3ad240173934?auto=format&fit=crop&q=80&w=1200",
  category: "Health & Sanitation",
  urgency: "High",
  description: "Providing sustainable clean water access to over 500 families in rural Kenya through solar-powered borehole systems and community-led maintenance programs. This project is a multi-phase initiative that includes infrastructure development, sanitation training, and long-term stewardship monitoring.",
  metrics: [
    { label: "Families Served", value: "500+", icon: Users },
    { label: "Boreholes Built", value: "3/4", icon: Globe },
    { label: "Water Quality", value: "100%", icon: ShieldCheck },
    { label: "Stewardship", value: "Verified", icon: ShieldCheck },
  ],
  budget: [
    { label: "Infrastructure", value: 60, color: "bg-accent" },
    { label: "Sanitation Training", value: 25, color: "bg-primary" },
    { label: "Operational Support", value: 10, color: "bg-muted-foreground" },
    { label: "Maintenance Fund", value: 5, color: "bg-muted" },
  ],
  updates: [
    { date: "Oct 20, 2025", title: "Phase 3 Completion", content: "The third solar-powered borehole is now operational, providing water to 150 additional families.", image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=400" },
    { date: "Sep 15, 2025", title: "Community Training Session", content: "Our stewards conducted a 3-day sanitation and maintenance workshop for local community leaders.", image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=400" },
    { date: "Aug 01, 2025", title: "Project Launch", content: "Initial site surveys and community engagement sessions completed. Phase 1 construction begins.", image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=400" },
  ],
};

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id;

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Back Button */}
          <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Back to Missions
          </Link>

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {campaignData.category}
                </div>
                <div className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                  {campaignData.urgency} Urgency
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">
                {campaignData.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe size={18} />
                <span className="font-medium">{campaignData.location}</span>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {campaignData.description}
              </p>

              {/* Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-muted">
                {campaignData.metrics.map((metric) => (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex items-center gap-2 text-accent">
                      <metric.icon size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{metric.label}</span>
                    </div>
                    <p className="text-xl font-display font-extrabold">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Financial Stewardship */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-xl">Financial Stewardship</h3>
                  <PieChart className="text-muted-foreground" size={18} />
                </div>
                <div className="space-y-4">
                  <div className="flex h-4 bg-muted rounded-full overflow-hidden">
                    {campaignData.budget.map((item) => (
                      <div 
                        key={item.label} 
                        className={cn("h-full", item.color)} 
                        style={{ width: `${item.value}%` }}
                        title={`${item.label}: ${item.value}%`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {campaignData.budget.map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded-full", item.color)} />
                        <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                        <span className="text-xs font-bold ml-auto">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Sticky Donation Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:sticky lg:top-32 space-y-6"
            >
              <div className="no-line-card p-8 bg-white shadow-2xl border border-muted ring-1 ring-black/5">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-muted-foreground uppercase tracking-widest">Mission Progress</span>
                      <span>{campaignData.progress}%</span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${campaignData.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-accent"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Raised</p>
                        <p className="text-2xl font-display font-extrabold">{campaignData.raised}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest">Goal</p>
                        <p className="text-2xl font-display font-extrabold">{campaignData.goal}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {["$25", "$50", "$100"].map((amount) => (
                        <button key={amount} className="py-3 bg-muted rounded-xl font-bold hover:bg-primary hover:text-white transition-all">
                          {amount}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                      <input 
                        type="number" 
                        placeholder="Custom Amount" 
                        className="w-full pl-8 pr-4 py-3 bg-muted rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                      />
                    </div>
                    <Link href="/donate" className="btn-primary w-full text-center py-4 text-lg flex items-center justify-center gap-2">
                      Fund the Mission <Heart size={20} fill="currentColor" />
                    </Link>
                  </div>

                  <div className="pt-6 border-t border-muted flex items-center justify-between text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-green-500" />
                      <span>100% Transparency Verified</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button className="hover:text-primary"><Share2 size={16} /></button>
                      <button className="hover:text-primary"><MessageSquare size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Impact Verification Card */}
              <div className="no-line-card p-6 bg-primary text-primary-foreground">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white">
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="font-display font-bold text-lg">Verified Stewardship</h4>
                </div>
                <p className="text-sm text-primary-foreground/70 leading-relaxed mb-4">
                  Every dollar allocated to this mission is tracked and verified by our regional stewards. View the real-time ledger for absolute transparency.
                </p>
                <Link href="/transparency" className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2 hover:underline">
                  View Mission Ledger <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Campaign Updates Timeline */}
          <section className="space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-display font-extrabold tracking-tighter">Mission Updates.</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={18} />
                <span className="text-sm font-medium">Last updated 2 days ago</span>
              </div>
            </div>

            <div className="space-y-12 relative">
              <div className="absolute left-6 top-4 bottom-4 w-px bg-muted hidden md:block" />
              {campaignData.updates.map((update, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="relative md:pl-20"
                >
                  <div className="absolute left-4 top-2 w-4 h-4 bg-accent rounded-full border-4 border-white shadow-sm hidden md:block" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center no-line-card p-6 md:p-8">
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-accent uppercase tracking-widest">{update.date}</span>
                        <div className="w-1 h-1 bg-muted rounded-full" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Verified Update</span>
                      </div>
                      <h3 className="text-2xl font-display font-bold">{update.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{update.content}</p>
                      <button className="text-sm font-bold flex items-center gap-2 hover:text-accent transition-colors">
                        Read Full Update <ArrowRight size={16} />
                      </button>
                    </div>
                    <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                      <img
                        src={update.image}
                        alt={update.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
