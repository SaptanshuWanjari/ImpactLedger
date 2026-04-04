"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, ShieldCheck, Clock, PieChart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApiData } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type CampaignDetail = {
  id: string;
  title: string;
  location: string;
  progress: number;
  goal: string;
  raised: string;
  image: string;
  category: string;
  urgency: string;
  description: string;
  updates: { id: string; title: string; content: string; image: string; date: string }[];
};

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: campaign, isLoading } = useApiData<CampaignDetail>(`/api/campaigns/${params.id}`);

  if (isLoading || !campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-32 px-6">
          <div className="max-w-7xl mx-auto h-96 no-line-card animate-pulse bg-muted/40" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <Link href="/campaigns" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Back to Missions
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 bg-accent/10 text-accent rounded-full text-[10px] font-bold uppercase tracking-widest">{campaign.category}</div>
                <div className="px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">{campaign.urgency} Urgency</div>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">{campaign.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe size={18} />
                <span className="font-medium">{campaign.location}</span>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed">{campaign.description}</p>

              <div className="space-y-4">
                <div className="flex h-4 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full bg-accent")} style={{ width: `${campaign.progress}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-bold">{campaign.raised} raised</span>
                  <span className="text-sm text-muted-foreground">Goal {campaign.goal}</span>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:sticky lg:top-32 space-y-6">
              <div className="no-line-card p-8 bg-white shadow-2xl border border-muted ring-1 ring-black/5">
                <div className="space-y-6">
                  <img src={campaign.image} alt={campaign.title} className="w-full aspect-video object-cover rounded-xl" referrerPolicy="no-referrer" />
                  <Link href={`/donate?campaignId=${campaign.id}`} className="btn-primary w-full text-center py-4 text-lg flex items-center justify-center gap-2">
                    Fund the Mission <ArrowRight size={20} />
                  </Link>
                </div>
              </div>

              <div className="no-line-card p-6 bg-primary text-primary-foreground">
                <div className="flex items-center gap-4 mb-4">
                  <ShieldCheck size={24} />
                  <h4 className="font-display font-bold text-lg">Verified Stewardship</h4>
                </div>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">
                  Every dollar allocated to this mission is tracked and verified by regional stewards.
                </p>
              </div>
            </motion.div>
          </div>

          <section className="space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-4xl font-display font-extrabold tracking-tighter">Mission Updates.</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={18} />
                <span className="text-sm font-medium">Live from Supabase</span>
              </div>
            </div>

            <div className="space-y-12 relative">
              {campaign.updates.map((update) => (
                <motion.div key={update.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center no-line-card p-6 md:p-8">
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-accent uppercase tracking-widest">{update.date}</span>
                        <div className="w-1 h-1 bg-muted rounded-full" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Verified Update</span>
                      </div>
                      <h3 className="text-2xl font-display font-bold">{update.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{update.content}</p>
                    </div>
                    <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
                      <img src={update.image} alt={update.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
