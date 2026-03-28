"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-display font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: March 28, 2026</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Impact Lodger (Lions NGO Management System) platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">2. Use of Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to use our services only for lawful purposes and in a manner that does not infringe the rights of others or restrict their use of the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">3. Donations and Stewardship</h2>
            <p className="text-muted-foreground leading-relaxed">
              All donations made through Impact Lodger are final and non-refundable. We are committed to radical transparency and will provide verifiable proof of fund allocation for every donation.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">4. Volunteer Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              Volunteers are responsible for providing accurate field reports and following our safety and ethical guidelines. Impact Lodger reserves the right to terminate volunteer assignments at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">5. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Impact Lodger shall not be liable for any direct, indirect, incidental, or consequential damages arising out of your use of the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">6. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at legal@lnms.org.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
