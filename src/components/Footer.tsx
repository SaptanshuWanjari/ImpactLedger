import Link from "next/link";
import { Heart, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const footerLinks = [
  {
    title: "Organization",
    links: [
      { name: "About Us", href: "/about" },
      { name: "Our Impact", href: "/impact" },
      { name: "Campaigns", href: "/campaigns" },
      { name: "Volunteer", href: "/volunteer" },
    ],
  },
  {
    title: "Support",
    links: [
      { name: "Donate Now", href: "/donate" },
      { name: "Donor Portal", href: "/donor" },
      { name: "Transparency", href: "/transparency" },
      { name: "About", href: "/about" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-muted pt-14 sm:pt-20 pb-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-12 mb-12 sm:mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <Heart size={24} fill="currentColor" />
              </div>
              <span className="text-xl font-display font-extrabold tracking-tighter">Impact Ledger</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              Empowering Lions International to manage stewardship with radical transparency and modern efficiency.
            </p>
            <div className="flex items-center gap-4">
              <Link href="#" className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white transition-colors">
                <Facebook size={18} />
              </Link>
              <Link href="#" className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white transition-colors">
                <Twitter size={18} />
              </Link>
              <Link href="#" className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white transition-colors">
                <Instagram size={18} />
              </Link>
              <Link href="#" className="p-2 bg-muted rounded-full hover:bg-primary hover:text-white transition-colors">
                <Linkedin size={18} />
              </Link>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-6">
              <h4 className="font-display font-bold text-sm uppercase tracking-wider">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-muted pt-8 sm:pt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <p className="text-muted-foreground text-xs text-left">
            © {new Date().getFullYear()} Impact Ledger. All rights reserved.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Mail size={14} />
              <span>impactledger@lions.org</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Phone size={14} />
              <span>+91 7350557473</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
