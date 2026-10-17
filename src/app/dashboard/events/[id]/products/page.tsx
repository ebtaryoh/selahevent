import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganization, getEventById, getEventProducts, getProductOrders, getProductStats } from "@/lib/data";
import { DashboardProductsManager } from "@/components/dashboard-products-manager";

export const dynamic = "force-dynamic";

export default async function EventProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const { id } = await params;
  const event = await getEventById(id, org.id);

  if (!event) return notFound();

  const [products, orders, stats] = await Promise.all([
    getEventProducts(event.id, false),
    getProductOrders(event.id),
    getProductStats(event.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/events/${event.id}`}
          className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-warm-500 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} /> Back to {event.title}
        </Link>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-brass-deep uppercase tracking-wider">
              <ShoppingBag size={14} /> Event Store &amp; Materials
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink mt-1">
              Store, Merch &amp; Resource Desk
            </h1>
            <p className="text-warm-500 text-sm mt-1">
              Manage physical merchandise, study books, soaking audio files, and on-site collection scanning for {event.title}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/e/${event.slug}#store`}
              target="_blank"
              className="btn btn-secondary !text-xs !py-2 !px-3.5"
            >
              Preview Public Store &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Main Manager Client Component */}
      <DashboardProductsManager
        eventId={event.id}
        eventTitle={event.title}
        currency={event.currency || "NGN"}
        initialProducts={products}
        initialOrders={orders}
        initialStats={stats}
      />
    </div>
  );
}
