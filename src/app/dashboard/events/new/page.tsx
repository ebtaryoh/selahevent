import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { CreateEventForm } from "@/components/create-event-form";
import { getBlueprints, getOrganization } from "@/lib/data";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Create Event | Selah",
};

export default async function CreateEventPage() {
  const org = await getOrganization();
  if (!org) notFound();

  const blueprints = await getBlueprints(org.id);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-medium text-warm-500 transition-colors hover:text-ink mb-6"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Create New Event
        </h1>
        <p className="mt-2 text-warm-600">
          Fill in the details below to launch your next spiritual gathering.
        </p>
      </div>

      <CreateEventForm blueprints={blueprints} />
    </div>
  );
}
