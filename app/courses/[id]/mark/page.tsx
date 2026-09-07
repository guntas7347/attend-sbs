"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import { useForm } from "@/hooks/useForm";
import { getCourseByIdAction } from "@/lib/actions/courses";
import { getOrCreateSessionAction } from "@/lib/actions/attendance";
import { Calendar, FileText, Loader2, Play, Users } from "lucide-react";

export default function MarkAttendanceSetupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);
  const router = useRouter();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to today in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const { values, handleChange } = useForm({
    date: today,
    note: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await getCourseByIdAction(courseId);
        if (res.success && res.course) {
          setCourse(res.course);
        } else {
          setError(res.error || "Course not found");
        }
      } catch {
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  async function handleStartAttendance(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;

    if (course.totalStudents === 0) {
      setError("This course has no students in its assigned groups. Add students to groups first.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await getOrCreateSessionAction(courseId, values.date, values.note);
      if (res.success && res.sessionId) {
        router.push(`/attendance/${res.sessionId}`);
      } else {
        setError(res.error || "Failed to start attendance session");
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopHeader title="Mark Attendance" backHref="/courses" />
        <div className="flex-1 flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader
        title="Start Attendance"
        subtitle={course?.name}
        backHref="/courses"
      />

      <div className="flex-1 p-4 space-y-5">
        {/* Course Card Summary */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">{course?.name}</h2>
              {course?.code && (
                <p className="text-xs font-mono font-medium text-accent">{course.code}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{course?.totalStudents} students</span>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap gap-1">
            {course?.courseGroups?.map((cg: any) => (
              <span
                key={cg.id}
                className="text-[11px] rounded bg-secondary px-2 py-0.5 text-muted-foreground font-medium"
              >
                {cg.group.name}
              </span>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/10 p-3.5 text-xs font-medium text-danger">
            {error}
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleStartAttendance} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="date"
              className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Attendance Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              value={values.date}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="note"
              className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Optional Note / Topic
            </label>
            <input
              id="note"
              name="note"
              type="text"
              value={values.note}
              onChange={handleChange}
              placeholder="e.g. Lecture 12 - Binary Search Trees"
              className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || course?.totalStudents === 0}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Start Attendance</span>
                  <Play className="h-4 w-4 fill-current" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
