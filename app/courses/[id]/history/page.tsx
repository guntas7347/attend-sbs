"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import TopHeader from "@/components/TopHeader";
import {
  getCoursePastAttendanceAction,
  getCourseAttendanceReportAction,
} from "@/lib/actions/courses";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileSpreadsheet,
  History,
  Loader2,
  Play,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

export default function CourseHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: courseId } = use(params);

  const [activeTab, setActiveTab] = useState<"history" | "report">("history");

  // History Tab States
  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Report Tab States
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchStudent, setSearchStudent] = useState("");
  const [reportData, setReportData] = useState<{
    summary: {
      totalLectures: number;
      totalStudents: number;
      overallPercentage: number;
      fromDate: string | null;
      toDate: string | null;
    };
    students: Array<{
      id: string;
      name: string;
      rollNumber: string;
      fatherName: string | null;
      groupName: string;
      presents: number;
      absents: number;
      skipped: number;
      totalLectures: number;
      percentage: number;
    }>;
  } | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Load Sessions History
  useEffect(() => {
    async function load() {
      setLoadingHistory(true);
      try {
        const res = await getCoursePastAttendanceAction(courseId, filterDate);
        if (res.success) {
          setCourse(res.course);
          setSessions(res.sessions || []);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        setLoadingHistory(false);
      }
    }
    load();
  }, [courseId, filterDate]);

  // Load Attendance Report
  useEffect(() => {
    if (activeTab !== "report") return;

    async function loadReport() {
      setLoadingReport(true);
      try {
        const res = await getCourseAttendanceReportAction(
          courseId,
          fromDate || undefined,
          toDate || undefined
        );
        if (res.success) {
          if (!course && res.course) {
            setCourse(res.course);
          }
          setReportData({
            summary: res.summary!,
            students: res.students || [],
          });
        }
      } catch (e) {
        console.error("Failed to load report", e);
      } finally {
        setLoadingReport(false);
      }
    }
    loadReport();
  }, [courseId, activeTab, fromDate, toDate]);

  function formatDate(d: string | Date) {
    const dateObj = new Date(d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function handleQuickRange(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setFromDate(start.toISOString().split("T")[0]);
    setToDate(end.toISOString().split("T")[0]);
  }

  function handleClearRange() {
    setFromDate("");
    setToDate("");
  }

  function downloadCsv() {
    if (!reportData || reportData.students.length === 0) return;

    const headers = [
      "Roll Number",
      "Student Name",
      "Father Name",
      "Group",
      "Total Lectures",
      "Presents",
      "Absents",
      "Skipped",
      "Attendance %",
    ];

    const rows = reportData.students.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.fatherName || "").replace(/"/g, '""')}"`,
      `"${(s.groupName || "").replace(/"/g, '""')}"`,
      s.totalLectures,
      s.presents,
      s.absents,
      s.skipped,
      `${s.percentage}%`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `${course?.name || "course"}_attendance_report_${
      fromDate || "all"
    }_to_${toDate || "all"}.csv`
      .toLowerCase()
      .replace(/\s+/g, "_");

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Filter report students based on search string
  const filteredStudents =
    reportData?.students.filter((s) => {
      if (!searchStudent.trim()) return true;
      const q = searchStudent.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        (s.fatherName && s.fatherName.toLowerCase().includes(q))
      );
    }) || [];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopHeader
        title={activeTab === "history" ? "Past Attendance" : "Attendance Report"}
        subtitle={course?.name || "Course Attendance"}
        backHref="/courses"
      />

      {/* Navigation View Switcher Tabs */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-2 rounded-xl bg-secondary p-1 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "history"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-4 w-4" />
            <span>Sessions History</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "report"
                ? "bg-surface text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Attendance Report</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-4 space-y-4">
        {/* ================= HISTORY TAB ================= */}
        {activeTab === "history" && (
          <div className="space-y-4">
            {/* Date Filter Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full h-11 rounded-xl border border-border bg-surface pl-10 pr-10 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate("")}
                  className="absolute right-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {loadingHistory ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center space-y-2 mt-4">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
                <h2 className="text-sm font-semibold text-foreground">
                  No attendance records
                </h2>
                <p className="text-xs text-muted-foreground">
                  {filterDate
                    ? "No sessions found matching this date filter."
                    : "No attendance sessions recorded for this course yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => {
                  const isCompleted = s.status === "COMPLETED";
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-foreground">
                              {formatDate(s.date)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isCompleted
                                  ? "bg-success/15 text-success"
                                  : "bg-amber-500/15 text-amber-500"
                              }`}
                            >
                              {isCompleted ? (
                                <>
                                  <CheckCircle2 className="h-2.5 w-2.5" />
                                  Completed
                                </>
                              ) : (
                                <>
                                  <Clock className="h-2.5 w-2.5" />
                                  In Progress
                                </>
                              )}
                            </span>
                          </div>
                          {s.note && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {s.note}
                            </p>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-foreground">
                            {s.present}{" "}
                            <span className="font-normal text-muted-foreground">
                              / {s.total} present
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {s.absent} absent • {s.skipped} skipped
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        {!isCompleted ? (
                          <Link
                            href={`/attendance/${s.id}`}
                            className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 active:scale-95 transition-all"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>Resume Marking</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/attendance/${s.id}/view`}
                            className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-secondary text-foreground font-medium text-xs hover:bg-muted active:scale-95 transition-all"
                          >
                            <span>View Details</span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= REPORT TAB ================= */}
        {activeTab === "report" && (
          <div className="space-y-4">
            {/* Filter Card */}
            <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Date Range Filter
                </span>
                {(fromDate || toDate) && (
                  <button
                    onClick={handleClearRange}
                    className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset to All</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={handleClearRange}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                    !fromDate && !toDate
                      ? "bg-accent text-accent-foreground font-bold"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Time
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRange(7)}
                  className="px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRange(30)}
                  className="px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-[11px] font-medium transition-colors"
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {loadingReport ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" />
              </div>
            ) : reportData ? (
              <div className="space-y-4">
                {/* Summary Metrics Bar */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-border bg-surface p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Total Lectures
                    </span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {reportData.summary.totalLectures}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Enrolled
                    </span>
                    <span className="text-lg font-bold text-foreground mt-0.5 block">
                      {reportData.summary.totalStudents}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Avg Attendance
                    </span>
                    <span
                      className={`text-lg font-bold mt-0.5 block ${
                        reportData.summary.overallPercentage >= 75
                          ? "text-success"
                          : reportData.summary.overallPercentage >= 60
                          ? "text-amber-500"
                          : "text-danger"
                      }`}
                    >
                      {reportData.summary.overallPercentage}%
                    </span>
                  </div>
                </div>

                {/* Actions & Search */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search roll or student name..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-surface pl-10 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={downloadCsv}
                    disabled={reportData.students.length === 0}
                    className="flex h-10 items-center justify-center gap-1.5 px-3 rounded-xl border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-muted active:scale-95 transition-all disabled:opacity-50 shrink-0"
                    title="Export CSV"
                  >
                    <Download className="h-4 w-4 text-accent" />
                    <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>

                {/* Report Table */}
                {reportData.students.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center space-y-2">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto" />
                    <h2 className="text-sm font-semibold text-foreground">
                      No students enrolled
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Add students to the groups associated with this course to see reports.
                    </p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center space-y-2">
                    <Search className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      No student found matching &quot;{searchStudent}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/50">
                            <th className="py-3 px-3.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] w-16">
                              Roll
                            </th>
                            <th className="py-3 px-3.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px]">
                              Name
                            </th>
                            <th className="py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-center w-24">
                              Total Lectures
                            </th>
                            <th className="py-3 px-3 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-center w-20">
                              Presents
                            </th>
                            <th className="py-3 px-3.5 font-bold text-muted-foreground uppercase tracking-wider text-[10px] text-right w-24">
                              Percentage
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredStudents.map((s) => (
                            <tr
                              key={s.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-3 px-3.5 font-mono font-bold text-accent">
                                #{s.rollNumber}
                              </td>
                              <td className="py-3 px-3.5">
                                <div className="font-bold text-foreground text-xs">
                                  {s.name}
                                </div>
                                {s.fatherName && (
                                  <div className="text-[10px] text-muted-foreground">
                                    S/o {s.fatherName}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center text-foreground font-medium">
                                {s.totalLectures}
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-success">
                                {s.presents}
                              </td>
                              <td className="py-3 px-3.5 text-right">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                    s.percentage >= 75
                                      ? "bg-success/15 text-success"
                                      : s.percentage >= 60
                                      ? "bg-amber-500/15 text-amber-500"
                                      : "bg-danger/15 text-danger"
                                  }`}
                                >
                                  {s.percentage}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
