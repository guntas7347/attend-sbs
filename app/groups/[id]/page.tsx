"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import ConfirmModal from "@/components/ConfirmModal";
import { useForm } from "@/hooks/useForm";
import {
  getGroupByIdAction,
  addStudentAction,
  updateStudentAction,
  removeStudentAction,
  deleteGroupAction,
} from "@/lib/actions/groups";
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  FileSpreadsheet,
  Info,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export default function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Add Student Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [savingStudent, setSavingStudent] = useState(false);

  // Confirm Delete Student Modal
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
    rollNumber: string;
  } | null>(null);
  const [deletingStudent, setDeletingStudent] = useState(false);

  // Confirm Delete Group Modal
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const { values, handleChange, resetForm } = useForm({
    rollNumber: "",
    name: "",
    fatherName: "",
  });

  const {
    values: editValues,
    handleChange: handleEditChange,
    resetForm: resetEditForm,
  } = useForm({
    rollNumber: "",
    name: "",
    fatherName: "",
  });

  async function loadGroup() {
    try {
      const res = await getGroupByIdAction(groupId);
      if (res.error === "FORBIDDEN") {
        router.replace("/courses");
        return;
      }
      if (res.error === "UNAUTHORIZED") {
        router.replace("/login");
        return;
      }
      if (res.success && res.group) {
        setGroup(res.group);
      } else {
        setError(res.error || "Group not found");
      }
    } catch {
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAddingStudent(true);

    try {
      const res = await addStudentAction(groupId, {
        rollNumber: values.rollNumber,
        name: values.name,
        fatherName: values.fatherName,
      });

      if (res.success) {
        resetForm();
        setShowAddModal(false);
        setFeedback("Student added successfully");
        setTimeout(() => setFeedback(null), 3000);
        await loadGroup();
      } else {
        setError(res.error || "Failed to add student");
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setAddingStudent(false);
    }
  }

  function handleStartEditStudent(student: any) {
    setEditingStudent(student);
    resetEditForm({
      rollNumber: student.rollNumber || "",
      name: student.name || "",
      fatherName: student.fatherName || "",
    });
    setError(null);
  }

  async function handleSaveEditStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingStudent) return;
    setError(null);
    setSavingStudent(true);

    try {
      const res = await updateStudentAction(editingStudent.id, {
        name: editValues.name,
        rollNumber: editValues.rollNumber,
        fatherName: editValues.fatherName,
      });

      if (res.success) {
        setEditingStudent(null);
        setFeedback("Student details updated");
        setTimeout(() => setFeedback(null), 3000);
        await loadGroup();
      } else {
        setError(res.error || "Failed to update student");
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setSavingStudent(false);
    }
  }

  async function handleConfirmDeleteStudent() {
    if (!studentToDelete) return;
    setDeletingStudent(true);

    try {
      const res = await removeStudentAction(studentToDelete.id);
      if (res.success) {
        setStudentToDelete(null);
        setFeedback(res.message || "Student removed");
        setTimeout(() => setFeedback(null), 3500);
        await loadGroup();
      } else {
        setError(res.error || "Failed to remove student");
      }
    } catch {
      setError("Failed to remove student");
    } finally {
      setDeletingStudent(false);
    }
  }

  async function handleConfirmDeleteGroup() {
    setDeletingGroup(true);

    try {
      const res = await deleteGroupAction(groupId);
      if (res.success) {
        setShowDeleteGroupModal(false);
        router.push("/groups");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete group");
      }
    } catch {
      setError("An unexpected error occurred while deleting group");
    } finally {
      setDeletingGroup(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  const isOwner = group?.isOwner ?? false;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopHeader
        title={group?.name || "Group Details"}
        subtitle={`${group?.students?.length || 0} students`}
        backHref="/groups"
      />

      <div className="flex-1 p-4 space-y-4 pb-20">
        {/* Feedback / Error notifications */}
        {feedback && (
          <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-xs font-semibold text-success flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {error && !showAddModal && !editingStudent && (
          <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Ownership / Read-only notice */}
        {!isOwner && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 text-xs text-foreground flex items-center gap-2">
            <Info className="h-4 w-4 text-accent shrink-0" />
            <span>
              Shared Group &bull; Owned by{" "}
              <strong>@{group?.createdBy?.username || "another user"}</strong>.
              You can view and use this group for your courses.
            </span>
          </div>
        )}

        {/* Group Header Card */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {group?.name}
                </h2>
                {isOwner && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                    Owner
                  </span>
                )}
              </div>
              {group?.detail && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {group.detail}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                Created by <span className="font-semibold text-foreground">@{group?.createdBy?.username || "user"}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{group?.students?.length || 0} active</span>
            </div>
          </div>

          {/* Action Buttons for Group Owner */}
          {isOwner ? (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href={`/groups/${groupId}/edit`}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-muted active:scale-95 transition-all"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowAddModal(true);
                  }}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-xs"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>

                <Link
                  href={`/groups/${groupId}/import`}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-muted active:scale-95 transition-all"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
                  <span>Import</span>
                </Link>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteGroupModal(true)}
                  className="text-[11px] font-semibold text-muted-foreground hover:text-danger flex items-center gap-1 transition-colors px-1 py-0.5"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete or Archive Group</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-1 text-[11px] text-muted-foreground">
              Roster modifications can only be performed by the group owner.
            </div>
          )}
        </div>

        {/* Student List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Student Roster ({group?.students?.length || 0})
            </span>
          </div>

          {group?.students?.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                No active students in this group yet.
                {isOwner && " Add students manually or import via CSV/XLSX."}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {group?.students?.map((student: any) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary font-mono text-xs font-bold text-accent">
                      {student.rollNumber}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {student.name}
                      </div>
                      {student.fatherName && (
                        <div className="text-xs text-muted-foreground">
                          S/o {student.fatherName}
                        </div>
                      )}
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEditStudent(student)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95 transition-all"
                        title="Edit Student"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setStudentToDelete({
                            id: student.id,
                            name: student.name,
                            rollNumber: student.rollNumber,
                          })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 active:scale-95 transition-all"
                        title="Remove Student"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                Add Student
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Roll Number <span className="text-danger">*</span>
                </label>
                <input
                  name="rollNumber"
                  type="text"
                  required
                  value={values.rollNumber}
                  onChange={handleChange}
                  placeholder="e.g. 24"
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Student Name <span className="text-danger">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={values.name}
                  onChange={handleChange}
                  placeholder="e.g. Guntas Singh"
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Father&apos;s Name{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </label>
                <input
                  name="fatherName"
                  type="text"
                  value={values.fatherName}
                  onChange={handleChange}
                  placeholder="e.g. Balwinder Singh"
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 rounded-xl border border-border bg-secondary text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingStudent}
                  className="flex-1 h-11 flex items-center justify-center rounded-xl bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-50"
                >
                  {addingStudent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add Student"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                Edit Student Details
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEditStudent} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Roll Number <span className="text-danger">*</span>
                </label>
                <input
                  name="rollNumber"
                  type="text"
                  required
                  value={editValues.rollNumber}
                  onChange={handleEditChange}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Student Name <span className="text-danger">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={editValues.name}
                  onChange={handleEditChange}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Father&apos;s Name{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </label>
                <input
                  name="fatherName"
                  type="text"
                  value={editValues.fatherName}
                  onChange={handleEditChange}
                  className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 h-11 rounded-xl border border-border bg-secondary text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="flex-1 h-11 flex items-center justify-center rounded-xl bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-50"
                >
                  {savingStudent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Student Modal */}
      <ConfirmModal
        isOpen={Boolean(studentToDelete)}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleConfirmDeleteStudent}
        title="Remove Student"
        description={`Are you sure you want to remove "${studentToDelete?.name}" (Roll #${studentToDelete?.rollNumber})? If this student has historical attendance, their past records will be safely preserved.`}
        confirmText="Remove Student"
        confirmVariant="danger"
        loading={deletingStudent}
      />

      {/* Confirm Delete Group Modal */}
      <ConfirmModal
        isOpen={showDeleteGroupModal}
        onClose={() => setShowDeleteGroupModal(false)}
        onConfirm={handleConfirmDeleteGroup}
        title="Delete or Archive Group"
        description={`Are you sure you want to delete "${group?.name}"? If it has been used in courses or past attendance, it will be safely archived without deleting past attendance records. Unused groups will be permanently removed.`}
        confirmText="Delete / Archive Group"
        confirmVariant="danger"
        loading={deletingGroup}
      />
    </div>
  );
}
