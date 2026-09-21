import { Users, UserPlus } from "lucide-react";
import { db } from "@/db";
import { appUsers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { formatDate, titleCase } from "@/lib/format";
import { getOrganization } from "@/lib/data";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const org = await getOrganization();
  if (!org) redirect("/login");

  const team = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.organizationId, org.id))
    .orderBy(desc(appUsers.createdAt));

  async function addTeamMember(formData: FormData) {
    "use server";

    const currentOrg = await getOrganization();
    if (!currentOrg) return;

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;

    if (!name || !email || !role) return;

    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    await db.insert(appUsers).values({
      organizationId: currentOrg.id,
      name,
      email,
      role,
      initials,
    });

    revalidatePath("/dashboard/team");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink flex items-center gap-3">
            <Users className="text-[var(--color-brass)]" /> Team & Volunteers
          </h1>
          <p className="mt-2 text-warm-500 text-sm max-w-2xl">
            Manage who has access to your organization's events. Roles dictate what they can see and do.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Team List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-[15px] border border-[rgba(22,19,17,0.1)] bg-paper">
            <table className="ledger w-full text-left">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 border-b text-[0.8rem] font-medium text-warm-500">Member</th>
                  <th scope="col" className="px-6 py-3 border-b text-[0.8rem] font-medium text-warm-500">Role</th>
                  <th scope="col" className="px-6 py-3 border-b text-[0.8rem] font-medium text-warm-500">Status</th>
                  <th scope="col" className="px-6 py-3 border-b text-[0.8rem] font-medium text-warm-500">Added</th>
                </tr>
              </thead>
              <tbody>
                {team.map((user) => (
                  <tr key={user.id} className="border-b border-[rgba(22,19,17,0.05)] last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-warm-100 flex items-center justify-center text-sm font-semibold text-warm-600">
                          {user.initials}
                        </div>
                        <div>
                          <div className="font-semibold text-ink">{user.name}</div>
                          <div className="text-[0.795rem] text-warm-400">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`pill ${
                        user.role === 'owner' ? 'bg-signal-green/10 text-signal-green' : 
                        user.role === 'admin' ? 'bg-brass/10 text-brass-deep' : 
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        {titleCase(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[0.795rem] text-warm-600">
                        {titleCase(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[0.8rem] text-warm-400">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Member Form */}
        <div>
          <div className="card p-6 sticky top-24">
            <div className="flex items-center gap-2 mb-6">
              <UserPlus className="text-[var(--color-brass)] h-5 w-5" />
              <h2 className="font-display text-lg font-semibold text-ink">Add Team Member</h2>
            </div>
            
            <form action={addTeamMember} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[0.795rem] font-medium text-ink">Full Name</label>
                <input type="text" name="name" className="input" placeholder="Jane Doe" required />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[0.795rem] font-medium text-ink">Email Address</label>
                <input type="email" name="email" className="input" placeholder="jane@example.com" required />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[0.795rem] font-medium text-ink">Role</label>
                <select name="role" className="input" required defaultValue="volunteer">
                  <option value="admin">Admin (Full Access)</option>
                  <option value="manager">Manager (Event Access)</option>
                  <option value="volunteer">Volunteer (Check-in Access Only)</option>
                </select>
                <p className="text-xs text-warm-500 pt-1">
                  Volunteers can only access the Check-in command center and cannot view financial data.
                </p>
              </div>

              <button type="submit" className="btn btn-primary w-full justify-center">
                Invite Member
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
