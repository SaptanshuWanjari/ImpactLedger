"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-display font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: March 28, 2026</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Impact Lodger (Lions NGO Management System), we take your privacy seriously. This policy explains how we collect, use, and protect your personal information when you use our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, make a donation, or sign up to volunteer. This may include your name, email address, payment information, and location data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information to process donations, manage volunteer assignments, provide impact reports, and improve our services. We do not sell your personal information to third parties.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement a variety of security measures to maintain the safety of your personal information. Your sensitive data is encrypted and stored securely.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">5. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at privacy@lnms.org.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
