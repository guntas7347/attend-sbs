"use server";

import { prisma } from "../prisma";
import { getSessionUser, requireUser } from "../auth";
import { revalidatePath } from "next/cache";

export async function getCoursesAction() {
  const session = await getSessionUser();
  if (!session) {
    return { success: false, error: "UNAUTHORIZED", courses: [] };
  }

  // If user is a MANAGER, find courses explicitly assigned to this manager
  if (session.role === "MANAGER") {
    const courses = await prisma.course.findMany({
      where: {
        isArchived: false,
        courseManagers: {
          some: {
            userId: session.userId,
          },
        },
      },
      include: {
        courseGroups: {
          include: {
            group: {
              include: {
                _count: {
                  select: {
                    students: {
                      where: { isArchived: false },
                    },
                  },
                },
              },
            },
          },
        },
        sessions: {
          orderBy: { date: "desc" },
          take: 1,
          select: {
            id: true,
            date: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const coursesWithStudentCounts = courses.map((course) => {
      const totalStudents = course.courseGroups.reduce(
        (acc, cg) => acc + (cg.group._count.students || 0),
        0
      );

      return {
        ...course,
        totalStudents,
        isOwner: false,
        isManager: true,
        assignedManagers: [],
      };
    });

    return { success: true, courses: coursesWithStudentCounts, role: "MANAGER" };
  }

  // For TEACHER (USER) or ADMIN
  const courses = await prisma.course.findMany({
    where: {
      isArchived: false,
      ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
    },
    include: {
      courseGroups: {
        include: {
          group: {
            include: {
              _count: {
                select: {
                  students: {
                    where: { isArchived: false },
                  },
                },
              },
            },
          },
        },
      },
      courseManagers: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      },
      sessions: {
        orderBy: { date: "desc" },
        take: 1,
        select: {
          id: true,
          date: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate total active students across groups for each course
  const coursesWithStudentCounts = courses.map((course) => {
    const totalStudents = course.courseGroups.reduce(
      (acc, cg) => acc + (cg.group._count.students || 0),
      0
    );
    const isOwner =
      session.role === "ADMIN" || course.createdById === session.userId;

    const assignedManagers = course.courseManagers.map((cm) => cm.user);

    return {
      ...course,
      totalStudents,
      isOwner,
      isManager: false,
      assignedManagers,
    };
  });

  return { success: true, courses: coursesWithStudentCounts, role: session.role };
}

export async function getCourseByIdAction(id: string) {
  const session = await requireUser();

  if (session.role === "MANAGER") {
    const course = await prisma.course.findFirst({
      where: {
        id,
        isArchived: false,
        courseManagers: {
          some: {
            userId: session.userId,
          },
        },
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
      return { success: false, error: "Course not found or not assigned to you" };
    }

    const allStudents = course.courseGroups.flatMap((cg) =>
      cg.group.students.map((student) => ({
        ...student,
        groupName: cg.group.name,
      }))
    );

    return {
      success: true,
      course: {
        ...course,
        allStudents,
        totalStudents: allStudents.length,
        isOwner: false,
        isManager: true,
        assignedManagers: [],
      },
    };
  }

  const course = await prisma.course.findFirst({
    where: {
      id,
      isArchived: false,
      ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
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
      courseManagers: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return { success: false, error: "Course not found or archived" };
  }

  // Aggregate all active students across assigned groups
  const allStudents = course.courseGroups.flatMap((cg) =>
    cg.group.students.map((student) => ({
      ...student,
      groupName: cg.group.name,
    }))
  );

  const isOwner =
    session.role === "ADMIN" || course.createdById === session.userId;

  const assignedManagers = course.courseManagers.map((cm) => cm.user);

  return {
    success: true,
    course: {
      ...course,
      allStudents,
      totalStudents: allStudents.length,
      isOwner,
      isManager: false,
      assignedManagers,
    },
  };
}

export async function createCourseAction(data: {
  name: string;
  code?: string;
  groupIds: string[];
  managerIds?: string[];
}) {
  const session = await requireUser();
  if (session.role === "MANAGER") {
    return { success: false, error: "Managers cannot create courses" };
  }

  const name = data.name?.trim();
  const code = data.code?.trim() || null;
  const groupIds = data.groupIds || [];
  const managerIds = data.managerIds || [];

  if (!name) {
    return { success: false, error: "Course name is required" };
  }

  if (groupIds.length === 0) {
    return { success: false, error: "Please select at least one group" };
  }

  try {
    const course = await prisma.course.create({
      data: {
        name,
        code,
        createdById: session.userId,
        courseGroups: {
          create: groupIds.map((groupId) => ({
            groupId,
          })),
        },
        courseManagers: {
          create: managerIds.map((userId) => ({
            userId,
          })),
        },
      },
    });

    revalidatePath("/courses");
    return { success: true, course };
  } catch (err: any) {
    console.error("Create course error:", err);
    return { success: false, error: "Failed to create course" };
  }
}

export async function updateCourseAction(
  courseId: string,
  data: {
    name: string;
    code?: string;
    groupIds: string[];
    managerIds?: string[];
  }
) {
  const session = await requireUser();
  if (session.role === "MANAGER") {
    return { success: false, error: "Managers cannot edit courses" };
  }

  const name = data.name?.trim();
  const code = data.code?.trim() || null;
  const groupIds = data.groupIds || [];
  const managerIds = data.managerIds || [];

  if (!name) {
    return { success: false, error: "Course name is required" };
  }

  if (groupIds.length === 0) {
    return { success: false, error: "Please select at least one group" };
  }

  try {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        isArchived: false,
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
    });

    if (!course) {
      return {
        success: false,
        error: "Course not found or you lack permission to edit this course",
      };
    }

    // Update course details, courseGroups, and courseManagers transactionally
    await prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: courseId },
        data: { name, code },
      });

      // Remove existing courseGroup relationships
      await tx.courseGroup.deleteMany({
        where: { courseId },
      });

      // Re-assign selected groupIds
      await tx.courseGroup.createMany({
        data: groupIds.map((groupId) => ({
          courseId,
          groupId,
        })),
      });

      // Update course managers
      await tx.courseManager.deleteMany({
        where: { courseId },
      });

      if (managerIds.length > 0) {
        await tx.courseManager.createMany({
          data: managerIds.map((userId) => ({
            courseId,
            userId,
          })),
        });
      }
    });

    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/courses");
    return { success: true };
  } catch (err: any) {
    console.error("Update course error:", err);
    return { success: false, error: "Failed to update course" };
  }
}

export async function deleteCourseAction(courseId: string) {
  const session = await requireUser();
  if (session.role === "MANAGER") {
    return { success: false, error: "Managers cannot delete courses" };
  }

  try {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
      include: {
        sessions: {
          select: { id: true },
        },
      },
    });

    if (!course) {
      return {
        success: false,
        error: "Course not found or you lack permission to delete this course",
      };
    }

    if (course.sessions.length > 0) {
      // Course has past attendance sessions: Archive/soft-delete.
      // NEVER delete historical attendance records or sessions.
      await prisma.course.update({
        where: { id: courseId },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      revalidatePath("/courses");
      return {
        success: true,
        archived: true,
        message: "Course archived. Historical attendance records preserved.",
      };
    } else {
      // Unused course: Safe permanent deletion
      await prisma.courseGroup.deleteMany({
        where: { courseId },
      });

      await prisma.courseManager.deleteMany({
        where: { courseId },
      });

      await prisma.course.delete({
        where: { id: courseId },
      });

      revalidatePath("/courses");
      return {
        success: true,
        archived: false,
        message: "Course permanently deleted.",
      };
    }
  } catch (err: any) {
    console.error("Delete course error:", err);
    return { success: false, error: "Failed to delete course" };
  }
}

export async function getCoursePastAttendanceAction(
  courseId: string,
  searchDate?: string
) {
  const session = await requireUser();

  try {
    let course: { id: string; name: string; code: string | null; createdById: string } | null = null;
    let isManager = false;

    if (session.role === "MANAGER") {
      const assignment = await prisma.courseManager.findUnique({
        where: {
          courseId_userId: {
            courseId,
            userId: session.userId,
          },
        },
      });

      if (!assignment) {
        return { success: false, error: "Course not assigned to you" };
      }

      course = await prisma.course.findFirst({
        where: {
          id: courseId,
          isArchived: false,
        },
        select: {
          id: true,
          name: true,
          code: true,
          createdById: true,
        },
      });
      isManager = true;
    } else {
      course = await prisma.course.findFirst({
        where: {
          id: courseId,
          ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
        },
        select: {
          id: true,
          name: true,
          code: true,
          createdById: true,
        },
      });
    }

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    // If manager, restrict sessions to past 2 days
    let dateFilter: any = undefined;
    if (isManager) {
      const now = new Date();
      const minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 0, 0, 0, 0);
      const maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
      dateFilter = {
        gte: minDate,
        lte: maxDate,
      };
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        courseId,
        ...(dateFilter ? { date: dateFilter } : {}),
      },
      include: {
        records: {
          select: {
            status: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Compute metrics for each session
    const sessionsWithCounts = sessions
      .map((s) => {
        const total = s.records.length;
        const present = s.records.filter((r) => r.status === "PRESENT").length;
        const absent = s.records.filter((r) => r.status === "ABSENT").length;
        const skipped = s.records.filter((r) => r.status === "SKIPPED").length;
        const marked = present + absent;

        return {
          id: s.id,
          date: s.date,
          note: s.note,
          status: s.status,
          createdAt: s.createdAt,
          total,
          present,
          absent,
          skipped,
          marked,
        };
      })
      .filter((s) => {
        if (!searchDate) return true;
        const dateStr = new Date(s.date).toISOString().split("T")[0];
        return dateStr.includes(searchDate);
      });

    return {
      success: true,
      course,
      sessions: sessionsWithCounts,
      isOwner: session.role === "ADMIN" || course.createdById === session.userId,
      isManager,
    };
  } catch (err: any) {
    console.error("Get past attendance error:", err);
    return { success: false, error: "Failed to load past attendance" };
  }
}

export async function getCourseAttendanceReportAction(
  courseId: string,
  fromDate?: string,
  toDate?: string
) {
  const session = await requireUser();
  if (session.role === "MANAGER") {
    return { success: false, error: "Managers cannot access attendance reports" };
  }

  try {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
      include: {
        courseGroups: {
          include: {
            group: {
              include: {
                students: {
                  orderBy: { rollNumber: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    // Build date filters for sessions
    const dateFilter: any = {};
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      dateFilter.gte = from;
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      dateFilter.lte = to;
    }

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        courseId,
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
      include: {
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
        },
      },
      orderBy: { date: "asc" },
    });

    // Total lectures/sessions conducted in this period
    const totalLectures = sessions.length;

    // Collect all students across course groups (including any past students who have records in these sessions)
    const studentsMap = new Map<
      string,
      {
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
      }
    >();

    for (const cg of course.courseGroups) {
      for (const student of cg.group.students) {
        studentsMap.set(student.id, {
          id: student.id,
          name: student.name,
          rollNumber: student.rollNumber,
          fatherName: student.fatherName,
          groupName: cg.group.name,
          presents: 0,
          absents: 0,
          skipped: 0,
          totalLectures,
          percentage: 0,
        });
      }
    }

    // Aggregate records (and register student if they were archived but have historical session records)
    for (const s of sessions) {
      for (const rec of s.records) {
        if (!studentsMap.has(rec.studentId) && rec.student) {
          studentsMap.set(rec.studentId, {
            id: rec.student.id,
            name: rec.student.name,
            rollNumber: rec.student.rollNumber,
            fatherName: rec.student.fatherName,
            groupName: rec.student.group?.name || "Group",
            presents: 0,
            absents: 0,
            skipped: 0,
            totalLectures,
            percentage: 0,
          });
        }

        const student = studentsMap.get(rec.studentId);
        if (student) {
          if (rec.status === "PRESENT") {
            student.presents += 1;
          } else if (rec.status === "ABSENT") {
            student.absents += 1;
          } else {
            student.skipped += 1;
          }
        }
      }
    }

    const reportStudents = Array.from(studentsMap.values()).map((s) => ({
      ...s,
      percentage:
        totalLectures > 0 ? Math.round((s.presents / totalLectures) * 100) : 0,
    }));

    // Natural sort by roll number
    reportStudents.sort((a, b) =>
      a.rollNumber.localeCompare(b.rollNumber, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );

    // Aggregate course-level stats
    const totalStudentCount = reportStudents.length;
    const totalPresentsCount = reportStudents.reduce(
      (sum, s) => sum + s.presents,
      0
    );
    const totalPossibleSlots = totalLectures * totalStudentCount;
    const overallPercentage =
      totalPossibleSlots > 0
        ? Math.round((totalPresentsCount / totalPossibleSlots) * 100)
        : 0;

    return {
      success: true,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      summary: {
        totalLectures,
        totalStudents: totalStudentCount,
        overallPercentage,
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
      students: reportStudents,
    };
  } catch (err: any) {
    console.error("Get attendance report error:", err);
    return { success: false, error: "Failed to generate attendance report" };
  }
}
