"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CampaignCard from "@/components/CampaignCard";
import { motion } from "framer-motion";
import { Search, Globe, Heart, ShieldCheck, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useApiData } from "@/lib/api/client";

type Campaign = {
  id: string;
  title: string;
  location: string;
  progress: number;
  goal: string;
  raised: string;
  image: string;
  category: string;
  urgency: string;
};

type CampaignsResponse = {
  campaigns: Campaign[];
};

const impactStats = [
  { label: "Total Missions", key: "total", icon: Globe },
  { label: "Lives Impacted", key: "lives", icon: Heart },
  { label: "Funds Allocated", key: "funds", icon: TrendingUp },
  { label: "Verified Stewards", key: "stewards", icon: ShieldCheck },
];

export default function CampaignsPage() {
  const { data, isLoading } = useApiData<CampaignsResponse>("/api/campaigns");
  const campaigns = data?.campaigns ?? [];

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(campaigns.map((c) => c.category)))],
    [campaigns],
  );

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        const matchesCategory =
          selectedCategory === "All" || campaign.category === selectedCategory;
        const matchesSearch =
          campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          campaign.location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [campaigns, selectedCategory, searchQuery],
  );

  const totalRaised = campaigns.reduce((acc, campaign) => {
    const value = Number(campaign.raised.replace(/[^0-9.]/g, ""));
    return acc + (Number.isFinite(value) ? value : 0);
  }, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="grow pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">
              Active Missions.
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Explore and fund verified missions managed by Lions International
              stewards across the globe.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {impactStats.map((stat, index) => {
              const value =
                stat.key === "total"
                  ? String(campaigns.length)
                  : stat.key === "funds"
                    ? new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                        maximumFractionDigits: 0,
                      }).format(totalRaised)
                    : stat.key === "stewards"
                      ? "12.5K"
                      : "1.2M";

              return (
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-display font-extrabold tracking-tight">
                      {value}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

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
                      : "bg-muted text-muted-foreground hover:bg-muted-foreground/10",
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <input
                type="text"
                placeholder="Search by mission or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="no-line-card h-80 animate-pulse bg-muted/40"
                />
              ))
            ) : filteredCampaigns.length > 0 ? (
              filteredCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} {...campaign} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <h3 className="text-2xl font-display font-bold">
                  No missions found.
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search query.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearchQuery("");
                  }}
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
