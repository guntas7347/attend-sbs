import Link from "next/link";
import TopHeader from "@/components/TopHeader";
import CourseListClient from "@/components/CourseListClient";
import { getCoursesAction } from "@/lib/actions/courses";
import { logoutAction } from "@/lib/actions/auth";
import { Plus, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const result = await getCoursesAction(true);
  if (!result.success && result.error === "UNAUTHORIZED") {
    redirect("/login");
  }
  const courses = result.courses || [];
  const isManager = result.role === "MANAGER";
  const archivedCount = result.archivedCount || 0;

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader
        title={isManager ? "My Courses" : "Courses"}
        subtitle={
          isManager
            ? "Select an assigned course to mark attendance"
            : "Select a course to mark attendance or view history"
        }
        action={
          isManager ? (
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-10 px-3 items-center gap-1.5 rounded-lg border border-danger/20 bg-danger/5 text-danger font-semibold text-xs hover:bg-danger/10 active:scale-95 transition-all"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </form>
          ) : (
            <Link
              href="/courses/new"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground hover:opacity-90 active:scale-95 transition-transform"
              aria-label="Create Course"
            >
              <Plus className="h-5 w-5" />
            </Link>
          )
        }
      />

      <div className="flex-1 p-4 pb-20">
        <CourseListClient
          initialCourses={courses}
          isManager={isManager}
          archivedCount={archivedCount}
        />
      </div>
    </div>
  );
}
