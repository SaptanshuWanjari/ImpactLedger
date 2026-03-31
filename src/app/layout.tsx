import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Geist } from "next/font/google";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Impact Ledger - Lions NGO Management System",
  description: "A modern, transparent, and efficient NGO management system for Lions International.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("scroll-smooth", "font-sans", geist.variable)}>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>{children}</body>
    </html>
  );
}
