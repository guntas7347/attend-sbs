"use server";

import { prisma } from "../prisma";
import { requireUser, SessionUser } from "../auth";
import { revalidatePath } from "next/cache";

/**
 * Server-side check for 2-day attendance window.
 * Returns true if date is within today - 2 days and today + 1 day (for timezone tolerance).
 */
function isDateWithin2Days(targetDate: Date | string): boolean {
  const target = new Date(targetDate);
  const now = new Date();
  const minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);
  const maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
  const t = target.getTime();
  return t >= minDate.getTime() && t <= maxDate.getTime();
}

function isWithinOneHourOfCreation(createdAt: Date | string): boolean {
  const createdTime = new Date(createdAt).getTime();
  const oneHourMs = 60 * 60 * 1000;
  return Date.now() - createdTime <= oneHourMs;
}

/**
 * Check if the user is permitted to edit an attendance session.
 * - Teachers / Admins: Always allowed
 * - Managers: In-progress within 2 days, or if completed: only if created by logged in CR and within 1 hour of creation.
 */
function canUserEditSession(
  session: { status: string; date: Date; createdAt: Date; createdById: string | null },
  sessionUser: SessionUser
): { allowed: boolean; error?: string } {
  if (sessionUser.role !== "MANAGER") {
    return { allowed: true };
  }

  if (!isDateWithin2Days(session.date)) {
    return {
      allowed: false,
      error: "Attendance sessions older than 2 days cannot be modified.",
    };
  }

  if (session.status === "COMPLETED") {
    if (session.createdById !== sessionUser.userId) {
      return {
        allowed: false,
        error: "You can only edit attendance created by you.",
      };
    }
    if (!isWithinOneHourOfCreation(session.createdAt)) {
      return {
        allowed: false,
        error: "Completed attendance can only be edited within 1 hour of creation.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Verify user has permission to access a course.
 */
async function verifyCourseAccess(courseId: string, sessionUser: SessionUser): Promise<boolean> {
  if (sessionUser.role === "ADMIN") return true;
  if (sessionUser.role === "MANAGER") {
    const cm = await prisma.courseManager.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId: sessionUser.userId,
        },
      },
    });
    return !!cm;
  }
  const course = await prisma.course.findFirst({
    where: { id: courseId, createdById: sessionUser.userId },
  });
  return !!course;
}

export async function getOrCreateSessionAction(
  courseId: string,
  dateStr: string,
  note?: string,
  forceNew: boolean = false
) {
  const sessionUser = await requireUser();

  try {
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    // Check manager date restriction
    if (sessionUser.role === "MANAGER") {
      if (!isDateWithin2Days(targetDate)) {
        return {
          success: false,
          error: "Managers can only create or access attendance within the last 2 days.",
        };
      }
    }

    // Verify course access
    const hasAccess = await verifyCourseAccess(courseId, sessionUser);
    if (!hasAccess) {
      return { success: false, error: "Course not found or you lack permission to access it" };
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        isArchived: false,
      },
      include: {
        courseGroups: {
          include: {
            group: {
              include: {
                students: {
                  where: { isArchived: false },
                  orderBy: { rollNumber: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return { success: false, error: "Course not found or archived" };
    }

    // Check if there is an existing in-progress session if forceNew is not set
    let attendanceSession = null;
    if (!forceNew) {
      const candidateSessions = await prisma.attendanceSession.findMany({
        where: {
          courseId,
          status: "IN_PROGRESS",
        },
        orderBy: { createdAt: "desc" },
      });

      // If MANAGER, ensure resumed session date is within 2 days
      for (const s of candidateSessions) {
        if (sessionUser.role === "MANAGER" && !isDateWithin2Days(s.date)) {
          continue;
        }
        attendanceSession = s;
        break;
      }
    }

    // If no unfinished session to resume, create a new one
    if (!attendanceSession) {
      attendanceSession = await prisma.attendanceSession.create({
        data: {
          courseId,
          date: targetDate,
          note: note?.trim() || null,
          status: "IN_PROGRESS",
          createdById: sessionUser.userId,
        },
      });
    }

    // Gather all students in the assigned groups
    const allStudents = course.courseGroups.flatMap((cg) => cg.group.students);

    if (allStudents.length === 0) {
      return {
        success: false,
        error: "No students found in the groups assigned to this course",
      };
    }

    // Fetch existing records for this session
    const existingRecords = await prisma.attendanceRecord.findMany({
      where: { sessionId: attendanceSession.id },
    });
    const existingStudentIds = new Set(existingRecords.map((r) => r.studentId));

    // Create default SKIPPED records for any students not yet recorded
    const missingRecords = allStudents
      .filter((s) => !existingStudentIds.has(s.id))
      .map((s) => ({
        sessionId: attendanceSession.id,
        studentId: s.id,
        status: "SKIPPED" as const,
      }));

    if (missingRecords.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: missingRecords,
        skipDuplicates: true,
      });
    }

    revalidatePath(`/attendance/${attendanceSession.id}`);
    return {
      success: true,
      sessionId: attendanceSession.id,
      isResumed: !forceNew && existingRecords.length > 0,
    };
  } catch (err: any) {
    console.error("Get or create session error:", err);
    return { success: false, error: "Failed to initialize attendance session" };
  }
}

export async function getSessionDetailsAction(sessionId: string) {
  const sessionUser = await requireUser();

  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            courseGroups: {
              include: {
                group: true,
              },
            },
          },
        },
        records: {
          include: {
            student: {
              include: {
                group: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: {
            student: {
              rollNumber: "asc",
            },
          },
        },
      },
    });

    if (!session) {
      return { success: false, error: "Attendance session not found" };
    }

    // Check course permissions
    const hasAccess = await verifyCourseAccess(session.courseId, sessionUser);
    if (!hasAccess) {
      return { success: false, error: "Unauthorized: Course not assigned to you" };
    }

    // Check if user is allowed to view/edit this session
    const editCheck = canUserEditSession(session, sessionUser);
    if (!editCheck.allowed) {
      return { success: false, error: editCheck.error || "Access denied" };
    }

    const records = session.records.map((r) => ({
      recordId: r.id,
      studentId: r.studentId,
      name: r.student.name,
      rollNumber: r.student.rollNumber,
      fatherName: r.student.fatherName,
      groupName: r.student.group.name,
      status: r.status,
      image: r.student.image,
    }));

    return {
      success: true,
      session: {
        id: session.id,
        courseId: session.courseId,
        courseName: session.course.name,
        courseCode: session.course.code,
        date: session.date,
        note: session.note,
        status: session.status,
        createdAt: session.createdAt,
      },
      records,
      isManager: sessionUser.role === "MANAGER",
    };
  } catch (err: any) {
    console.error("Get session details error:", err);
    return { success: false, error: "Failed to load session details" };
  }
}

export async function saveAttendanceRecordAction(
  sessionId: string,
  studentId: string,
  status: "PRESENT" | "ABSENT" | "SKIPPED"
) {
  const sessionUser = await requireUser();

  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return { success: false, error: "Attendance session not found" };
    }

    // Check course access
    const hasAccess = await verifyCourseAccess(session.courseId, sessionUser);
    if (!hasAccess) {
      return { success: false, error: "Unauthorized: Course not assigned to you" };
    }

    // Check if user is allowed to edit this session
    const editCheck = canUserEditSession(session, sessionUser);
    if (!editCheck.allowed) {
      return { success: false, error: editCheck.error || "Access denied" };
    }

    await prisma.attendanceRecord.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId,
        },
      },
      update: {
        status,
      },
      create: {
        sessionId,
        studentId,
        status,
      },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Save record error:", err);
    return { success: false, error: "Failed to save attendance record" };
  }
}

export async function completeAttendanceSessionAction(sessionId: string) {
  const sessionUser = await requireUser();

  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return { success: false, error: "Attendance session not found" };
    }

    // Check course access
    const hasAccess = await verifyCourseAccess(session.courseId, sessionUser);
    if (!hasAccess) {
      return { success: false, error: "Unauthorized: Course not assigned to you" };
    }

    // Check if user is allowed to complete/edit this session
    const editCheck = canUserEditSession(session, sessionUser);
    if (!editCheck.allowed) {
      return { success: false, error: editCheck.error || "Access denied" };
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
      },
      include: {
        course: true,
      },
    });

    revalidatePath(`/attendance/${sessionId}`);
    revalidatePath(`/courses/${updated.courseId}/history`);
    revalidatePath("/courses");
    return { success: true, courseId: updated.courseId, isManager: sessionUser.role === "MANAGER" };
  } catch (err: any) {
    console.error("Complete session error:", err);
    return { success: false, error: "Failed to complete attendance session" };
  }
}

export async function getSessionViewAction(sessionId: string) {
  const sessionUser = await requireUser();

  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
        records: {
          include: {
            student: {
              include: {
                group: {
                  select: { name: true },
                },
              },
            },
          },
          orderBy: {
            student: {
              rollNumber: "asc",
            },
          },
        },
      },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    // Check access
    const hasAccess = await verifyCourseAccess(session.courseId, sessionUser);
    if (!hasAccess) {
      return { success: false, error: "Unauthorized: Course not assigned to you" };
    }

    // Check manager 2-day restriction
    if (sessionUser.role === "MANAGER") {
      if (!isDateWithin2Days(session.date)) {
        return {
          success: false,
          error: "Managers cannot view attendance sessions older than 2 days",
        };
      }
    }

    const total = session.records.length;
    const present = session.records.filter((r) => r.status === "PRESENT").length;
    const absent = session.records.filter((r) => r.status === "ABSENT").length;
    const skipped = session.records.filter((r) => r.status === "SKIPPED").length;

    const canEdit = canUserEditSession(session, sessionUser).allowed;

    return {
      success: true,
      session: {
        id: session.id,
        courseId: session.courseId,
        courseName: session.course.name,
        courseCode: session.course.code,
        date: session.date,
        note: session.note,
        status: session.status,
        createdAt: session.createdAt,
        createdById: session.createdById,
        total,
        present,
        absent,
        skipped,
      },
      records: session.records.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        name: r.student.name,
        rollNumber: r.student.rollNumber,
        fatherName: r.student.fatherName,
        groupName: r.student.group.name,
        status: r.status,
      })),
      isManager: sessionUser.role === "MANAGER",
      canEdit,
      isCreatedBySelf: session.createdById === sessionUser.userId,
    };
  } catch (err: any) {
    console.error("Get session view error:", err);
    return { success: false, error: "Failed to load session view" };
  }
}

export async function deleteAttendanceSessionAction(sessionId: string) {
  const sessionUser = await requireUser();

  if (sessionUser.role === "MANAGER") {
    return {
      success: false,
      error: "Managers are not permitted to delete attendance sessions",
    };
  }

  try {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: true,
      },
    });

    if (!session) {
      return { success: false, error: "Attendance session not found" };
    }

    if (
      sessionUser.role !== "ADMIN" &&
      session.course.createdById !== sessionUser.userId
    ) {
      return {
        success: false,
        error: "Unauthorized: Only the course owner can delete this attendance session",
      };
    }

    const courseId = session.courseId;

    // Permanently delete the attendance session (AttendanceRecords cascade delete)
    await prisma.attendanceSession.delete({
      where: { id: sessionId },
    });

    revalidatePath(`/courses/${courseId}/history`);
    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/courses");
    return { success: true, courseId };
  } catch (err: any) {
    console.error("Delete attendance session error:", err);
    return { success: false, error: "Failed to delete attendance session" };
  }
}

