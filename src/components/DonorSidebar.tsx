"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Heart, History, LogOut } from "lucide-react";

const sidebarLinks = [
  { name: "Impact Portal", href: "/donor", icon: User },
  { name: "My Donations", href: "/donor/donations", icon: History },
  // { name: "Impact Analytics", href: "/donor/analytics", icon: PieChart },
  // { name: "My Badges", href: "/donor/badges", icon: Award },
  // { name: "Stewardship", href: "/donor/stewardship", icon: ShieldCheck },
];

export default function DonorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-muted h-screen sticky top-0 flex flex-col p-6">
      <div className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white">
          <Heart size={18} fill="currentColor" />
        </div>
        <Link
          href="/"
          className="text-lg font-display font-extrabold tracking-tighter"
        >
          Donor Portal
        </Link>
      </div>

      <nav className="flex-grow space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-3">
          Donor Menu
        </p>
        {sidebarLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              pathname === link.href
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:bg-muted hover:text-primary",
            )}
          >
            <link.icon size={18} />
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-muted space-y-2">
        <Link
          href="/auth/signout"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
