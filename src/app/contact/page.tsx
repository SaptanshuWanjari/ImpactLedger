"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Send, 
  MessageSquare, 
  HelpCircle, 
  ShieldCheck,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <p className="text-accent font-bold uppercase tracking-widest text-xs">Get in Touch</p>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold tracking-tighter leading-none">
              Connect with <br />
              <span className="text-accent">Impact Lodger.</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Have questions about our stewardship system or want to partner with us? Our global team is ready to assist.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <section className="no-line-card p-12 space-y-10 border border-muted">
              <div className="space-y-2">
                <h2 className="text-3xl font-display font-extrabold tracking-tight">Send a Message</h2>
                <p className="text-sm text-muted-foreground">We typically respond within 24 hours.</p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      className="w-full px-6 py-4 bg-muted/30 border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      className="w-full px-6 py-4 bg-muted/30 border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                  <select className="w-full px-6 py-4 bg-muted/30 border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent/20 transition-all appearance-none">
                    <option>General Inquiry</option>
                    <option>Donation Support</option>
                    <option>Volunteer Opportunities</option>
                    <option>Partnership Proposal</option>
                    <option>Technical Support</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Message</label>
                  <textarea 
                    rows={6} 
                    placeholder="How can we help you?" 
                    className="w-full px-6 py-4 bg-muted/30 border-none rounded-2xl text-sm focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                  />
                </div>

                <button className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-2">
                  Send Message <Send size={20} />
                </button>
              </form>
            </section>

            {/* Contact Info & FAQ */}
            <section className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { title: "Email Us", value: "stewardship@lnms.org", icon: Mail, color: "bg-accent/10 text-accent" },
                  { title: "Call Us", value: "+1 (800) 555-Impact Lodger", icon: Phone, color: "bg-green-50 text-green-600" },
                  { title: "Global HQ", value: "San Francisco, CA", icon: MapPin, color: "bg-blue-50 text-blue-600" },
                  { title: "Network Status", value: "All Systems Operational", icon: ShieldCheck, color: "bg-purple-50 text-purple-600" },
                ].map((item) => (
                  <div key={item.title} className="no-line-card p-8 space-y-4 border border-muted">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", item.color)}>
                      <item.icon size={24} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.title}</p>
                      <p className="text-lg font-display font-extrabold tracking-tight">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                <h3 className="text-3xl font-display font-extrabold tracking-tight">Common Questions</h3>
                <div className="space-y-4">
                  {[
                    "How do I track my donation in real-time?",
                    "What percentage of my donation goes to the field?",
                    "How can I become a verified volunteer?",
                    "Is my data secure on the Impact Lodger ledger?",
                  ].map((q) => (
                    <div key={q} className="no-line-card p-6 flex items-center justify-between group hover:border-accent transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground group-hover:bg-accent group-hover:text-white transition-all">
                          <HelpCircle size={16} />
                        </div>
                        <span className="text-sm font-bold group-hover:text-accent transition-colors">{q}</span>
                      </div>
                      <ChevronRight className="text-muted-foreground group-hover:text-accent transition-colors" size={20} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="no-line-card p-8 bg-primary text-primary-foreground rounded-3xl space-y-4">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="text-accent" />
                  <h4 className="font-display font-bold text-xl tracking-tight">Verified Stewardship</h4>
                </div>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">
                  Impact Lodger is committed to 100% transparency. If you have any concerns about fund allocation or impact verification, please contact our transparency officer directly.
                </p>
                <button className="text-xs font-bold text-accent uppercase tracking-widest hover:underline flex items-center gap-2">
                  Transparency Policy <ArrowRight size={14} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ChevronRight({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
