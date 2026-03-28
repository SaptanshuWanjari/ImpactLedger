"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function CookiesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow pt-32 pb-20 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-display font-extrabold tracking-tight">Cookie Policy</h1>
          <p className="text-muted-foreground">Last updated: March 28, 2026</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">1. What are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are stored on your device when you visit a website. They help us provide you with a better experience by remembering your preferences and settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">2. How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies for essential functions like authentication, session management, and security. We also use analytics cookies to understand how you use our platform and to improve our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">3. Types of Cookies We Use</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Essential Cookies:</strong> Required for the platform to function correctly.</li>
              <li><strong>Performance Cookies:</strong> Help us improve the platform by collecting anonymous data.</li>
              <li><strong>Functional Cookies:</strong> Remember your settings and preferences.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">4. Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can manage or disable cookies through your browser settings. However, please note that some features of our platform may not function correctly if cookies are disabled.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-display font-bold">5. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Cookie Policy, please contact us at cookies@lnms.org.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
