"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, Heart, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignCardProps {
  id: string;
  title: string;
  location: string;
  progress: number;
  goal: string;
  raised: string;
  image: string;
  category: string;
  urgency: string;
}

export default function CampaignCard({
  id,
  title,
  location,
  progress,
  goal,
  raised,
  image,
  category,
  urgency,
}: CampaignCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group no-line-card flex flex-col h-full"
    >
      <div className="aspect-video rounded-xl overflow-hidden mb-6 relative">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest">
            {location}
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
            urgency === "High" ? "bg-red-500 text-white" : 
            urgency === "Medium" ? "bg-amber-500 text-white" : "bg-green-500 text-white"
          )}>
            {urgency} Urgency
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{category}</span>
      </div>
      <h3 className="text-xl font-display font-bold mb-4 leading-tight">{title}</h3>
      
      <div className="mt-auto space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-muted-foreground uppercase tracking-widest">Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              viewport={{ once: true }}
              className="h-full bg-accent"
            />
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Raised</p>
            <p className="font-bold">{raised}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Goal</p>
            <p className="font-bold">{goal}</p>
          </div>
        </div>
        
        <Link href={`/campaigns/${id}`} className="btn-primary w-full text-center py-2 text-sm flex items-center justify-center gap-2">
          Fund Mission <ArrowRight size={16} />
        </Link>
      </div>
    </motion.div>
  );
}
