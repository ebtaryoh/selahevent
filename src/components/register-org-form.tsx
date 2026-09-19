"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Building, Mail, Phone, Globe } from "lucide-react";
import { registerOrganization } from "@/lib/actions";
import { GoogleIcon, AppleIcon, FacebookIcon, XIcon } from "@/components/social-icons";

export function RegisterOrgForm() {
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      await registerOrganization(formData);
    } catch (err) {
      console.error(err);
      setIsPending(false);
      alert("Failed to register organization. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto w-full">
      <div className="rounded-[16px] border border-[rgba(22,19,17,0.1)] bg-paper p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button type="button" className="btn btn-ghost !border border-[rgba(22,19,17,0.1)] !bg-white !px-4 !py-2.5 flex items-center justify-center gap-2 text-[0.875rem] font-medium text-ink shadow-sm hover:!bg-parchment transition-colors">
            <GoogleIcon className="h-5 w-5" />
            Google
          </button>
          <button type="button" className="btn btn-ghost !border border-[rgba(22,19,17,0.1)] !bg-white !px-4 !py-2.5 flex items-center justify-center gap-2 text-[0.875rem] font-medium text-ink shadow-sm hover:!bg-parchment transition-colors">
            <AppleIcon className="h-5 w-5" />
            Apple
          </button>
          <button type="button" className="btn btn-ghost !border border-[rgba(22,19,17,0.1)] !bg-[#1877F2] !px-4 !py-2.5 flex items-center justify-center gap-2 text-[0.875rem] font-medium text-white shadow-sm hover:brightness-110 transition-all">
            <FacebookIcon className="h-5 w-5" />
            Facebook
          </button>
          <button type="button" className="btn btn-ghost !border border-[rgba(22,19,17,0.1)] !bg-black !px-4 !py-2.5 flex items-center justify-center gap-2 text-[0.875rem] font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors">
            <XIcon className="h-4 w-4" />
            X (Twitter)
          </button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-[rgba(22,19,17,0.1)]"></div>
          </div>
          <div className="relative flex justify-center text-sm font-medium leading-6">
            <span className="bg-paper px-6 text-warm-500">Or continue with email</span>
          </div>
        </div>

        <h2 className="font-display mb-6 flex items-center gap-2 text-xl font-semibold text-ink">
          <Building size={20} className="text-brass" /> Organization Details
        </h2>
        
        <div className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
              Organization Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Christ Embassy"
              className="input !w-full"
            />
          </div>
          
          <div>
            <label htmlFor="orgType" className="mb-1.5 block text-sm font-medium text-ink">
              Organization Type
            </label>
            <select
              id="orgType"
              name="orgType"
              required
              className="input !w-full bg-parchment"
            >
              <option value="church">Church</option>
              <option value="ministry">Ministry / Non-Profit</option>
              <option value="corporate">Corporate</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink flex items-center gap-1.5">
              <Mail size={14} className="text-warm-400"/> Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="hello@church.com"
              className="input !w-full"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink flex items-center gap-1.5">
              <Phone size={14} className="text-warm-400"/> Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              placeholder="+234 800 000 0000"
              className="input !w-full"
            />
          </div>

          <div>
            <label htmlFor="country" className="mb-1.5 block text-sm font-medium text-ink flex items-center gap-1.5">
              <Globe size={14} className="text-warm-400"/> Country
            </label>
            <select
              id="country"
              name="country"
              required
              className="input !w-full bg-parchment"
            >
              <option value="NG">Nigeria</option>
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="KE">Kenya</option>
              <option value="ZA">South Africa</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn btn-primary !px-8 !py-3.5 w-full text-[1rem]"
        >
          {isPending ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Setting up your workspace...
            </>
          ) : (
            <>
              Create Workspace
              <ArrowRight size={18} strokeWidth={2.1} className="ml-2" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
