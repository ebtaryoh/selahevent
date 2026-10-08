import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/ui";
import { Suspense } from "react";
import { getOrgSession } from "@/lib/session";

export const metadata = {
  title: "Sign In | Selah",
};

export default async function LoginPage() {
  const session = await getOrgSession();

  return (
    <div className="min-h-screen bg-[#08080a] selection:bg-brass selection:text-black flex flex-col relative isolate overflow-hidden">
      {/* Cinematic Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[rgba(226,192,115,0.06)] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[rgba(226,192,115,0.03)] blur-[120px] rounded-full" />
      </div>

      <SiteHeader isSignedIn={!!session} />
      
      <main className="relative z-10 flex-1 flex flex-col justify-center py-24 sm:py-32 px-5 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="mb-12 text-center">
            <Reveal>
              <h1 className="font-display mx-auto max-w-2xl text-[clamp(2.15rem,4.2vw,3.15rem)] leading-[1.04] font-semibold text-white">
                Welcome back to Selah.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-4 max-w-xl text-[1.125rem] leading-[1.68] text-white/60 font-light">
                Sign in to your organization&apos;s workspace to manage your events, tickets, and registrations.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <Suspense fallback={<div className="h-64 flex items-center justify-center">Loading...</div>}>
              <LoginForm />
            </Suspense>
          </Reveal>
          
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm font-medium text-white/40 transition-colors hover:text-white"
            >
              <ChevronLeft size={16} />
              Return to Marketplace
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
