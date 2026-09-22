"use client";

import { useState } from "react";
import { Check, Loader2, Building, Globe, Mail, Phone, Clock, DollarSign, Palette, UploadCloud, X } from "lucide-react";
import { Field } from "@/components/ui";
import { updateOrganizationSettings } from "@/lib/actions/settings";
import { useRouter } from "next/navigation";

export function OrganizationSettingsForm({
  org,
}: {
  org: any;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(org.avatar || null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    
    const res = await updateOrganizationSettings(org.id, formData);

    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(true);
      router.refresh();
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[42rem]" encType="multipart/form-data">
      <header className="mb-10 flex items-center justify-between">
        <h1 className="font-display text-[1.75rem] font-semibold text-ink">
          Organization Settings
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            Save Changes
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-8 rounded-xl bg-red-50 p-4 text-[0.875rem] text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-8 rounded-xl bg-green-50 p-4 text-[0.875rem] text-green-700 border border-green-100 flex items-center gap-2">
          <Check size={16} className="text-green-600" />
          Settings saved successfully.
        </div>
      )}

      <div className="space-y-8">
        {/* Basic Info */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-7">
          <h2 className="font-display flex items-center gap-2 text-[1.25rem] font-medium text-ink mb-6">
            <Building size={18} className="text-[var(--color-brass)]" />
            Basic Information
          </h2>

          <div className="grid gap-6">
            <Field label="Organization Name">
              <input
                type="text"
                name="name"
                required
                defaultValue={org.name}
                className="input"
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Organization Type">
                <select name="orgType" defaultValue={org.orgType} className="input bg-parchment">
                  <option value="church">Church</option>
                  <option value="ministry">Ministry / Non-Profit</option>
                  <option value="corporate">Corporate</option>
                </select>
              </Field>

              <Field label="Website">
                <input
                  type="url"
                  name="website"
                  defaultValue={org.website || ""}
                  className="input"
                  placeholder="https://"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-7">
          <h2 className="font-display flex items-center gap-2 text-[1.25rem] font-medium text-ink mb-6">
            <Phone size={18} className="text-[var(--color-brass)]" />
            Contact Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Email Address">
              <input
                type="email"
                name="email"
                required
                defaultValue={org.email || ""}
                className="input"
              />
            </Field>

            <Field label="Phone Number">
              <input
                type="tel"
                name="phone"
                defaultValue={org.phone || ""}
                className="input"
              />
            </Field>
          </div>
        </div>

        {/* Localization */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-7">
          <h2 className="font-display flex items-center gap-2 text-[1.25rem] font-medium text-ink mb-6">
            <Globe size={18} className="text-[var(--color-brass)]" />
            Localization
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Field label="Country">
              <select name="country" defaultValue={org.country} className="input bg-parchment">
                <option value="NG">Nigeria</option>
                <option value="US">United States</option>
                <option value="UK">United Kingdom</option>
                <option value="KE">Kenya</option>
                <option value="ZA">South Africa</option>
              </select>
            </Field>

            <Field label="Currency">
              <select name="currency" defaultValue={org.currency} className="input bg-parchment">
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="KES">Kenyan Shilling</option>
                <option value="ZAR">South African Rand</option>
              </select>
            </Field>

            <Field label="Timezone">
              <select name="timezone" defaultValue={org.timezone} className="input bg-parchment">
                <option value="Africa/Lagos">Africa/Lagos</option>
                <option value="America/New_York">Eastern Time (US)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Africa/Nairobi">Africa/Nairobi</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Branding & Logo */}
        <div className="rounded-[16px] border border-[rgba(22,19,17,0.09)] bg-paper p-7">
          <h2 className="font-display flex items-center gap-2 text-[1.25rem] font-medium text-ink mb-6">
            <Palette size={18} className="text-[var(--color-brass)]" />
            Branding & Logo
          </h2>

          <div className="mb-8">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Organization Logo
            </label>
            <p className="mb-4 text-xs text-warm-500">
              This logo will be displayed on your event pages and emails.
            </p>
            <div className="flex items-start gap-6">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-warm-200 bg-parchment">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Building size={32} className="text-warm-300" />
                )}
              </div>
              <div className="relative flex flex-1 flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[rgba(22,19,17,0.15)] bg-parchment py-6 transition-colors hover:border-[var(--color-brass)] hover:bg-[rgba(192,138,46,0.05)]">
                <UploadCloud size={24} className="mb-2 text-brass-light" />
                <p className="mb-1 text-xs font-semibold text-ink">
                  Click to upload a new logo
                </p>
                <p className="text-[10px] text-warm-500">SVG, PNG, JPG (max 2MB)</p>
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="Primary Color" description="Used for buttons and primary accents">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="primaryColor"
                  defaultValue={org.primaryColor}
                  className="h-10 w-14 cursor-pointer rounded bg-transparent p-0 border-0"
                />
                <span className="text-[0.875rem] font-mono text-warm-500 uppercase">
                  {org.primaryColor}
                </span>
              </div>
            </Field>

            <Field label="Accent Color" description="Used for highlights and badges">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="accentColor"
                  defaultValue={org.accentColor}
                  className="h-10 w-14 cursor-pointer rounded bg-transparent p-0 border-0"
                />
                <span className="text-[0.875rem] font-mono text-warm-500 uppercase">
                  {org.accentColor}
                </span>
              </div>
            </Field>
          </div>
        </div>
      </div>
    </form>
  );
}
