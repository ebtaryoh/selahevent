import { notFound } from "next/navigation";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrganization } from "@/lib/data";
import { CertificateForm } from "@/components/certificate-form";

export default async function CertificatesPage({
  params,
}: {
  params: { id: string };
}) {
  const org = await getOrganization();
  if (!org) return notFound();

  const event = await db.query.events.findFirst({
    where: eq(events.id, params.id),
  });

  if (!event || event.organizationId !== org.id) return notFound();

  return <CertificateForm eventId={event.id} initialThreshold={event.certificateThreshold} />;
}
