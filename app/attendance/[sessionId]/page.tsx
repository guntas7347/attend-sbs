"use client";

import { use, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getSessionDetailsAction,
  saveAttendanceRecordAction,
} from "@/lib/actions/attendance";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  SkipForward,
  Loader2,
  ListFilter,
  Check,
  X,
  Minus,
} from "lucide-react";

interface RecordItem {
  recordId: string;
  studentId: string;
  name: string;
  rollNumber: string;
  fatherName: string | null;
  groupName: string;
  status: "PRESENT" | "ABSENT" | "SKIPPED";
  image: string | null;
}

export default function AttendanceMarkingPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      try {
        const res = await getSessionDetailsAction(sessionId);
        if (res.success && res.session) {
          setSession(res.session);
          const recs = (res.records as RecordItem[]) || [];
          setRecords(recs);

          // Find first unreviewed / SKIPPED student to start on if resuming
          const firstUnmarkedIndex = recs.findIndex((r) => r.status === "SKIPPED");
          if (firstUnmarkedIndex !== -1) {
            setCurrentIndex(firstUnmarkedIndex);
          }
        } else {
          setError(res.error || "Session not found");
        }
      } catch {
        setError("Failed to load attendance session");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  const total = records.length;
  const currentStudent = records[currentIndex];

  const presentCount = records.filter((r) => r.status === "PRESENT").length;
  const absentCount = records.filter((r) => r.status === "ABSENT").length;
  const skippedCount = records.filter((r) => r.status === "SKIPPED").length;

  function markStatus(status: "PRESENT" | "ABSENT" | "SKIPPED") {
    if (!currentStudent) return;

    const studentId = currentStudent.studentId;

    // 1. Optimistic local state update
    setRecords((prev) =>
      prev.map((r, idx) => (idx === currentIndex ? { ...r, status } : r))
    );

    // 2. Fire async action in background (non-blocking)
    startTransition(async () => {
      try {
        await saveAttendanceRecordAction(sessionId, studentId, status);
      } catch (e) {
        console.error("Failed to save record:", e);
      }
    });

    // 3. Immediately advance to next student
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Reached the end of roster -> Go to review
      router.push(`/attendance/${sessionId}/review`);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }

  function handleNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.push(`/attendance/${sessionId}/review`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !session || records.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center space-y-3">
        <p className="text-sm font-semibold text-danger">
          {error || "No students found in this session."}
        </p>
        <Link
          href="/courses"
          className="inline-flex h-10 items-center px-4 rounded-xl bg-secondary text-foreground text-xs font-semibold"
        >
          Return to Courses
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(session.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const progressPercent = total > 0 ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen bg-background select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            href={`/courses/${session.courseId}/mark`}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground active:scale-95 transition-transform"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="text-center">
            <h1 className="text-sm font-bold text-foreground leading-tight">
              {session.courseName}
            </h1>
            <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
          </div>

          <Link
            href={`/attendance/${sessionId}/review`}
            className="flex h-10 items-center gap-1.5 px-3 rounded-lg border border-border bg-secondary text-foreground font-semibold text-xs hover:bg-muted active:scale-95 transition-all"
          >
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <span>Review</span>
          </Link>
        </div>

        {/* Mini Progress Bar */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span className="font-semibold text-foreground">
              Student {currentIndex + 1} of {total}
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-success font-semibold">{presentCount} P</span>
              <span className="text-danger font-semibold">{absentCount} A</span>
              <span className="text-muted-foreground">{skippedCount} S</span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-accent transition-all duration-200 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Single-Student Card */}
      <div className="flex-1 flex flex-col justify-between p-4 pb-6 space-y-4">
        {/* Navigation jump pills */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-border bg-surface font-medium disabled:opacity-30 active:scale-95 transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="rounded-full bg-secondary px-3 py-1 font-mono font-bold text-foreground text-xs">
            {currentIndex + 1} / {total}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 py-1.5 px-3 rounded-lg border border-border bg-surface font-medium active:scale-95 transition-all"
          >
            <span>{currentIndex === total - 1 ? "Review" : "Next"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* The Card */}
        <div className="my-auto flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-6 shadow-sm text-center space-y-4 relative overflow-hidden">
          {/* Group pill */}
          <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {currentStudent?.groupName}
          </span>

          {/* Student Name */}
          <div className="space-y-1 w-full">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight break-words">
              {currentStudent?.name}
            </h2>
            <div className="inline-block rounded-xl bg-accent/10 px-4 py-1 text-sm font-mono font-bold text-accent">
              Roll No. {currentStudent?.rollNumber}
            </div>
          </div>

          {/* Father's name */}
          {currentStudent?.fatherName ? (
            <div className="pt-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Father&apos;s Name
              </span>
              <p className="text-sm font-medium text-foreground">
                {currentStudent.fatherName}
              </p>
            </div>
          ) : (
            <div className="h-4" />
          )}

          {/* Current Status Pill */}
          <div className="pt-2">
            {currentStudent?.status === "PRESENT" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                <Check className="h-3.5 w-3.5 stroke-[3]" /> Currently Marked: Present
              </span>
            )}
            {currentStudent?.status === "ABSENT" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger/15 px-3 py-1 text-xs font-bold text-danger">
                <X className="h-3.5 w-3.5 stroke-[3]" /> Currently Marked: Absent
              </span>
            )}
            {currentStudent?.status === "SKIPPED" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                <Minus className="h-3.5 w-3.5 stroke-[3]" /> Unresolved (Skipped)
              </span>
            )}
          </div>
        </div>

        {/* Rapid Action Buttons - Large Touch Targets (> 56px) */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => markStatus("PRESENT")}
            type="button"
            className="w-full h-15 flex items-center justify-center gap-3 rounded-2xl bg-success text-success-foreground font-extrabold text-base tracking-wide hover:opacity-95 active:scale-[0.98] transition-all shadow-sm"
          >
            <CheckCircle className="h-6 w-6 stroke-[2.5]" />
            <span>PRESENT</span>
          </button>

          <button
            onClick={() => markStatus("ABSENT")}
            type="button"
            className="w-full h-15 flex items-center justify-center gap-3 rounded-2xl bg-danger text-danger-foreground font-extrabold text-base tracking-wide hover:opacity-95 active:scale-[0.98] transition-all shadow-sm"
          >
            <XCircle className="h-6 w-6 stroke-[2.5]" />
            <span>ABSENT</span>
          </button>

          <button
            onClick={() => markStatus("SKIPPED")}
            type="button"
            className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-surface text-foreground font-bold text-sm tracking-wide hover:bg-muted active:scale-[0.98] transition-all"
          >
            <SkipForward className="h-4 w-4 text-muted-foreground" />
            <span>SKIP (Decide Later)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
