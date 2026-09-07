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
} from "@/lib/actions/courses";
import { Check, Loader2, Trash2, Users } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { values, handleChange, setField } = useForm({
    name: "",
    code: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const [courseRes, groupsRes] = await Promise.all([
          getCourseByIdAction(courseId),
          getGroupsAction(),
        ]);

        if (courseRes.success && courseRes.course) {
          setCourse(courseRes.course);
          setField("name", courseRes.course.name);
          setField("code", courseRes.course.code || "");
          setIsOwner(courseRes.course.isOwner ?? false);
          setSelectedGroups(
            courseRes.course.courseGroups?.map((cg: any) => cg.groupId) || []
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
      } catch {
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  function toggleGroup(groupId: string) {
    if (!isOwner) return;
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
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
        groupIds: selectedGroups,
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
          <div className="pt-6 border-t border-border">
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-danger uppercase tracking-wider">
                  Danger Zone
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deleting this course will archive it if historical attendance sessions exist, or permanently remove it if unused.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-surface text-danger text-xs font-bold hover:bg-danger/10 active:scale-95 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete or Archive Course</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCourse}
        title="Delete Course"
        description="Are you sure you want to delete this course? If it has historical attendance sessions, it will be safely archived without losing past records."
        confirmText="Delete / Archive Course"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
