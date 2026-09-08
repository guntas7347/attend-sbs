"use server";

import { prisma } from "../prisma";
import { getSessionUser, requireUser, requireNonManager } from "../auth";
import { revalidatePath } from "next/cache";

export async function getGroupsAction() {
  const session = await getSessionUser();
  if (!session) {
    return { success: false, error: "UNAUTHORIZED", groups: [] };
  }

  if (session.role === "MANAGER") {
    return { success: false, error: "FORBIDDEN", groups: [] };
  }

  const groups = await prisma.group.findMany({
    where: {
      isArchived: false,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
        },
      },
      _count: {
        select: {
          students: {
            where: { isArchived: false },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedGroups = groups.map((g) => ({
    ...g,
    isOwner: session.role === "ADMIN" || g.createdById === session.userId,
  }));

  return { success: true, groups: formattedGroups };
}

export async function getGroupByIdAction(id: string) {
  const session = await requireNonManager();

  const group = await prisma.group.findFirst({
    where: {
      id,
      isArchived: false,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
        },
      },
      students: {
        where: { isArchived: false },
        orderBy: { rollNumber: "asc" },
      },
      _count: {
        select: {
          students: {
            where: { isArchived: false },
          },
        },
      },
    },
  });

  if (!group) {
    return { success: false, error: "Group not found or archived" };
  }

  const isOwner = session.role === "ADMIN" || group.createdById === session.userId;

  return {
    success: true,
    group: {
      ...group,
      isOwner,
    },
  };
}

export async function createGroupAction(data: { name: string; detail?: string }) {
  const session = await requireNonManager();
  const name = data.name?.trim();
  const detail = data.detail?.trim() || null;

  if (!name) {
    return { success: false, error: "Group name is required" };
  }

  try {
    const group = await prisma.group.create({
      data: {
        name,
        detail,
        createdById: session.userId,
      },
    });

    revalidatePath("/groups");
    return { success: true, group };
  } catch (err: any) {
    console.error("Create group error:", err);
    return { success: false, error: "Failed to create group" };
  }
}

export async function updateGroupAction(
  id: string,
  data: { name: string; detail?: string }
) {
  const session = await requireNonManager();
  const name = data.name?.trim();
  const detail = data.detail?.trim() || null;

  if (!name) {
    return { success: false, error: "Group name is required" };
  }

  try {
    const group = await prisma.group.findFirst({
      where: {
        id,
        isArchived: false,
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
    });

    if (!group) {
      return {
        success: false,
        error: "Group not found or you lack permission to edit this group",
      };
    }

    const updated = await prisma.group.update({
      where: { id },
      data: { name, detail },
    });

    revalidatePath(`/groups/${id}`);
    revalidatePath("/groups");
    return { success: true, group: updated };
  } catch (err: any) {
    console.error("Update group error:", err);
    return { success: false, error: "Failed to update group" };
  }
}

export async function deleteGroupAction(groupId: string) {
  const session = await requireNonManager();

  try {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
      include: {
        courseGroups: true,
        students: {
          include: {
            _count: {
              select: { attendanceRecords: true },
            },
          },
        },
      },
    });

    if (!group) {
      return {
        success: false,
        error: "Group not found or you lack permission to delete this group",
      };
    }

    // Check if group has ever been used in courses or has attendance records
    const isUsedInCourse = group.courseGroups.length > 0;
    const hasAttendanceRecords = group.students.some(
      (s) => s._count.attendanceRecords > 0
    );

    if (isUsedInCourse || hasAttendanceRecords) {
      // Used group: Archive/soft-delete to strictly preserve historical course and attendance records
      const now = new Date();
      await prisma.group.update({
        where: { id: groupId },
        data: {
          isArchived: true,
          archivedAt: now,
        },
      });

      // Archive all active students in the group
      await prisma.student.updateMany({
        where: { groupId, isArchived: false },
        data: {
          isArchived: true,
          archivedAt: now,
        },
      });

      revalidatePath("/groups");
      revalidatePath(`/groups/${groupId}`);
      return {
        success: true,
        archived: true,
        message: "Group archived successfully. Historical attendance preserved.",
      };
    } else {
      // Unused group: Safely permanently delete
      await prisma.student.deleteMany({
        where: { groupId },
      });

      await prisma.group.delete({
        where: { id: groupId },
      });

      revalidatePath("/groups");
      return {
        success: true,
        archived: false,
        message: "Group permanently deleted.",
      };
    }
  } catch (err: any) {
    console.error("Delete group error:", err);
    return { success: false, error: "Failed to delete group" };
  }
}

export async function addStudentAction(
  groupId: string,
  studentData: {
    name: string;
    rollNumber: string;
    fatherName?: string;
    image?: string;
  }
) {
  const session = await requireNonManager();
  const name = studentData.name?.trim();
  const rollNumber = studentData.rollNumber?.trim();
  const fatherName = studentData.fatherName?.trim() || null;
  const image = studentData.image?.trim() || null;

  if (!name || !rollNumber) {
    return { success: false, error: "Student name and roll number are required" };
  }

  try {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        isArchived: false,
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
    });

    if (!group) {
      return {
        success: false,
        error: "Group not found or you lack permission to add students",
      };
    }

    // Check duplicate roll number among active students inside this group
    const existing = await prisma.student.findFirst({
      where: {
        groupId,
        rollNumber,
        isArchived: false,
      },
    });

    if (existing) {
      return {
        success: false,
        error: `An active student with roll number "${rollNumber}" already exists in this group`,
      };
    }

    const student = await prisma.student.create({
      data: {
        groupId,
        name,
        rollNumber,
        fatherName,
        image,
      },
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true, student };
  } catch (err: any) {
    console.error("Add student error:", err);
    return { success: false, error: "Failed to add student" };
  }
}

export async function updateStudentAction(
  studentId: string,
  studentData: {
    name: string;
    rollNumber: string;
    fatherName?: string;
  }
) {
  const session = await requireNonManager();
  const name = studentData.name?.trim();
  const rollNumber = studentData.rollNumber?.trim();
  const fatherName = studentData.fatherName?.trim() || null;

  if (!name || !rollNumber) {
    return { success: false, error: "Student name and roll number are required" };
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { group: true },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (session.role !== "ADMIN" && student.group.createdById !== session.userId) {
      return {
        success: false,
        error: "Unauthorized: Only the group owner can edit student details",
      };
    }

    // Check duplicate roll number among active students in the group
    const duplicate = await prisma.student.findFirst({
      where: {
        groupId: student.groupId,
        rollNumber,
        isArchived: false,
        id: { not: studentId },
      },
    });

    if (duplicate) {
      return {
        success: false,
        error: `Another active student with roll number "${rollNumber}" already exists in this group`,
      };
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        name,
        rollNumber,
        fatherName,
      },
    });

    revalidatePath(`/groups/${student.groupId}`);
    return { success: true, student: updated };
  } catch (err: any) {
    console.error("Update student error:", err);
    return { success: false, error: "Failed to update student" };
  }
}

export async function removeStudentAction(studentId: string) {
  const session = await requireNonManager();

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        group: true,
        _count: {
          select: { attendanceRecords: true },
        },
      },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    if (session.role !== "ADMIN" && student.group.createdById !== session.userId) {
      return {
        success: false,
        error: "Unauthorized: Only the group owner can remove students",
      };
    }

    if (student._count.attendanceRecords > 0) {
      // Student has attendance records: soft-delete/archive.
      // NEVER delete historical attendance records.
      await prisma.student.update({
        where: { id: studentId },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      revalidatePath(`/groups/${student.groupId}`);
      return {
        success: true,
        archived: true,
        message: "Student archived. Historical attendance records preserved.",
      };
    } else {
      // Student has never been used in attendance: permanently delete record
      await prisma.student.delete({
        where: { id: studentId },
      });

      revalidatePath(`/groups/${student.groupId}`);
      return {
        success: true,
        archived: false,
        message: "Student permanently deleted.",
      };
    }
  } catch (err: any) {
    console.error("Remove student error:", err);
    return { success: false, error: "Failed to remove student" };
  }
}

export async function importStudentsAction(
  groupId: string,
  students: Array<{
    name: string;
    rollNumber: string;
    fatherName?: string;
    image?: string;
  }>
) {
  const session = await requireNonManager();

  if (!students || students.length === 0) {
    return { success: false, error: "No student data provided" };
  }

  try {
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        isArchived: false,
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
      include: {
        students: {
          where: { isArchived: false },
          select: { rollNumber: true },
        },
      },
    });

    if (!group) {
      return {
        success: false,
        error: "Group not found or you lack permission to import students",
      };
    }

    const existingRolls = new Set(group.students.map((s) => s.rollNumber));
    const seenInFile = new Set<string>();
    const validToInsert: Array<{
      groupId: string;
      name: string;
      rollNumber: string;
      fatherName: string | null;
      image: string | null;
      isArchived: boolean;
    }> = [];

    const errors: string[] = [];

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const rowNum = i + 1;
      const name = row.name?.trim();
      const rollNumber = String(row.rollNumber ?? "").trim();
      const fatherName = row.fatherName?.trim() || null;
      const image = row.image?.trim() || null;

      if (!name || !rollNumber) {
        errors.push(`Row ${rowNum}: Name and Roll Number are required.`);
        continue;
      }

      if (seenInFile.has(rollNumber)) {
        errors.push(`Row ${rowNum}: Duplicate Roll Number "${rollNumber}" in input.`);
        continue;
      }

      if (existingRolls.has(rollNumber)) {
        errors.push(`Row ${rowNum}: Roll Number "${rollNumber}" already exists in group.`);
        continue;
      }

      seenInFile.add(rollNumber);
      validToInsert.push({
        groupId,
        name,
        rollNumber,
        fatherName,
        image,
        isArchived: false,
      });
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: `Validation failed for ${errors.length} row(s)`,
        details: errors,
      };
    }

    if (validToInsert.length === 0) {
      return { success: false, error: "No valid new students to import" };
    }

    await prisma.student.createMany({
      data: validToInsert,
    });

    revalidatePath(`/groups/${groupId}`);
    return { success: true, count: validToInsert.length };
  } catch (err: any) {
    console.error("Import students error:", err);
    return { success: false, error: "Failed to import students" };
  }
}
