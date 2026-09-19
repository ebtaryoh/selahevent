import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { RegisterOrgForm } from "@/components/register-org-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/ui";

export const metadata = {
  title: "Register Your Organization | Selah",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 flex flex-col justify-center py-24 sm:py-32 px-5 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <div className="mb-12 text-center">
            <Reveal>
              <h1 className="font-display mx-auto max-w-2xl text-[clamp(2.15rem,4.2vw,3.15rem)] leading-[1.04] font-semibold text-ink">
                Start hosting your events with Selah.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-4 max-w-xl text-[1.125rem] leading-[1.68] text-warm-600">
                Join our premium Christian marketplace. Set up your organization's workspace in seconds and start managing events immediately.
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <RegisterOrgForm />
          </Reveal>
          
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm font-medium text-warm-500 transition-colors hover:text-ink"
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
