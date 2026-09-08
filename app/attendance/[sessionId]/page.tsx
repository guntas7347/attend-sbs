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
  Sparkles,
  User,
  ArrowRight,
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

type AnimationDirection =
  | "none"
  | "swipe-right"
  | "swipe-left"
  | "swipe-up"
  | "enter-from-left"
  | "enter-from-scale";

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

  // Gesture & Animation State
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animDirection, setAnimDirection] = useState<AnimationDirection>("none");
  const isAnimatingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; time: number }>({
    x: 0,
    y: 0,
    time: 0,
  });

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
  const nextStudent = currentIndex + 1 < total ? records[currentIndex + 1] : null;

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

  const triggerAction = useCallback(
    (status: "PRESENT" | "ABSENT" | "SKIPPED", direction: "swipe-right" | "swipe-left" | "swipe-up") => {
      if (!currentStudent || isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      triggerVibrate(direction === "swipe-right" ? [20, 10, 20] : 20);

      setAnimDirection(direction);

      setTimeout(() => {
        executeStatusCommit(status, currentStudent.studentId);
        setDragOffset({ x: 0, y: 0 });

        if (currentIndex < total - 1) {
          setCurrentIndex((prev) => prev + 1);
          setAnimDirection("enter-from-scale");
          setTimeout(() => {
            setAnimDirection("none");
            isAnimatingRef.current = false;
          }, 160);
        } else {
          isAnimatingRef.current = false;
          router.push(`/attendance/${sessionId}/review`);
        }
      }, 170);
    },
    [currentStudent, currentIndex, total, executeStatusCommit, sessionId, router]
  );

  const handlePrev = useCallback(() => {
    if (currentIndex <= 0 || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    triggerVibrate(15);

    setAnimDirection("enter-from-left");
    setCurrentIndex((prev) => prev - 1);
    setDragOffset({ x: 0, y: 0 });

    setTimeout(() => {
      setAnimDirection("none");
      isAnimatingRef.current = false;
    }, 200);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (isAnimatingRef.current) return;
    if (currentIndex < total - 1) {
      isAnimatingRef.current = true;
      setAnimDirection("swipe-up");
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setDragOffset({ x: 0, y: 0 });
        setAnimDirection("enter-from-scale");
        setTimeout(() => {
          setAnimDirection("none");
          isAnimatingRef.current = false;
        }, 160);
      }, 170);
    } else {
      router.push(`/attendance/${sessionId}/review`);
    }
  }, [currentIndex, total, sessionId, router]);

  // Pointer / Touch Gestures for Card Swiping
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isAnimatingRef.current) return;
    // Don't capture if clicking buttons directly
    if ((e.target as HTMLElement).closest("button, a")) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    setIsDragging(true);
    setAnimDirection("none");
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    setIsDragging(false);

    const dx = dragOffset.x;
    const dy = dragOffset.y;
    const elapsed = Date.now() - dragStartRef.current.time;
    const velocityX = Math.abs(dx) / (elapsed || 1);

    const SWIPE_THRESHOLD = 75;
    const VELOCITY_THRESHOLD = 0.45;

    // Swipe Right -> PRESENT
    if (dx > SWIPE_THRESHOLD || (dx > 35 && velocityX > VELOCITY_THRESHOLD)) {
      triggerAction("PRESENT", "swipe-right");
    }
    // Swipe Left -> ABSENT
    else if (dx < -SWIPE_THRESHOLD || (dx < -35 && velocityX > VELOCITY_THRESHOLD)) {
      triggerAction("ABSENT", "swipe-left");
    }
    // Swipe Up -> SKIP
    else if (dy < -80) {
      triggerAction("SKIPPED", "swipe-up");
    }
    // Swipe Down / Reverse drag when at start
    else if (dy > 90 && currentIndex > 0) {
      handlePrev();
    }
    // Rebound back to center
    else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if in inputs
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (isAnimatingRef.current) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        triggerAction("PRESENT", "swipe-right");
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        triggerAction("ABSENT", "swipe-left");
      } else if (e.key === "ArrowDown" || e.code === "Space") {
        e.preventDefault();
        triggerAction("SKIPPED", "swipe-up");
      } else if (e.key === "ArrowUp" || e.key === "Backspace") {
        e.preventDefault();
        handlePrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [triggerAction, handlePrev]);

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

  // Dynamic stamp opacities during drag/swipe
  const rightProgress = isDragging
    ? Math.min(Math.max((dragOffset.x - 15) / 60, 0), 1)
    : animDirection === "swipe-right"
    ? 1
    : 0;

  const leftProgress = isDragging
    ? Math.min(Math.max((-dragOffset.x - 15) / 60, 0), 1)
    : animDirection === "swipe-left"
    ? 1
    : 0;

  const upProgress = isDragging
    ? Math.min(Math.max((-dragOffset.y - 20) / 60, 0), 1)
    : animDirection === "swipe-up"
    ? 1
    : 0;

  // Compute transform styles for active card
  let cardTransform = "";
  let cardTransition = "none";
  let cardOpacity = 1;

  if (isDragging) {
    const rotation = dragOffset.x * 0.07;
    cardTransform = `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.4}px, 0) rotate(${rotation}deg)`;
    cardTransition = "none";
  } else {
    if (animDirection === "swipe-right") {
      cardTransform = "translate3d(125vw, 20px, 0) rotate(18deg)";
      cardOpacity = 0;
      cardTransition = "transform 170ms cubic-bezier(0.2, 0, 0.2, 1), opacity 170ms ease-out";
    } else if (animDirection === "swipe-left") {
      cardTransform = "translate3d(-125vw, 20px, 0) rotate(-18deg)";
      cardOpacity = 0;
      cardTransition = "transform 170ms cubic-bezier(0.2, 0, 0.2, 1), opacity 170ms ease-out";
    } else if (animDirection === "swipe-up") {
      cardTransform = "translate3d(0, -90px, 0) scale(0.92)";
      cardOpacity = 0;
      cardTransition = "transform 170ms ease-in, opacity 170ms ease-out";
    } else if (animDirection === "enter-from-left") {
      cardTransform = "translate3d(0, 0, 0) rotate(0deg)";
      cardOpacity = 1;
      cardTransition = "transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out";
    } else if (animDirection === "enter-from-scale") {
      cardTransform = "translate3d(0, 0, 0) scale(1)";
      cardOpacity = 1;
      cardTransition = "transform 160ms cubic-bezier(0.16, 1, 0.3, 1), opacity 160ms ease-out";
    } else {
      cardTransform = "translate3d(0, 0, 0) rotate(0deg) scale(1)";
      cardOpacity = 1;
      cardTransition = "transform 250ms cubic-bezier(0.175, 0.885, 0.32, 1.18), opacity 200ms ease-out";
    }
  }

  // Calculate subtle stack scale of underneath card
  const dragDistance = Math.sqrt(dragOffset.x * dragOffset.x + dragOffset.y * dragOffset.y);
  const dragInfluence = Math.min(dragDistance / 150, 1);
  const nextCardScale = 0.95 + 0.05 * dragInfluence;
  const nextCardTranslateY = 10 - 10 * dragInfluence;
  const nextCardOpacity = 0.6 + 0.4 * dragInfluence;

  return (
    <div className="flex flex-col min-h-screen bg-background select-none overflow-hidden touch-manipulation">
      {/* Top Header */}
      <div className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md px-4 py-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <Link
            href={`/courses/${session.courseId}/mark`}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-foreground active:scale-95 transition-transform"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="text-center max-w-[200px] truncate">
            <h1 className="text-sm font-bold text-foreground leading-tight truncate">
              {session.courseName}
            </h1>
            <p className="text-[11px] text-muted-foreground">{formattedDate}</p>
          </div>

          <Link
            href={`/attendance/${sessionId}/review`}
            className="flex h-10 items-center gap-1.5 px-3.5 rounded-xl border border-border bg-secondary text-foreground font-semibold text-xs hover:bg-muted active:scale-95 transition-all shadow-2xs"
          >
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <span>Review</span>
          </Link>
        </div>

        {/* Mini Progress Bar */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span className="font-bold text-foreground">
              Student {currentIndex + 1} of {total}
            </span>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-success font-bold bg-success/10 px-1.5 py-0.5 rounded">
                {presentCount} P
              </span>
              <span className="text-danger font-bold bg-danger/10 px-1.5 py-0.5 rounded">
                {absentCount} A
              </span>
              <span className="text-muted-foreground font-medium bg-secondary px-1.5 py-0.5 rounded">
                {skippedCount} S
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/80">
            <div
              className="h-full bg-accent transition-all duration-250 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Deck Area */}
      <div className="flex-1 flex flex-col justify-between p-4 pb-5 space-y-3 max-w-md mx-auto w-full">
        {/* Navigation jump pills */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-border bg-surface font-semibold disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-2xs hover:bg-secondary"
            title="Previous Student (Swipe Down / Backspace / ArrowUp)"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <span className="rounded-full bg-secondary border border-border px-3 py-1 font-mono font-bold text-foreground text-xs shadow-2xs">
            {currentIndex + 1} / {total}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-border bg-surface font-semibold active:scale-95 transition-all shadow-2xs hover:bg-secondary"
            title="Next Student"
          >
            <span>{currentIndex === total - 1 ? "Review" : "Next"}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Stack Deck Container */}
        <div className="relative my-auto w-full min-h-[340px] flex items-center justify-center">
          {/* Background Card (Deck Peek for tactile depth) */}
          {nextStudent && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-border bg-surface/90 p-6 text-center space-y-4 shadow-sm pointer-events-none transition-all duration-200"
              style={{
                transform: `scale(${nextCardScale}) translateY(${nextCardTranslateY}px)`,
                opacity: nextCardOpacity,
                zIndex: 1,
              }}
            >
              <span className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                {nextStudent.groupName}
              </span>
              <div className="space-y-1 w-full opacity-60">
                <h3 className="text-xl font-bold text-foreground tracking-tight line-clamp-2">
                  {nextStudent.name}
                </h3>
                <div className="inline-block rounded-lg bg-accent/10 px-3 py-0.5 text-xs font-mono font-bold text-accent">
                  Roll No. {nextStudent.rollNumber}
                </div>
              </div>
            </div>
          )}

          {/* Active Interactive Swiping Card */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              transform: cardTransform,
              transition: cardTransition,
              opacity: cardOpacity,
              zIndex: 10,
              touchAction: "none",
            }}
            className={`relative w-full flex flex-col items-center justify-center rounded-3xl border-2 bg-surface p-6 shadow-md text-center space-y-4 cursor-grab active:cursor-grabbing select-none transition-colors duration-150 ${
              rightProgress > 0.3
                ? "border-success shadow-success/20 ring-4 ring-success/20"
                : leftProgress > 0.3
                ? "border-danger shadow-danger/20 ring-4 ring-danger/20"
                : upProgress > 0.3
                ? "border-accent ring-4 ring-accent/20"
                : "border-border shadow-md"
            }`}
          >
            {/* Dynamic Stamp Overlays */}
            {/* PRESENT STAMP (Right Swipe) */}
            <div
              className="pointer-events-none absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-2xl border-[3px] border-success bg-success/20 backdrop-blur-md px-3.5 py-1.5 text-success font-black text-sm tracking-wider uppercase shadow-md transition-opacity duration-75"
              style={{
                opacity: rightProgress,
                transform: `rotate(${10 + rightProgress * 5}deg) scale(${0.85 + rightProgress * 0.25})`,
              }}
            >
              <Check className="h-5 w-5 stroke-[3.5]" />
              <span>PRESENT</span>
            </div>

            {/* ABSENT STAMP (Left Swipe) */}
            <div
              className="pointer-events-none absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-2xl border-[3px] border-danger bg-danger/20 backdrop-blur-md px-3.5 py-1.5 text-danger font-black text-sm tracking-wider uppercase shadow-md transition-opacity duration-75"
              style={{
                opacity: leftProgress,
                transform: `rotate(${-10 - leftProgress * 5}deg) scale(${0.85 + leftProgress * 0.25})`,
              }}
            >
              <X className="h-5 w-5 stroke-[3.5]" />
              <span>ABSENT</span>
            </div>

            {/* SKIP STAMP (Up Swipe) */}
            <div
              className="pointer-events-none absolute top-4 inset-x-0 mx-auto w-fit z-20 flex items-center gap-1.5 rounded-2xl border-[3px] border-muted-foreground bg-secondary/90 backdrop-blur-md px-4 py-1.5 text-muted-foreground font-black text-xs tracking-wider uppercase shadow-md transition-opacity duration-75"
              style={{
                opacity: upProgress,
                transform: `scale(${0.9 + upProgress * 0.2})`,
              }}
            >
              <SkipForward className="h-4 w-4 stroke-[3]" />
              <span>SKIP</span>
            </div>

            {/* Group pill & Avatar Icon */}
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-black text-lg">
                {currentStudent?.name ? currentStudent.name.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
              </div>
              <span className="rounded-full bg-secondary border border-border px-3.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {currentStudent?.groupName}
              </span>
            </div>

            {/* Student Name */}
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
              <div className="h-2" />
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

            {/* Swipe hints / drag guidance */}
            <div className="pt-2 flex items-center justify-between w-full text-[10px] font-semibold text-muted-foreground/70 px-2">
              <span className="flex items-center gap-1 text-danger/80">
                <ChevronLeft className="h-3 w-3" /> Swipe Left (Absent)
              </span>
              <span className="flex items-center gap-1 text-success/80">
                Swipe Right (Present) <ChevronRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </div>

        {/* Rapid Action Buttons with large touch targets (> 56px) */}
        <div className="space-y-2.5 pt-1">
          <div className="grid grid-cols-2 gap-2.5">
            {/* ABSENT (Left Swipe Action) */}
            <button
              onClick={() => triggerAction("ABSENT", "swipe-left")}
              type="button"
              className="h-14 flex items-center justify-center gap-2 rounded-2xl bg-danger text-danger-foreground font-black text-sm tracking-wider uppercase hover:opacity-95 active:scale-[0.96] transition-all shadow-sm border border-danger-foreground/10"
              title="Mark Absent (Swipe Left or ArrowLeft)"
            >
              <XCircle className="h-5 w-5 stroke-[2.5]" />
              <span>ABSENT</span>
            </button>

            {/* PRESENT (Right Swipe Action) */}
            <button
              onClick={() => triggerAction("PRESENT", "swipe-right")}
              type="button"
              className="h-14 flex items-center justify-center gap-2 rounded-2xl bg-success text-success-foreground font-black text-sm tracking-wider uppercase hover:opacity-95 active:scale-[0.96] transition-all shadow-sm border border-success-foreground/10"
              title="Mark Present (Swipe Right or ArrowRight)"
            >
              <CheckCircle className="h-5 w-5 stroke-[2.5]" />
              <span>PRESENT</span>
            </button>
          </div>

          {/* SKIP (Decide Later) */}
          <button
            onClick={() => triggerAction("SKIPPED", "swipe-up")}
            type="button"
            className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface text-foreground font-bold text-xs tracking-wide hover:bg-secondary active:scale-[0.98] transition-all shadow-2xs"
            title="Skip for now (Swipe Up or Space / ArrowDown)"
          >
            <SkipForward className="h-4 w-4 text-muted-foreground" />
            <span>SKIP (Decide Later)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

