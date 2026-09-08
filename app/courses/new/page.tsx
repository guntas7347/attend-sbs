"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import { useForm } from "@/hooks/useForm";
import { getGroupsAction } from "@/lib/actions/groups";
import { createCourseAction } from "@/lib/actions/courses";
import { getTeacherManagersAction } from "@/lib/actions/managers";
import { BookOpen, Check, Loader2, Shield, Users, UserCheck } from "lucide-react";
import Link from "next/link";

export default function NewCoursePage() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { values, handleChange } = useForm({
    name: "",
    code: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [groupsRes, managersRes] = await Promise.all([
          getGroupsAction(),
          getTeacherManagersAction(),
        ]);

        if (groupsRes.error === "FORBIDDEN" || managersRes.error === "FORBIDDEN") {
          router.replace("/courses");
          return;
        }

        if (groupsRes.success && groupsRes.groups) {
          setGroups(groupsRes.groups);
        }
        if (managersRes.success && managersRes.managers) {
          setManagers(managersRes.managers);
        }
      } catch {
        setError("Failed to load course setup data");
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [router]);

  function toggleGroup(groupId: string) {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  }

  function toggleManager(managerId: string) {
    setSelectedManagers((prev) =>
      prev.includes(managerId)
        ? prev.filter((id) => id !== managerId)
        : [...prev, managerId]
    );
  }

  function handleAddTag(e?: React.KeyboardEvent | React.MouseEvent) {
    if (e && "key" in e && e.key !== "Enter" && e.key !== ",") return;
    if (e) e.preventDefault();
    const raw = tagInput.replace(/,/g, "").trim();
    if (raw && !tags.includes(raw)) {
      setTags([...tags, raw]);
    }
    setTagInput("");
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedGroups.length === 0) {
      setError("Please select at least one group for this course");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await createCourseAction({
        name: values.name,
        code: values.code,
        tags,
        groupIds: selectedGroups,
        managerIds: selectedManagers,
      });

      if (res.success) {
        router.push("/courses");
        router.refresh();
      } else {
        setError(res.error || "Failed to create course");
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader title="New Course" backHref="/courses" />

      <div className="flex-1 p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/10 p-3.5 text-xs font-medium text-danger">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Course Name <span className="text-danger">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={values.name}
              onChange={handleChange}
              placeholder="e.g. Data Structures & Algorithms"
              className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="code"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Course Code <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <input
              id="code"
              name="code"
              type="text"
              value={values.code}
              onChange={handleChange}
              placeholder="e.g. CS301"
              className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          {/* Tags Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="tagInput"
              className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between"
            >
              <span>Course Tags <span className="text-muted-foreground font-normal">(Optional)</span></span>
              <span className="text-[10px] text-muted-foreground font-normal">Press Enter or comma to add</span>
            </label>
            <div className="rounded-xl border border-border bg-surface p-2.5 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all space-y-2">
              <div className="flex items-center gap-2">
                <input
                  id="tagInput"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tags e.g. 2023, Sem-IV, Morning Batch..."
                  className="flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold hover:bg-muted disabled:opacity-40 transition-all"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-accent/10 border border-accent/20 px-2.5 py-1 text-xs font-semibold text-accent"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-danger text-accent/70 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Assigned Groups <span className="text-danger">*</span>
              </label>
              <span className="text-xs text-muted-foreground">
                {selectedGroups.length} selected
              </span>
            </div>

            {fetching ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                Loading available groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface p-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No groups available. You need at least one group to create a course.
                </p>
                <Link
                  href="/groups/new"
                  className="inline-block text-xs font-semibold text-accent underline"
                >
                  Create a group first
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => {
                  const isSelected = selectedGroups.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-accent bg-accent/5 ring-1 ring-accent"
                          : "border-border bg-surface hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            isSelected
                              ? "bg-accent border-accent text-accent-foreground"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">
                              {group.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              by @{group.createdBy?.username || "user"}
                            </span>
                          </div>
                          {group.detail && (
                            <div className="text-xs text-muted-foreground">
                              {group.detail}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                        <Users className="h-3 w-3" />
                        <span>{group._count.students}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manager Assignment */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Assign Manager / CR <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Assigned managers can log in with their transferable account to mark attendance.
                </p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {selectedManagers.length} selected
              </span>
            </div>

            {managers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface p-3.5 text-center space-y-1">
                <p className="text-xs text-muted-foreground">
                  No manager accounts created yet.
                </p>
                <Link
                  href="/settings"
                  className="inline-block text-xs font-semibold text-accent underline"
                >
                  Create manager account in Settings
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {managers.map((mgr) => {
                  const isSelected = selectedManagers.includes(mgr.id);
                  return (
                    <button
                      key={mgr.id}
                      type="button"
                      onClick={() => toggleManager(mgr.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-accent bg-accent/5 ring-1 ring-accent"
                          : "border-border bg-surface hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                            isSelected
                              ? "bg-accent border-accent text-accent-foreground"
                              : "border-muted-foreground/40 bg-background"
                          }`}
                        >
                          {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {mgr.fullName ? (
                              <>
                                <span className="text-sm font-semibold text-foreground">
                                  {mgr.fullName}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  (@{mgr.username})
                                </span>
                              </>
                            ) : (
                              <span className="text-sm font-bold text-foreground font-mono">
                                @{mgr.username}
                              </span>
                            )}
                            <span className="text-[10px] rounded bg-secondary px-2 py-0.5 text-muted-foreground font-medium">
                              {mgr.assignedCourseCount} active courses
                            </span>
                          </div>
                          {(mgr.department || mgr.designation) && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {mgr.designation && <span>{mgr.designation}</span>}
                              {mgr.designation && mgr.department && <span> • </span>}
                              {mgr.department && <span>{mgr.department}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || groups.length === 0}
            className="w-full h-12 flex items-center justify-center rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Create Course"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
