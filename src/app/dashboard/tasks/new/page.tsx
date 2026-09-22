import { getEventsForOrganization, getOrganization } from "@/lib/data";
import { redirect } from "next/navigation";
import { TaskForm } from "@/components/task-form";

export const dynamic = "force-dynamic";

export default async function NewTaskPage() {
  const org = await getOrganization();
  if (!org) {
    redirect("/login");
  }

  const events = await getEventsForOrganization(org.id);
  const activeEvents = events.filter(e => e.status !== "completed");

  return (
    <div className="mx-auto w-full max-w-4xl py-6">
      <TaskForm events={activeEvents} />
    </div>
  );
}
