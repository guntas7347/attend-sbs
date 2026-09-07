import Link from "next/link";
import TopHeader from "@/components/TopHeader";
import { getCoursesAction } from "@/lib/actions/courses";
import { Plus, Users, Calendar, ArrowRight, BookOpen } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const result = await getCoursesAction();
  if (!result.success && result.error === "UNAUTHORIZED") {
    redirect("/login");
  }
  const courses = result.courses || [];

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader
        title="Courses"
        subtitle="Select a course to mark attendance"
        action={
          <Link
            href="/courses/new"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground hover:opacity-90 active:scale-95 transition-transform"
            aria-label="Create Course"
          >
            <Plus className="h-5 w-5" />
          </Link>
        }
      />

      <div className="flex-1 p-4 space-y-4">
        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-surface mt-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-foreground">No courses yet</h2>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Create your first course and assign groups to start marking attendance.
            </p>
            <Link
              href="/courses/new"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-accent text-accent-foreground font-medium text-xs hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" /> Create Course
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-foreground">
                      {course.name}
                    </h2>
                    {course.code && (
                      <span className="inline-block text-xs font-mono font-medium text-accent mt-0.5">
                        {course.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{course.totalStudents} students</span>
                  </div>
                </div>

                {course.courseGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {course.courseGroups.map((cg) => (
                      <span
                        key={cg.id}
                        className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground font-medium"
                      >
                        {cg.group.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-1 flex flex-col gap-2">
                  <Link
                    href={`/courses/${course.id}/mark`}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all shadow-xs"
                  >
                    <span>Mark Attendance</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/courses/${course.id}/history`}
                      className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-foreground font-medium text-xs hover:bg-muted active:scale-[0.98] transition-all"
                    >
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Past Attendance</span>
                    </Link>
                    {course.isOwner && (
                      <Link
                        href={`/courses/${course.id}/edit`}
                        className="flex h-10 px-3 items-center justify-center rounded-xl border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-muted active:scale-[0.98] transition-all"
                        title="Edit Course"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
