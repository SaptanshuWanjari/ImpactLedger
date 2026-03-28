import Link from "next/link";
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

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
      { name: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-muted pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <Heart size={24} fill="currentColor" />
              </div>
              <span className="text-xl font-display font-extrabold tracking-tighter">LNMS</span>
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

        <div className="border-t border-muted pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Lions NGO Management System. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Mail size={14} />
              <span>contact@lions.org</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Phone size={14} />
              <span>+1 (555) 123-4567</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
