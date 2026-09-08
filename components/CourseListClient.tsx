"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Edit3,
  Hash,
  Search,
  Users,
} from "lucide-react";

interface CourseListClientProps {
  initialCourses: any[];
  isManager: boolean;
  archivedCount: number;
}

export default function CourseListClient({
  initialCourses,
  isManager,
  archivedCount: initialArchivedCount,
}: CourseListClientProps) {
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");

  const activeCourses = initialCourses.filter((c) => !c.isArchived);
  const archivedCourses = initialCourses.filter((c) => c.isArchived);

  const displayedCourses = (tab === "active" ? activeCourses : archivedCourses).filter(
    (course) => {
      if (!search.trim()) return true;
      const query = search.toLowerCase().trim();
      const matchName = course.name?.toLowerCase().includes(query);
      const matchCode = course.code?.toLowerCase().includes(query);
      const matchTags = course.tags?.some((t: string) =>
        t.toLowerCase().includes(query.replace(/^#/, ""))
      );
      const matchGroups = course.courseGroups?.some((cg: any) =>
        cg.group?.name?.toLowerCase().includes(query)
      );
      return matchName || matchCode || matchTags || matchGroups;
    }
  );

  return (
    <div className="space-y-4">
      {/* Search and Tabs (Teacher view) */}
      {!isManager && (
        <div className="space-y-3">
          {/* Active / Archived Tabs */}
          {(activeCourses.length > 0 || archivedCourses.length > 0) && (
            <div className="flex items-center gap-1.5 p-1 bg-secondary rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setTab("active")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  tab === "active"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Active Courses</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    tab === "active"
                      ? "bg-accent/10 text-accent font-bold"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {activeCourses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTab("archived")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  tab === "archived"
                    ? "bg-surface text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Archive className="h-3.5 w-3.5" />
                <span>Archived</span>
                {archivedCourses.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      tab === "archived"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {archivedCourses.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Search bar */}
          {(activeCourses.length > 2 || archivedCourses.length > 0 || search) && (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courses by name, code, group, or #tag..."
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-border bg-surface text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Courses List */}
      {displayedCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-surface mt-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground mb-3">
            {tab === "archived" ? (
              <Archive className="h-6 w-6 text-muted-foreground" />
            ) : (
              <BookOpen className="h-6 w-6" />
            )}
          </div>
          <h2 className="text-base font-semibold text-foreground">
            {search
              ? "No matching courses found"
              : tab === "archived"
              ? "No archived courses"
              : isManager
              ? "No Assigned Courses"
              : "No active courses yet"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            {search
              ? `No courses matching "${search}". Try searching with a different keyword or tag.`
              : tab === "archived"
              ? "When a course semester or academic term ends, you can archive it from Course Settings to keep your dashboard clean."
              : isManager
              ? "You have not been assigned to any active courses yet. Please contact your course teacher to get access."
              : "Create your first course and assign groups to start marking attendance."}
          </p>
          {!isManager && tab === "active" && !search && (
            <Link
              href="/courses/new"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-accent text-accent-foreground font-medium text-xs hover:opacity-90 active:scale-95 transition-all"
            >
              Create Course
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayedCourses.map((course: any) => (
            <div
              key={course.id}
              className={`rounded-2xl border bg-surface p-4 shadow-xs space-y-3 transition-all ${
                course.isArchived
                  ? "border-border/80 opacity-90 hover:opacity-100 bg-secondary/20"
                  : "border-border"
              }`}
            >
              {/* Header & Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {course.name}
                    </h2>
                    {course.isArchived && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        <Archive className="h-2.5 w-2.5" />
                        Archived
                      </span>
                    )}
                  </div>
                  {course.code && (
                    <span className="inline-block text-xs font-mono font-medium text-accent">
                      {course.code}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground shrink-0">
                  <Users className="h-3.5 w-3.5" />
                  <span>{course.totalStudents} students</span>
                </div>
              </div>

              {/* Tags & Groups */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {/* Custom Tags */}
                {course.tags && course.tags.length > 0 && (
                  <>
                    {course.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-0.5 rounded-md border border-accent/20 bg-accent/5 px-2 py-0.5 text-[11px] font-medium text-accent"
                      >
                        <Hash className="h-2.5 w-2.5 opacity-70" />
                        {tag}
                      </span>
                    ))}
                  </>
                )}

                {/* Assigned Groups */}
                {course.courseGroups && course.courseGroups.length > 0 && (
                  <>
                    {course.courseGroups.map((cg: any) => (
                      <span
                        key={cg.id}
                        className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground font-medium"
                      >
                        {cg.group.name}
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* Teacher view: show assigned managers if any */}
              {!isManager && course.assignedManagers && course.assignedManagers.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
                  <span className="font-semibold">Manager:</span>
                  <div className="flex flex-wrap gap-1">
                    {course.assignedManagers.map((m: any) => (
                      <span
                        key={m.id}
                        className="bg-accent/10 text-accent font-medium px-2 py-0.5 rounded text-[11px] flex items-center gap-1"
                      >
                        {m.fullName ? (
                          <>
                            <span className="font-semibold">{m.fullName}</span>
                            <span className="font-mono text-[10px] opacity-80">(@{m.username})</span>
                          </>
                        ) : (
                          <span className="font-mono font-semibold">@{m.username}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col gap-2">
                {!course.isArchived ? (
                  <>
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
                        <span>{isManager ? "Past 2 Days Attendance" : "Past Attendance"}</span>
                      </Link>
                      {!isManager && course.isOwner && (
                        <Link
                          href={`/courses/${course.id}/edit`}
                          className="flex h-10 px-3 items-center justify-center rounded-xl border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-muted active:scale-[0.98] transition-all"
                          title="Edit Course"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                          Edit
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  /* Archived Course Actions */
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/courses/${course.id}/history`}
                      className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-foreground font-semibold text-xs hover:bg-muted active:scale-[0.98] transition-all"
                    >
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>View Attendance Records</span>
                    </Link>
                    {!isManager && course.isOwner && (
                      <Link
                        href={`/courses/${course.id}/edit`}
                        className="flex h-10 px-3.5 items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 active:scale-[0.98] transition-all"
                        title="Edit or Restore Course"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        <span>Settings</span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
