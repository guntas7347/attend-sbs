"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopHeader from "@/components/TopHeader";
import ConfirmModal from "@/components/ConfirmModal";
import { useForm } from "@/hooks/useForm";
import { getGroupsAction } from "@/lib/actions/groups";
import {
  getCourseByIdAction,
  updateCourseAction,
  deleteCourseAction,
  archiveCourseAction,
  unarchiveCourseAction,
} from "@/lib/actions/courses";
import { getTeacherManagersAction } from "@/lib/actions/managers";
import { Archive, Check, Loader2, RotateCcw, Trash2, Users, UserCheck } from "lucide-react";

export default function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const { values, handleChange, setField } = useForm({
    name: "",
    code: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const [courseRes, groupsRes, managersRes] = await Promise.all([
          getCourseByIdAction(courseId),
          getGroupsAction(),
          getTeacherManagersAction(),
        ]);

        if (groupsRes.error === "FORBIDDEN" || managersRes.error === "FORBIDDEN") {
          router.replace("/courses");
          return;
        }

        if (courseRes.success && courseRes.course) {
          if (courseRes.course.isManager) {
            router.replace("/courses");
            return;
          }

          setCourse(courseRes.course);
          setField("name", courseRes.course.name);
          setField("code", courseRes.course.code || "");
          setTags(courseRes.course.tags || []);
          setIsOwner(courseRes.course.isOwner ?? false);
          setSelectedGroups(
            courseRes.course.courseGroups?.map((cg: any) => cg.groupId) || []
          );
          setSelectedManagers(
            courseRes.course.assignedManagers?.map((m: any) => m.id) || []
          );

          if (!courseRes.course.isOwner) {
            setError("Unauthorized: Only the course owner can edit this course.");
          }
        } else {
          setError(courseRes.error || "Course not found");
        }

        if (groupsRes.success && groupsRes.groups) {
          setGroups(groupsRes.groups);
        }
        if (managersRes.success && managersRes.managers) {
          setManagers(managersRes.managers);
        }
      } catch {
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, router]);

  function toggleGroup(groupId: string) {
    if (!isOwner) return;
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  }

  function toggleManager(managerId: string) {
    if (!isOwner) return;
    setSelectedManagers((prev) =>
      prev.includes(managerId)
        ? prev.filter((id) => id !== managerId)
        : [...prev, managerId]
    );
  }

  function handleAddTag(e?: React.KeyboardEvent | React.MouseEvent) {
    if (!isOwner) return;
    if (e && "key" in e && e.key !== "Enter" && e.key !== ",") return;
    if (e) e.preventDefault();
    const raw = tagInput.replace(/,/g, "").trim();
    if (raw && !tags.includes(raw)) {
      setTags([...tags, raw]);
    }
    setTagInput("");
  }

  function handleRemoveTag(tagToRemove: string) {
    if (!isOwner) return;
    setTags(tags.filter((t) => t !== tagToRemove));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;

    if (selectedGroups.length === 0) {
      setError("Please select at least one group for this course");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      const res = await updateCourseAction(courseId, {
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
        setError(res.error || "Failed to update course");
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleArchive() {
    setArchiving(true);
    try {
      const isArchived = course?.isArchived;
      const res = isArchived
        ? await unarchiveCourseAction(courseId)
        : await archiveCourseAction(courseId);

      if (res.success) {
        setShowArchiveModal(false);
        router.push("/courses");
        router.refresh();
      } else {
        setError(res.error || "Failed to update course archive status");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setArchiving(false);
    }
  }

  async function handleDeleteCourse() {
    setDeleting(true);
    try {
      const res = await deleteCourseAction(courseId);
      if (res.success) {
        setShowDeleteModal(false);
        router.push("/courses");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete course");
      }
    } catch {
      setError("An unexpected error occurred while deleting course");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopHeader title="Edit Course" backHref="/courses" />

      <div className="flex-1 p-4 space-y-6 pb-20">
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
              disabled={!isOwner}
              value={values.name}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="code"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Course Code{" "}
              <span className="text-muted-foreground font-normal">
                (Optional)
              </span>
            </label>
            <input
              id="code"
              name="code"
              type="text"
              disabled={!isOwner}
              value={values.code}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
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
                  disabled={!isOwner}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tags e.g. 2023, Sem-IV, Morning Batch..."
                  className="flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!isOwner || !tagInput.trim()}
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
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-danger text-accent/70 ml-0.5"
                        >
                          ×
                        </button>
                      )}
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

            <div className="space-y-2">
              {groups.map((group) => {
                const isSelected = selectedGroups.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    disabled={!isOwner}
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
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        )}
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
                      <span>{group._count?.students || 0}</span>
                    </div>
                  </button>
                );
              })}
            </div>
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
                      disabled={!isOwner}
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
            disabled={saving || !isOwner || selectedGroups.length === 0}
            className="w-full h-12 flex items-center justify-center rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-sm"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </form>

        {isOwner && (
          <div className="pt-6 border-t border-border space-y-4">
            {/* Archive / Unarchive Card */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Archive className="h-3.5 w-3.5 text-accent" />
                  {course?.isArchived ? "Course Archived" : "Archive Course (Completed)"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {course?.isArchived
                    ? "This course is archived and marked as completed. You can restore it anytime."
                    : "If this course has finished its term/semester, archive it to keep your active dashboard clean while preserving all attendance history."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowArchiveModal(true)}
                className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl border text-xs font-bold active:scale-95 transition-all ${
                  course?.isArchived
                    ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
                    : "border-border bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                {course?.isArchived ? (
                  <>
                    <RotateCcw className="h-4 w-4" />
                    <span>Restore / Unarchive Course</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 text-muted-foreground" />
                    <span>Archive Course</span>
                  </>
                )}
              </button>
            </div>

            {/* Danger Zone */}
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-danger uppercase tracking-wider">
                  Danger Zone
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete this course (only if no attendance sessions exist), or safely archive it.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-surface text-danger text-xs font-bold hover:bg-danger/10 active:scale-95 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Course</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleToggleArchive}
        title={course?.isArchived ? "Unarchive Course" : "Archive Course"}
        description={
          course?.isArchived
            ? "Restore this course back to active status? It will appear on your active courses dashboard again."
            : "Are you sure you want to archive this course? It will be marked as completed and hidden from your active list, but all attendance history and records will remain safely preserved."
        }
        confirmText={course?.isArchived ? "Restore Course" : "Archive Course"}
        confirmVariant="primary"
        loading={archiving}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        description="Are you sure you want to delete this course? If it has historical attendance sessions, it will be safely archived without losing past records."
        confirmText="Delete Course"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
