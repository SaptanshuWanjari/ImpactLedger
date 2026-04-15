import SignupForm from "@/components/auth/SignupForm";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Link from "next/link";
import { UserPlus2, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6">
        <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              <UserPlus2 size={14} />
              Join the Platform
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tighter leading-none">
                Build Impact with <br /> Verified Transparency.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Create your account to follow campaigns, manage contributions, and receive role-based access to donor, volunteer, or admin experiences.
              </p>
            </div>
            <div className="space-y-3">
              {[
                "Automatic tenant membership provisioning",
                "Secure Google or email/password onboarding",
                "Role-aware home routing after signup",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-primary">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 size={13} />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Already onboarded?{" "}
              <Link href="/auth/login" className="font-semibold text-accent hover:underline">
                Sign in instead
              </Link>
            </p>
          </div>

          <div className="flex justify-center lg:justify-end">
            <Suspense fallback={<div className="w-full max-w-md rounded-2xl border border-muted bg-white p-8" />}>
              <SignupForm />
            </Suspense>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
