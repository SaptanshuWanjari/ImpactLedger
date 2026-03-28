"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  Globe, 
  Heart, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  PieChart
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";

const impactData = [
  { year: "2020", impact: 1.2 },
  { year: "2021", impact: 1.8 },
  { year: "2022", impact: 2.5 },
  { year: "2023", impact: 3.1 },
  { year: "2024", impact: 4.2 },
];

const regionalImpact = [
  { region: "Africa", value: 45 },
  { region: "Asia", value: 30 },
  { region: "Americas", value: 15 },
  { region: "Europe", value: 10 },
];

export default function ImpactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <p className="text-accent font-bold uppercase tracking-widest text-xs">Radical Transparency</p>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tighter leading-none">
              Our Global <br />
              <span className="text-accent">Impact.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Impact Lodger provides a real-time, verified view of how every dollar is allocated and the direct impact it creates across the globe.
            </p>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { label: "Total Funds Allocated", value: "$4.2M", icon: TrendingUp },
              { label: "Lives Impacted", value: "1.2M", icon: Heart },
              { label: "Active Missions", value: "156", icon: Globe },
              { label: "Verified Stewards", value: "12.5K", icon: ShieldCheck },
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

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="no-line-card p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold">Stewardship Growth</h3>
                <TrendingUp className="text-accent" />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={impactData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#737373" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#737373" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="impact" stroke="#00338D" strokeWidth={4} dot={{ r: 6, fill: "#00338D" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground italic text-center">
                * Figures in Millions USD. Audited annually by global standards.
              </p>
            </div>

            <div className="no-line-card p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-display font-bold">Regional Allocation</h3>
                <Globe className="text-accent" />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalImpact} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="region" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: "bold" }} width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00338D" radius={[0, 10, 10, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {regionalImpact.map((item) => (
                  <div key={item.region} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                    <span className="text-xs font-bold uppercase tracking-widest">{item.region}</span>
                    <span className="text-lg font-display font-extrabold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transparency Commitment */}
          <section className="py-24 px-8 bg-primary text-primary-foreground rounded-[3rem] overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
              <ShieldCheck size={500} className="translate-x-1/4 translate-y-1/4" />
            </div>
            <div className="max-w-3xl space-y-8 relative z-10">
              <h2 className="text-5xl font-display font-extrabold tracking-tighter leading-none">
                The Impact Lodger <br />
                Transparency Promise.
              </h2>
              <p className="text-xl text-primary-foreground/70 leading-relaxed">
                We believe that every donor is a steward of change. Our platform is built on the principle that radical transparency is the only way to build lasting trust in global humanitarian work.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { title: "Real-time Ledger", desc: "Every transaction is logged and visible in our public stewardship ledger." },
                  { title: "Verified Impact", desc: "Field reports are verified by multiple regional stewards before being logged." },
                  { title: "Zero Leakage", desc: "Our operational costs are capped and funded separately to ensure 100% aid delivery." },
                  { title: "Audited Monthly", desc: "External auditors review our digital stewardship logs every 30 days." },
                ].map((item) => (
                  <div key={item.title} className="space-y-2">
                    <div className="flex items-center gap-2 text-accent">
                      <CheckCircle2 size={18} />
                      <h4 className="font-display font-bold">{item.title}</h4>
                    </div>
                    <p className="text-sm text-primary-foreground/60 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center space-y-8 py-20">
            <h2 className="text-5xl font-display font-extrabold tracking-tighter">
              Ready to fund the <br />
              <span className="text-accent">next mission?</span>
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/donate" className="btn-primary px-10 py-4 text-lg">
                Donate Now
              </Link>
              <Link href="/campaigns" className="btn-outline px-10 py-4 text-lg">
                Explore Missions
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
