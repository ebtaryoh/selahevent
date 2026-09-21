import { ArrowLeft, Check, X, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { events, registrations, ticketTypes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
  });

  if (!event) notFound();

  // Fetch registrations under review
  const pendingRegistrations = await db
    .select({
      registration: registrations,
      ticket: ticketTypes,
    })
    .from(registrations)
    .leftJoin(ticketTypes, eq(registrations.ticketTypeId, ticketTypes.id))
    .where(
      and(
        eq(registrations.eventId, id),
        eq(registrations.status, "under_review")
      )
    )
    .orderBy(desc(registrations.createdAt));

  async function approveRegistration(formData: FormData) {
    "use server";
    const regId = formData.get("registrationId") as string;
    if (!regId) return;

    await db
      .update(registrations)
      .set({ status: "confirmed" }) // Normally, if paid it would go to 'pending' payment, but for demo 'confirmed'
      .where(eq(registrations.id, regId));

    revalidatePath(`/dashboard/events/${id}/approvals`);
  }

  async function rejectRegistration(formData: FormData) {
    "use server";
    const regId = formData.get("registrationId") as string;
    if (!regId) return;

    await db
      .update(registrations)
      .set({ status: "rejected" })
      .where(eq(registrations.id, regId));

    revalidatePath(`/dashboard/events/${id}/approvals`);
  }

  return (
    <div className="space-y-8">
      <section>
        <Link
          href={`/dashboard/events/${id}`}
          className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold text-warm-500 transition-colors hover:text-ink mb-6"
        >
          <ArrowLeft size={15} /> Back to event
        </Link>
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink flex items-center gap-3">
            <ShieldAlert className="text-[var(--color-brass)]" /> Ticket Approvals
          </h1>
          <p className="mt-2 text-warm-500 text-sm max-w-2xl">
            Review and approve attendees who registered for ticket types requiring approval.
          </p>
        </div>
      </section>

      <section>
        {pendingRegistrations.length === 0 ? (
          <div className="card p-12 text-center flex flex-col items-center">
            <ShieldAlert className="text-warm-300 h-12 w-12 mb-4" />
            <h3 className="font-display text-lg font-semibold text-ink">No pending approvals</h3>
            <p className="text-warm-500 mt-2">All registrations have been reviewed.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
            <div className="overflow-x-auto">
              <table className="ledger">
                <thead>
                  <tr>
                    <th scope="col">Attendee</th>
                    <th scope="col">Ticket Type</th>
                    <th scope="col">Custom Answers</th>
                    <th scope="col">Registered</th>
                    <th scope="col" className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRegistrations.map(({ registration, ticket }) => (
                    <tr key={registration.id}>
                      <td>
                        <div className="font-semibold text-ink">
                          {registration.firstName} {registration.lastName}
                        </div>
                        <div className="text-[0.795rem] text-warm-400">
                          {registration.email}
                        </div>
                      </td>
                      <td>
                        <span className="pill border-[rgba(192,138,46,0.3)] bg-[rgba(192,138,46,0.09)] text-[var(--color-brass-deep)]">
                          {ticket?.name || "General"}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1 text-[0.795rem] text-warm-600 max-w-xs">
                          {registration.customAnswers && Object.keys(registration.customAnswers).length > 0 ? (
                            Object.entries(registration.customAnswers).map(([k, v]) => {
                              const q = event.customQuestions?.find((q: any) => q.id === k);
                              return (
                                <div key={k} className="truncate">
                                  <span className="font-medium text-ink">{q?.label || k}:</span> {String(v)}
                                </div>
                              )
                            })
                          ) : (
                            <span className="text-warm-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="tnum whitespace-nowrap text-warm-400">
                        {formatDate(registration.createdAt)}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <form action={rejectRegistration}>
                            <input type="hidden" name="registrationId" value={registration.id} />
                            <button
                              type="submit"
                              className="btn btn-ghost !text-[var(--color-signal-red)] !px-3"
                              title="Reject"
                            >
                              <X size={16} />
                            </button>
                          </form>
                          <form action={approveRegistration}>
                            <input type="hidden" name="registrationId" value={registration.id} />
                            <button
                              type="submit"
                              className="btn btn-primary !bg-[var(--color-signal-green)] !px-3"
                              title="Approve"
                            >
                              <Check size={16} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
