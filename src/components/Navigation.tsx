"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Heart, Menu, X, User, LayoutDashboard, Globe, HandHelping, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { name: "Campaigns", href: "/campaigns", icon: Globe },
  { name: "Impact", href: "/impact", icon: Heart },
  { name: "Transparency", href: "/transparency", icon: ShieldCheck },
  { name: "Volunteer", href: "/volunteer", icon: HandHelping },
  { name: "About", href: "/about", icon: User },
  { name: "Contact", href: "/contact", icon: Menu },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        scrolled ? "bg-white/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white transition-transform group-hover:rotate-12">
            <Heart size={24} fill="currentColor" />
          </div>
          <span className="text-xl font-display font-extrabold tracking-tighter">Impact Lodger</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-accent",
                pathname === link.href ? "text-accent" : "text-muted-foreground"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
            title="Admin Dashboard"
          >
            <LayoutDashboard size={20} />
          </Link>
          <Link
            href="/donor"
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
            title="Donor Portal"
          >
            <User size={20} />
          </Link>
          <Link href="/donate" className="btn-primary py-2 px-6 text-sm">
            Donate Now
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-primary"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-muted p-6 md:hidden shadow-xl"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-3 text-lg font-medium text-muted-foreground hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  <link.icon size={20} />
                  {link.name}
                </Link>
              ))}
              <hr className="border-muted" />
              <Link
                href="/admin"
                className="flex items-center gap-3 text-lg font-medium text-muted-foreground"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard size={20} />
                Admin Dashboard
              </Link>
              <Link
                href="/donor"
                className="flex items-center gap-3 text-lg font-medium text-muted-foreground"
                onClick={() => setIsOpen(false)}
              >
                <User size={20} />
                Donor Portal
              </Link>
              <Link
                href="/donate"
                className="btn-primary text-center mt-2"
                onClick={() => setIsOpen(false)}
              >
                Donate Now
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
