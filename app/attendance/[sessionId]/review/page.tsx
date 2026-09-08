"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopHeader from "@/components/TopHeader";
import ConfirmModal from "@/components/ConfirmModal";
import {
  getSessionDetailsAction,
  saveAttendanceRecordAction,
  completeAttendanceSessionAction,
  deleteAttendanceSessionAction,
} from "@/lib/actions/attendance";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  HelpCircle,
  Loader2,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

export default function AttendanceReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isManager, setIsManager] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PRESENT" | "ABSENT" | "SKIPPED">("ALL");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      try {
        const res = await getSessionDetailsAction(sessionId);
        if (res.success && res.session) {
          setSession(res.session);
          setRecords(res.records || []);
          setIsManager(res.isManager || false);
        } else {
          setError(res.error || "Failed to load session details");
        }
      } catch (e) {
        console.error("Failed to load review data", e);
        setError("Failed to load review data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  function changeStatus(studentId: string, status: "PRESENT" | "ABSENT" | "SKIPPED") {
    // Optimistic update
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );

    // Save in background
    startTransition(async () => {
      try {
        await saveAttendanceRecordAction(sessionId, studentId, status);
      } catch (e) {
        console.error("Failed to update status in review", e);
      }
    });
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      const res = await completeAttendanceSessionAction(sessionId);
      if (res.success) {
        if (res.isManager || isManager) {
          router.push("/courses");
        } else {
          router.push(`/courses/${res.courseId}/history`);
        }
        router.refresh();
      } else {
        setError(res.error || "Failed to complete session");
      }
    } catch (e) {
      console.error("Failed to complete session", e);
      setError("Failed to complete session");
    } finally {
      setCompleting(false);
    }
  }

  async function handleDeleteSession() {
    setDeleting(true);
    try {
      const res = await deleteAttendanceSessionAction(sessionId);
      if (res.success) {
        setShowDeleteModal(false);
        router.push(`/courses/${res.courseId}/history`);
        router.refresh();
      } else {
        setError(res.error || "Failed to delete attendance session");
      }
    } catch {
      setError("An unexpected error occurred while deleting attendance");
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

  const total = records.length;
  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const skippedCount = records.filter((r) => r.status === "SKIPPED").length;

  const filteredRecords = records.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopHeader
        title="Review Attendance"
        subtitle={session?.courseName}
        backHref={`/attendance/${sessionId}`}
      />

      <div className="flex-1 p-4 space-y-4 pb-28">
        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Card Metrics */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Session Summary
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-foreground">
                Total: {total}
              </span>
              {!isManager && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="text-[11px] font-semibold text-danger hover:underline flex items-center gap-1"
                  title="Discard / Delete Session"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Delete Session</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <button
              onClick={() => setFilter(filter === "PRESENT" ? "ALL" : "PRESENT")}
              className={`rounded-xl border p-2.5 transition-all ${
                filter === "PRESENT"
                  ? "border-success bg-success/15 ring-2 ring-success"
                  : "border-success/30 bg-success/10 hover:bg-success/15"
              }`}
            >
              <div className="text-xl font-black text-success">{presentCount}</div>
              <div className="text-[11px] font-bold text-success/90">PRESENT</div>
            </button>

            <button
              onClick={() => setFilter(filter === "ABSENT" ? "ALL" : "ABSENT")}
              className={`rounded-xl border p-2.5 transition-all ${
                filter === "ABSENT"
                  ? "border-danger bg-danger/15 ring-2 ring-danger"
                  : "border-danger/30 bg-danger/10 hover:bg-danger/15"
              }`}
            >
              <div className="text-xl font-black text-danger">{absentCount}</div>
              <div className="text-[11px] font-bold text-danger/90">ABSENT</div>
            </button>

            <button
              onClick={() => setFilter(filter === "SKIPPED" ? "ALL" : "SKIPPED")}
              className={`rounded-xl border p-2.5 transition-all ${
                filter === "SKIPPED"
                  ? "border-accent bg-secondary ring-2 ring-accent"
                  : "border-border bg-secondary hover:bg-muted"
              }`}
            >
              <div className="text-xl font-black text-foreground">{skippedCount}</div>
              <div className="text-[11px] font-bold text-muted-foreground">SKIPPED</div>
            </button>
          </div>

          {skippedCount > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                {skippedCount} student{skippedCount > 1 ? "s" : ""} skipped. You can review them below before finalizing.
              </span>
            </div>
          )}
        </div>

        {/* Student Roster List with Inline Status Modifiers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student Roster ({filteredRecords.length})
            </span>
            {filter !== "ALL" && (
              <button
                onClick={() => setFilter("ALL")}
                className="text-xs text-accent font-semibold"
              >
                Show All
              </button>
            )}
          </div>

          <div className="space-y-2">
            {filteredRecords.map((item) => (
              <div
                key={item.studentId}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 transition-colors"
              >
                <div className="pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                      #{item.rollNumber}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {item.name}
                    </span>
                  </div>
                  {item.fatherName && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      S/o {item.fatherName}
                    </div>
                  )}
                </div>

                {/* 3-State Toggle Switch */}
                <div className="flex items-center rounded-lg border border-border bg-secondary p-0.5 gap-0.5">
                  <button
                    type="button"
                    onClick={() => changeStatus(item.studentId, "PRESENT")}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-all ${
                      item.status === "PRESENT"
                        ? "bg-success text-success-foreground shadow-xs scale-105"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Mark Present"
                  >
                    P
                  </button>
                  <button
                    type="button"
                    onClick={() => changeStatus(item.studentId, "ABSENT")}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-all ${
                      item.status === "ABSENT"
                        ? "bg-danger text-danger-foreground shadow-xs scale-105"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Mark Absent"
                  >
                    A
                  </button>
                  <button
                    type="button"
                    onClick={() => changeStatus(item.studentId, "SKIPPED")}
                    className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold transition-all ${
                      item.status === "SKIPPED"
                        ? "bg-foreground text-background shadow-xs scale-105"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Mark Skipped"
                  >
                    -
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-sm p-4 shadow-lg">
        <div className="mx-auto max-w-md flex items-center gap-3">
          <Link
            href={`/attendance/${sessionId}`}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-foreground font-semibold text-xs hover:bg-muted active:scale-95 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Card Mode</span>
          </Link>

          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex h-12 flex-2 items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
          >
            {completing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>Complete Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSession}
        title="Delete Attendance Session"
        description="Are you sure you want to permanently discard and delete this attendance session? All marked records for this session will be permanently removed."
        confirmText="Delete Session"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
