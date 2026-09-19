import { notFound } from "next/navigation";
import { getEventById, getEventStats } from "@/lib/data";
import { CommandCenter } from "@/components/command-center";
import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CommandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  
  if (!event) notFound();

  const stats = await getEventStats(event.id);

  return (
    <div className="min-h-[80vh]">
      {/* Top Navigation & Live Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link
          href={`/dashboard/events/${event.id}`}
          className="inline-flex items-center gap-2 text-[0.85rem] font-semibold text-warm-500 transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} /> Back to event dashboard
        </Link>
        
        <div className="flex items-center gap-4 bg-white border border-[rgba(22,19,17,0.1)] rounded-full px-5 py-2 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-signal-green)] animate-pulse" />
            <span className="text-[0.85rem] font-medium text-ink">Live Check-ins</span>
          </div>
          <div className="w-[1px] h-4 bg-warm-200" />
          <div className="flex items-center gap-2 text-[0.85rem] text-warm-500">
            <Users size={15} />
            <span className="font-semibold text-ink">{formatNumber(stats.checkedIn)}</span> 
            <span>/ {formatNumber(stats.registered)}</span>
          </div>
        </div>
      </div>

      {/* Main Command Center Component */}
      <CommandCenter eventId={event.id} />
    </div>
  );
}
