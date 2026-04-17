"use client";

import Link from "next/link";
import { BiHome } from "react-icons/bi";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HandHelping,
  ClipboardList,
  LogOut,
  TrendingUp,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const sidebarLinks = [
  { name: "Volunteer Hub", href: "/volunteer", icon: HandHelping },
  { name: "Assignments", href: "/volunteer/assignments", icon: ClipboardList },
  // { name: "Field Map", href: "/volunteer/map", icon: MapPin },
  { name: "Resources", href: "/volunteer/resources", icon: BookOpen },
  { name: "Impact Logs", href: "/volunteer/logs", icon: TrendingUp },
  /* { name: "Verification", href: "/volunteer/verification", icon: ShieldCheck }, */
];

export default function VolunteerSidebar() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

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

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-muted">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
              <HandHelping size={18} fill="currentColor" />
            </div>
            <span className="text-sm font-display font-extrabold tracking-tight">
              Volunteer
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="p-2 text-primary"
            aria-label="Toggle volunteer menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/35"
          onClick={closeMenu}
        >
          <aside
            className="absolute top-16 left-0 bottom-0 w-72 max-w-[85vw] bg-white border-r border-muted p-5 overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="space-y-2">
              <div className="flex items-center justify-between mb-4 px-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Volunteer Menu
                </p>
                <div
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                    isOnline
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600",
                  )}
                >
                  {isOnline ? "Online" : "Offline"}
                </div>
              </div>
              {sidebarLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    pathname === link.href
                      ? "bg-green-50 text-green-600"
                      : "text-muted-foreground hover:bg-muted hover:text-primary",
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
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
            <HandHelping size={18} fill="currentColor" />
          </div>
          <span className="text-lg font-display font-extrabold tracking-tighter">
            Volunteer Hub
          </span>
        </div>

        <nav className="flex-grow space-y-2">
          <div className="flex items-center justify-between mb-4 px-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Volunteer Menu
            </p>
          </div>
          {sidebarLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                pathname === link.href
                  ? "bg-green-50 text-green-600"
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
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-all"
          >
            <BiHome size={18} />
            Home
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
    </>
  );
}
