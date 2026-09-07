import Link from "next/link";
import TopHeader from "@/components/TopHeader";
import { getGroupsAction } from "@/lib/actions/groups";
import { Plus, Users, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const result = await getGroupsAction();
  if (!result.success && result.error === "UNAUTHORIZED") {
    redirect("/login");
  }
  const groups = result.groups || [];

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader
        title="Groups"
        subtitle="Manage student groups and rosters"
        action={
          <Link
            href="/groups/new"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground hover:opacity-90 active:scale-95 transition-transform"
            aria-label="Create Group"
          >
            <Plus className="h-5 w-5" />
          </Link>
        }
      />

      <div className="flex-1 p-4 space-y-3">
        {groups.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-surface mt-6 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">No groups created</h2>
            <p className="text-xs text-muted-foreground">
              Create a group to organize students into classes or batches.
            </p>
            <Link
              href="/groups/new"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-accent text-accent-foreground font-medium text-xs hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" /> Create Group
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 shadow-xs hover:bg-muted/30 active:scale-[0.99] transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-foreground">
                      {group.name}
                    </h2>
                    {group.isOwner ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        Owner
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        View Only
                      </span>
                    )}
                  </div>
                  {group.detail && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {group.detail}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-0.5 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{group._count.students} students</span>
                    </div>
                    <span>&bull;</span>
                    <span className="text-[11px]">
                      by <span className="font-semibold text-foreground">@{group.createdBy?.username || "user"}</span>
                    </span>
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
