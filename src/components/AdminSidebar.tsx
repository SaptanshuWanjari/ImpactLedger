"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Globe, 
  Users, 
  FileText, 
  LogOut, 
  ShieldCheck, 
  Heart,
  PieChart,
  Menu,
  X
} from "lucide-react";

const sidebarLinks = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Campaigns", href: "/admin/campaigns", icon: Globe },
  { name: "Donors", href: "/admin/donors", icon: Users },
  { name: "Reports", href: "/admin/reports", icon: FileText },
  { name: "Analytics", href: "/admin/analytics", icon: PieChart },
  { name: "Operations", href: "/admin/operations", icon: ShieldCheck },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-muted">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Heart size={18} fill="currentColor" />
            </div>
            <span className="text-sm font-display font-extrabold tracking-tight">Admin</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="p-2 text-primary"
            aria-label="Toggle admin menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/35" onClick={closeMenu}>
          <aside
            className="absolute top-16 left-0 bottom-0 w-72 max-w-[85vw] bg-white border-r border-muted p-5 overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-3">Main Menu</p>
              {sidebarLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    pathname === link.href
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-primary"
                  )}
                >
                  <link.icon size={18} />
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="pt-6 mt-6 border-t border-muted">
              <Link
                href="/auth/signout"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
              >
                <LogOut size={18} />
                Sign Out
              </Link>
            </div>
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex w-64 bg-white border-r border-muted h-screen sticky top-0 flex-col p-6">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <Heart size={18} fill="currentColor" />
          </div>
          <Link href="/" className="text-lg font-display font-extrabold tracking-tighter">Impact Ledger</Link>
        </div>

        <nav className="flex-grow space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-3">Main Menu</p>
          {sidebarLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                pathname === link.href
                  ? "bg-accent/10 text-accent"
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
            href="/auth/signout"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={18} />
            Sign Out
          </Link>
        </div>
      </aside>
    </>
  );
}
