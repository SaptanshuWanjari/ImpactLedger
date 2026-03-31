"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  HandHelping, 
  Heart, 
  ClipboardList, 
  MapPin, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  TrendingUp,
  BookOpen,
  Wifi,
  WifiOff
} from "lucide-react";
import { useState, useEffect } from "react";

const sidebarLinks = [
  { name: "Volunteer Hub", href: "/volunteer", icon: HandHelping },
  { name: "Assignments", href: "/volunteer/assignments", icon: ClipboardList },
  // { name: "Field Map", href: "/volunteer/map", icon: MapPin },
  { name: "Resources", href: "/volunteer/resources", icon: BookOpen },
  { name: "Impact Logs", href: "/volunteer/logs", icon: TrendingUp },
  { name: "Verification", href: "/volunteer/verification", icon: ShieldCheck },
];

export default function VolunteerSidebar() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-muted h-screen sticky top-0 flex flex-col p-6">
      <div className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
          <HandHelping size={18} fill="currentColor" />
        </div>
        <span className="text-lg font-display font-extrabold tracking-tighter">Volunteer Hub</span>
      </div>

      <nav className="flex-grow space-y-2">
        <div className="flex items-center justify-between mb-4 px-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volunteer Menu</p>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
            isOnline ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          )}>
            {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>
        {sidebarLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
              pathname === link.href 
                ? "bg-green-50 text-green-600" 
                : "text-muted-foreground hover:bg-muted hover:text-primary"
            )}
          >
            <link.icon size={18} />
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="pt-6 border-t border-muted space-y-2">
        <Link
          href="/volunteer/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-all"
        >
          <Settings size={18} />
          Settings
        </Link>
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
