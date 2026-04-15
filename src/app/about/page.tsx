"use client";

import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { 
  ShieldCheck, 
  Globe, 
  Users, 
  CheckCircle2, 
  Zap, 
  Target,
  Award
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="grow pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-20 sm:space-y-32">
          {/* Hero Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-3 bg-accent/10 text-accent rounded-full text-[14px] font-bold uppercase tracking-widest">
                <ShieldCheck size={14} />
                The Digital Steward
              </div>
              <h1 className="text-4xl sm:text-6xl md:text-8xl font-display font-extrabold tracking-tighter leading-none">
                Trust is <br />
                <span className="text-accent">Engineered.</span>
              </h1>
              <p className="text-base sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Impact Ledger (Lions NGO Management System) is a radical departure from traditional charity. We replace vague promises with immutable data and real-time verification.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/transparency" className="btn-primary w-full sm:w-auto text-center py-4 px-8">
                  Explore the Ledger
                </Link>
                <Link href="/campaigns" className="btn-outline w-full sm:w-auto text-center py-4 px-8">
                  View Missions
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-muted rounded-[40px] overflow-hidden">
                <Image 
                  src="/hero.jpg" 
                  height={600}
                  width={600}
                  alt="Lions NGO Impact" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="mt-6 md:mt-0 md:absolute md:-bottom-10 md:-left-10 p-6 sm:p-8 bg-white rounded-3xl shadow-2xl space-y-4 max-w-xs border border-muted">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                  <Zap size={24} />
                </div>
                <p className="text-sm font-bold leading-tight">
                  Real-time impact tracking for every rupee donated.
                </p>
              </div>
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="no-line-card p-8 sm:p-12 space-y-6 bg-primary text-primary-foreground">
              <div className="w-12 h-12 bg-accent text-white rounded-2xl flex items-center justify-center">
                <Target size={24} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">Our Mission</h2>
              <p className="text-lg text-primary-foreground/70 leading-relaxed">
                To build the world's most transparent NGO infrastructure, ensuring that every resource allocated reaches its intended destination with verifiable proof of impact.
              </p>
            </div>
            <div className="no-line-card p-8 sm:p-12 space-y-6 border border-muted">
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                <Award size={24} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">Our Vision</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A world where the "trust gap" in philanthropy is closed forever through technology, empowering donors and volunteers to solve global challenges with absolute confidence.
              </p>
            </div>
          </section>

          {/* Core Values */}
          <section className="space-y-16">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-6xl font-display font-extrabold tracking-tight">The Impact Ledger Principles.</h2>
              <p className="text-muted-foreground">Our foundation is built on four non-negotiable pillars.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Radical Transparency", desc: "Every transaction is public, immutable, and searchable in real-time.", icon: ShieldCheck },
                { title: "Global Stewardship", desc: "We operate across borders with a unified digital command center.", icon: Globe },
                { title: "Human Centric", desc: "Technology serves the people, not the other way around.", icon: Users },
                { title: "Verifiable Impact", desc: "No impact report is published without cryptographic proof from the field.", icon: CheckCircle2 },
              ].map((value, index) => (
                <div key={value.title} className="space-y-6 p-8 no-line-card border border-muted group hover:border-accent transition-all">
                  <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:text-white transition-all">
                    <value.icon size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-display font-extrabold tracking-tight">{value.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Team Section Placeholder */}
          {/* <section className="space-y-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight">The Stewards.</h2>
                <p className="text-muted-foreground max-w-xl">Meet the engineers, humanitarians, and visionaries building the future of Impact Ledger.</p>
              </div>
              <button className="btn-outline py-3 px-8 flex items-center gap-2">
                Join the Team <ArrowRight size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { name: "Dr. Elena Vance", role: "Chief of Stewardship", seed: "woman1" },
                { name: "Marcus Thorne", role: "Lead Systems Architect", seed: "man1" },
                { name: "Sarah Chen", role: "Global Operations", seed: "woman2" },
                { name: "David Kim", role: "Impact Verification", seed: "man2" },
              ].map((member) => (
                <div key={member.name} className="space-y-4 group">
                  <div className="aspect-[4/5] bg-muted rounded-3xl overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                    <img 
                      src={`https://picsum.photos/seed/${member.seed}/600/800`} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-display font-extrabold tracking-tight">{member.name}</h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-accent">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section> */}

          {/* CTA Section */}
          <section className="no-line-card p-8 sm:p-12 lg:p-16 bg-accent text-white text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <div className="grid grid-cols-10 gap-4">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-white rounded-full" />
                ))}
              </div>
            </div>
            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-extrabold tracking-tighter leading-none">
                Ready to <br />
                <span className="text-white/60">Steward?</span>
              </h2>
              <p className="text-base sm:text-xl text-white/80 leading-relaxed">
                Join thousands of donors and volunteers who are already using Impact Ledger to build a more transparent world.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/donate" className="btn-primary bg-white text-accent border-none py-4 px-10 text-lg">
                  Donate Now
                </Link>
                <Link href="/volunteer" className="btn-outline border-white text-white hover:bg-white hover:text-accent py-4 px-10 text-lg">
                  Volunteer Hub
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
