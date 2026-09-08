"use client";

import { use, useEffect, useState, useTransition, useRef, useCallback } from "react";
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
  User,
  RotateCcw,
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

type CardFeedback = "NONE" | "PRESENT" | "ABSENT" | "SKIPPED" | "PREV";

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

  // Animation feedback state
  const [feedback, setFeedback] = useState<CardFeedback>("NONE");
  const isAnimatingRef = useRef(false);

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

  const triggerVibrate = (pattern: number | number[] = 15) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  const executeStatusCommit = useCallback(
    (status: "PRESENT" | "ABSENT" | "SKIPPED", studentId: string) => {
      // 1. Optimistic local state update
      setRecords((prev) =>
        prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
      );

      // 2. Fire async action in background (non-blocking)
      startTransition(async () => {
        try {
          await saveAttendanceRecordAction(sessionId, studentId, status);
        } catch (e) {
          console.error("Failed to save record:", e);
        }
      });
    },
    [sessionId]
  );

  const markStatusWithAnimation = useCallback(
    (status: "PRESENT" | "ABSENT" | "SKIPPED") => {
      if (!currentStudent || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      triggerVibrate(status === "PRESENT" ? [20, 10, 20] : 20);

      // Show instant feedback animation
      setFeedback(status);

      setTimeout(() => {
        executeStatusCommit(status, currentStudent.studentId);

        if (currentIndex < total - 1) {
          setCurrentIndex((prev) => prev + 1);
          setFeedback("NONE");
          isAnimatingRef.current = false;
        } else {
          isAnimatingRef.current = false;
          router.push(`/attendance/${sessionId}/review`);
        }
      }, 150);
    },
    [currentStudent, currentIndex, total, executeStatusCommit, sessionId, router]
  );

  const handlePreviousStudent = useCallback(() => {
    if (currentIndex <= 0 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    triggerVibrate(15);

    setFeedback("PREV");
    setCurrentIndex((prev) => prev - 1);

    setTimeout(() => {
      setFeedback("NONE");
      isAnimatingRef.current = false;
    }, 160);
  }, [currentIndex]);

  const handleNextStudent = useCallback(() => {
    if (isAnimatingRef.current) return;
    if (currentIndex < total - 1) {
      isAnimatingRef.current = true;
      setFeedback("SKIPPED");
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setFeedback("NONE");
        isAnimatingRef.current = false;
      }, 150);
    } else {
      router.push(`/attendance/${sessionId}/review`);
    }
  }, [currentIndex, total, sessionId, router]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (isAnimatingRef.current) return;

      if (e.key === "ArrowRight" || e.key === "p" || e.key === "P") {
        e.preventDefault();
        markStatusWithAnimation("PRESENT");
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        markStatusWithAnimation("ABSENT");
      } else if (e.key === " " || e.key === "s" || e.key === "S") {
        e.preventDefault();
        markStatusWithAnimation("SKIPPED");
      } else if (e.key === "ArrowUp" || e.key === "Backspace" || e.key === "b" || e.key === "B") {
        e.preventDefault();
        handlePreviousStudent();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [markStatusWithAnimation, handlePreviousStudent]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !session || records.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center space-y-3 bg-background">
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

  // Compute CSS dynamic animation styles based on feedback
  let cardAnimClass = "transition-all duration-150 ease-out";
  if (feedback === "PRESENT") {
    cardAnimClass = "scale-[0.98] translate-x-3 bg-success/10 border-success shadow-lg shadow-success/20 ring-4 ring-success/25 transition-all duration-150";
  } else if (feedback === "ABSENT") {
    cardAnimClass = "scale-[0.98] -translate-x-3 bg-danger/10 border-danger shadow-lg shadow-danger/20 ring-4 ring-danger/25 transition-all duration-150";
  } else if (feedback === "SKIPPED") {
    cardAnimClass = "scale-95 -translate-y-2 opacity-70 border-accent transition-all duration-150";
  } else if (feedback === "PREV") {
    cardAnimClass = "animate-in slide-in-from-left-4 fade-in duration-150";
  }

  return (
    <div className="flex flex-col min-h-screen bg-background select-none">
      {/* Top Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto w-full">
          <Link
            href={`/courses/${session.courseId}/mark`}
            className="flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-secondary text-foreground font-semibold text-xs hover:bg-muted active:scale-95 transition-all shrink-0"
            aria-label="Back to Course Sessions"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link>

          <div className="text-center min-w-0 flex-1 px-1">
            <h1 className="text-sm font-bold text-foreground leading-tight truncate">
              {session.courseName}
            </h1>
            <p className="text-[11px] text-muted-foreground truncate">{formattedDate}</p>
          </div>

          <Link
            href={`/attendance/${sessionId}/review`}
            className="flex h-10 items-center gap-1.5 px-3.5 rounded-xl border border-border bg-secondary text-foreground font-semibold text-xs hover:bg-muted active:scale-95 transition-all shadow-2xs shrink-0"
          >
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <span>Review</span>
          </Link>
        </div>

        {/* Progress Bar & Counters */}
        <div className="mt-3 space-y-1.5 max-w-lg mx-auto w-full">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span className="font-bold text-foreground">
              Student {currentIndex + 1} of {total}
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-success font-bold bg-success/10 px-2 py-0.5 rounded-md border border-success/20">
                {presentCount} Present
              </span>
              <span className="text-danger font-bold bg-danger/10 px-2 py-0.5 rounded-md border border-danger/20">
                {absentCount} Absent
              </span>
              <span className="text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded-md border border-border">
                {skippedCount} Skipped
              </span>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-between p-4 pb-6 space-y-4 max-w-md mx-auto w-full">
        {/* Highly Accessible Student Navigation Controls */}
        <div className="grid grid-cols-3 items-center gap-2 pt-1">
          {/* Previous Student Button */}
          <button
            onClick={handlePreviousStudent}
            disabled={currentIndex === 0}
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl border-2 border-border bg-surface text-foreground font-bold text-xs hover:bg-secondary active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
            title="Previous Student (ArrowUp / Backspace / B)"
          >
            <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
            <span>Previous</span>
          </button>

          {/* Current index indicator */}
          <div className="flex flex-col items-center justify-center py-1 rounded-xl bg-secondary/80 border border-border text-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">
              Student
            </span>
            <span className="font-mono font-black text-foreground text-sm leading-tight mt-0.5">
              {currentIndex + 1} / {total}
            </span>
          </div>

          {/* Next Student Button */}
          <button
            onClick={handleNextStudent}
            className="flex items-center justify-center gap-1.5 h-11 px-3 rounded-xl border-2 border-border bg-surface text-foreground font-bold text-xs hover:bg-secondary active:scale-95 transition-all shadow-2xs"
            title="Next Student (Review if last)"
          >
            <span>{currentIndex === total - 1 ? "Review" : "Next"}</span>
            <ChevronRight className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Attendance Card with Instant Visual Feedback */}
        <div
          className={`my-auto flex flex-col items-center justify-center rounded-3xl border-2 bg-surface p-6 shadow-md text-center space-y-4 relative overflow-hidden ${cardAnimClass} ${
            currentStudent?.status === "PRESENT"
              ? "border-success/40"
              : currentStudent?.status === "ABSENT"
              ? "border-danger/40"
              : "border-border"
          }`}
        >
          {/* Animated Feedback Overlay Stamp */}
          {feedback === "PRESENT" && (
            <div className="absolute inset-0 z-20 bg-success/15 backdrop-blur-[2px] flex items-center justify-center animate-in zoom-in-75 duration-100">
              <div className="flex items-center gap-2 rounded-2xl bg-success text-success-foreground px-5 py-2.5 font-black text-lg shadow-xl tracking-wider">
                <Check className="h-7 w-7 stroke-[3.5]" />
                <span>PRESENT</span>
              </div>
            </div>
          )}

          {feedback === "ABSENT" && (
            <div className="absolute inset-0 z-20 bg-danger/15 backdrop-blur-[2px] flex items-center justify-center animate-in zoom-in-75 duration-100">
              <div className="flex items-center gap-2 rounded-2xl bg-danger text-danger-foreground px-5 py-2.5 font-black text-lg shadow-xl tracking-wider">
                <X className="h-7 w-7 stroke-[3.5]" />
                <span>ABSENT</span>
              </div>
            </div>
          )}

          {feedback === "SKIPPED" && (
            <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] flex items-center justify-center animate-in zoom-in-75 duration-100">
              <div className="flex items-center gap-2 rounded-2xl bg-secondary text-foreground border border-border px-5 py-2 font-black text-sm shadow-xl tracking-wider">
                <SkipForward className="h-5 w-5 stroke-[2.5]" />
                <span>SKIPPED</span>
              </div>
            </div>
          )}

          {/* Group pill & Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center text-accent font-black text-xl shadow-2xs">
              {currentStudent?.name ? (
                currentStudent.name.charAt(0).toUpperCase()
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
            <span className="rounded-full bg-secondary border border-border px-3.5 py-1 text-[11px] font-semibold text-muted-foreground">
              {currentStudent?.groupName}
            </span>
          </div>

          {/* Student Name & Roll Number */}
          <div className="space-y-1.5 w-full">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight break-words">
              {currentStudent?.name}
            </h2>
            <div className="inline-block rounded-xl bg-accent/10 border border-accent/20 px-4 py-1 text-sm font-mono font-bold text-accent shadow-2xs">
              Roll No. {currentStudent?.rollNumber}
            </div>
          </div>

          {/* Father's name */}
          {currentStudent?.fatherName ? (
            <div className="pt-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Father&apos;s Name
              </span>
              <p className="text-sm font-semibold text-foreground">
                {currentStudent.fatherName}
              </p>
            </div>
          ) : (
            <div className="h-3" />
          )}

          {/* Current Status Pill */}
          <div className="pt-1">
            {currentStudent?.status === "PRESENT" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 border border-success/30 px-3.5 py-1 text-xs font-bold text-success shadow-2xs">
                <Check className="h-3.5 w-3.5 stroke-[3]" /> Currently Marked: Present
              </span>
            )}
            {currentStudent?.status === "ABSENT" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 border border-danger/30 px-3.5 py-1 text-xs font-bold text-danger shadow-2xs">
                <X className="h-3.5 w-3.5 stroke-[3]" /> Currently Marked: Absent
              </span>
            )}
            {currentStudent?.status === "SKIPPED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary border border-border px-3.5 py-1 text-xs font-semibold text-muted-foreground">
                <Minus className="h-3.5 w-3.5 stroke-[3]" /> Not Yet Marked (Skipped)
              </span>
            )}
          </div>
        </div>

        {/* Rapid Action Buttons - Touch friendly targets (> 56px height) */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-3">
            {/* ABSENT BUTTON */}
            <button
              onClick={() => markStatusWithAnimation("ABSENT")}
              type="button"
              className="h-15 flex items-center justify-center gap-2.5 rounded-2xl bg-danger text-danger-foreground font-black text-base tracking-wider uppercase hover:opacity-95 active:scale-[0.96] transition-all shadow-md active:shadow-xs"
              title="Mark Absent (Hotkey: A or ArrowLeft)"
            >
              <XCircle className="h-6 w-6 stroke-[2.5]" />
              <span>ABSENT</span>
            </button>

            {/* PRESENT BUTTON */}
            <button
              onClick={() => markStatusWithAnimation("PRESENT")}
              type="button"
              className="h-15 flex items-center justify-center gap-2.5 rounded-2xl bg-success text-success-foreground font-black text-base tracking-wider uppercase hover:opacity-95 active:scale-[0.96] transition-all shadow-md active:shadow-xs"
              title="Mark Present (Hotkey: P or ArrowRight)"
            >
              <CheckCircle className="h-6 w-6 stroke-[2.5]" />
              <span>PRESENT</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Quick Previous Button for direct bottom thumb reach */}
            <button
              onClick={handlePreviousStudent}
              disabled={currentIndex === 0}
              type="button"
              className="h-11 flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface text-foreground font-bold text-xs tracking-wide hover:bg-secondary active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs"
              title="Return to previous student"
            >
              <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Prev Student</span>
            </button>

            {/* SKIP BUTTON */}
            <button
              onClick={() => markStatusWithAnimation("SKIPPED")}
              type="button"
              className="h-11 flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface text-foreground font-bold text-xs tracking-wide hover:bg-secondary active:scale-[0.98] transition-all shadow-2xs"
              title="Skip for now (Hotkey: S or Space)"
            >
              <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Skip (Later)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
