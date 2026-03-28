"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CampaignCard from "@/components/CampaignCard";
import { motion } from "framer-motion";
import { Search, Filter, Globe, Heart, ShieldCheck, TrendingUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const campaigns = [
  {
    id: 1,
    title: "Clean Water Initiative",
    location: "Kenya",
    progress: 75,
    goal: "$50,000",
    raised: "$37,500",
    image: "https://images.unsplash.com/photo-1541516166103-3ad240173934?auto=format&fit=crop&q=80&w=800",
    category: "Health & Sanitation",
    urgency: "High" as const,
  },
  {
    id: 2,
    title: "Emergency Relief: Cyclone",
    location: "Vietnam",
    progress: 40,
    goal: "$100,000",
    raised: "$40,000",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
    category: "Disaster Relief",
    urgency: "High" as const,
  },
  {
    id: 3,
    title: "Youth Education Fund",
    location: "Peru",
    progress: 90,
    goal: "$25,000",
    raised: "$22,500",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800",
    category: "Education",
    urgency: "Medium" as const,
  },
  {
    id: 4,
    title: "Reforestation Project",
    location: "Brazil",
    progress: 20,
    goal: "$200,000",
    raised: "$40,000",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb773b09?auto=format&fit=crop&q=80&w=800",
    category: "Environment",
    urgency: "Low" as const,
  },
  {
    id: 5,
    title: "Mobile Health Clinic",
    location: "India",
    progress: 55,
    goal: "$75,000",
    raised: "$41,250",
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=800",
    category: "Health & Sanitation",
    urgency: "Medium" as const,
  },
  {
    id: 6,
    title: "Refugee Support Fund",
    location: "Syria",
    progress: 65,
    goal: "$150,000",
    raised: "$97,500",
    image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&q=80&w=800",
    category: "Humanitarian",
    urgency: "High" as const,
  },
];

const categories = ["All", "Health & Sanitation", "Disaster Relief", "Education", "Environment", "Humanitarian"];

const impactStats = [
  { label: "Total Missions", value: "156", icon: Globe },
  { label: "Lives Impacted", value: "1.2M", icon: Heart },
  { label: "Funds Allocated", value: "$4.2M", icon: TrendingUp },
  { label: "Verified Stewards", value: "12.5K", icon: ShieldCheck },
];

export default function CampaignsPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesCategory = selectedCategory === "All" || campaign.category === selectedCategory;
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         campaign.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <p className="text-accent font-bold uppercase tracking-widest text-xs">Global Impact Dashboard</p>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">
              Active Missions.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Explore and fund verified missions managed by Lions International stewards across the globe.
            </p>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {impactStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="no-line-card p-6 flex flex-col justify-between"
              >
                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-4">
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-display font-extrabold tracking-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-6 rounded-2xl border border-muted shadow-sm">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                    selectedCategory === category 
                      ? "bg-primary text-white" 
                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/10"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="text" 
                placeholder="Search by mission or location..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>

          {/* Campaign Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} {...campaign} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                  <Search size={40} />
                </div>
                <h3 className="text-2xl font-display font-bold">No missions found.</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
                <button 
                  onClick={() => { setSelectedCategory("All"); setSearchQuery(""); }}
                  className="btn-outline"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
