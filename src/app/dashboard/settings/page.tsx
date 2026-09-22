import { getOrganization } from "@/lib/data";
import { redirect } from "next/navigation";
import { OrganizationSettingsForm } from "@/components/organization-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const org = await getOrganization();
  if (!org) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-4xl py-6">
      <OrganizationSettingsForm org={org} />
    </div>
  );
}
