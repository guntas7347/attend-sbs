"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import ConfirmModal from "@/components/ConfirmModal";
import {
  getSessionViewAction,
  deleteAttendanceSessionAction,
} from "@/lib/actions/attendance";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Minus,
  Trash2,
  XCircle,
} from "lucide-react";

export default function AttendanceViewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getSessionViewAction(sessionId);
        if (res.success && res.session) {
          setSession(res.session);
          setRecords(res.records || []);
        } else {
          setError(res.error || "Session not found");
        }
      } catch (e) {
        console.error("Failed to load session details", e);
        setError("Failed to load session details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

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

  const formattedDate = session?.date
    ? new Date(session.date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopHeader
        title="Session Details"
        subtitle={session?.courseName}
        backHref={session ? `/courses/${session.courseId}/history` : "/courses"}
      />

      <div className="flex-1 p-4 space-y-4 pb-20">
        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Card */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {session?.courseCode ? `${session.courseCode} • ` : ""}
                {formattedDate}
              </span>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                {session?.courseName}
              </h2>
              {session?.note && (
                <p className="text-xs text-muted-foreground mt-1 bg-secondary p-2 rounded-lg">
                  {session.note}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-danger/20 bg-danger/5 text-danger text-xs font-semibold hover:bg-danger/10 active:scale-95 transition-all shrink-0"
              title="Delete this session"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="rounded-xl bg-success/10 border border-success/20 p-2.5">
              <div className="text-lg font-black text-success">
                {session?.present}
              </div>
              <div className="text-[10px] font-bold text-success">PRESENT</div>
            </div>
            <div className="rounded-xl bg-danger/10 border border-danger/20 p-2.5">
              <div className="text-lg font-black text-danger">
                {session?.absent}
              </div>
              <div className="text-[10px] font-bold text-danger">ABSENT</div>
            </div>
            <div className="rounded-xl bg-secondary border border-border p-2.5">
              <div className="text-lg font-black text-foreground">
                {session?.skipped}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground">
                SKIPPED
              </div>
            </div>
          </div>
        </div>

        {/* Student Records List */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Attendance Records ({records.length})
          </h3>

          <div className="space-y-1.5">
            {records.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                      #{r.rollNumber}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {r.name}
                    </span>
                  </div>
                  {r.fatherName && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      S/o {r.fatherName}
                    </div>
                  )}
                </div>

                <div>
                  {r.status === "PRESENT" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-bold text-success">
                      <CheckCircle className="h-3.5 w-3.5" /> Present
                    </span>
                  )}
                  {r.status === "ABSENT" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-2.5 py-1 text-xs font-bold text-danger">
                      <XCircle className="h-3.5 w-3.5" /> Absent
                    </span>
                  )}
                  {r.status === "SKIPPED" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      <Minus className="h-3.5 w-3.5" /> Skipped
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSession}
        title="Delete Attendance Record"
        description="Are you sure you want to permanently delete this attendance session and all its marked records? This action cannot be undone."
        confirmText="Delete Attendance"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
