"use server";

import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { requireNonManager } from "../auth";
import { revalidatePath } from "next/cache";

/**
 * Generate the next sequential unique manager username like mgr-001, mgr-002, etc.
 */
export async function getNextManagerUsername(): Promise<string> {
  // Find all usernames starting with 'mgr-'
  const existingManagers = await prisma.user.findMany({
    where: {
      username: {
        startsWith: "mgr-",
      },
    },
    select: {
      username: true,
    },
  });

  const existingNumbers = new Set<number>();
  for (const m of existingManagers) {
    const match = m.username.match(/^mgr-(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num)) {
        existingNumbers.add(num);
      }
    }
  }

  // Find the smallest unused positive integer
  let candidate = 1;
  while (existingNumbers.has(candidate)) {
    candidate++;
  }

  const padded = String(candidate).padStart(3, "0");
  return `mgr-${padded}`;
}

/**
 * Fetch all managers created by the logged-in teacher (or all managers for ADMIN).
 */
export async function getTeacherManagersAction() {
  const session = await requireNonManager();

  try {
    const managers = await prisma.user.findMany({
      where: {
        role: "MANAGER",
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        createdById: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true,
          },
        },
        courseManagers: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
                isArchived: true,
              },
            },
          },
        },
      },
      orderBy: { username: "asc" },
    });

    const formatted = managers.map((m) => {
      const activeCourses = m.courseManagers
        .map((cm) => cm.course)
        .filter((c) => !c.isArchived);

      return {
        id: m.id,
        username: m.username,
        createdAt: m.createdAt,
        isOwner: session.role === "ADMIN" || m.createdById === session.userId,
        createdByUsername: m.createdBy?.username || null,
        assignedCourses: activeCourses,
        assignedCourseCount: activeCourses.length,
      };
    });

    return { success: true, managers: formatted };
  } catch (err: any) {
    console.error("Get teacher managers error:", err);
    return { success: false, error: "Failed to load manager accounts", managers: [] };
  }
}

/**
 * Create a new Manager account.
 * Auto-generates unique username (e.g. mgr-001) and hashes initial password.
 */
export async function createManagerAction(data: { initialPassword: string }) {
  const session = await requireNonManager();
  const password = data.initialPassword?.trim();

  if (!password || password.length < 6) {
    return {
      success: false,
      error: "Initial password must be at least 6 characters long",
    };
  }

  try {
    // Generate sequential username
    let username = await getNextManagerUsername();

    // Verify uniqueness in case of race condition
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { username },
      });
      if (!existing) break;
      // If exists, bump candidate
      const match = username.match(/^mgr-(\d+)$/);
      const nextNum = match ? parseInt(match[1], 10) + 1 : attempts + 1;
      username = `mgr-${String(nextNum).padStart(3, "0")}`;
      attempts++;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const manager = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "MANAGER",
        createdById: session.userId,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/courses/new");
    return { success: true, manager };
  } catch (err: any) {
    console.error("Create manager error:", err);
    return { success: false, error: "Failed to create manager account" };
  }
}

/**
 * Reset / change password for a Manager.
 * Can only be performed by the teacher who created the Manager or an ADMIN.
 */
export async function resetManagerPasswordAction(data: {
  managerId: string;
  newPassword: string;
}) {
  const session = await requireNonManager();
  const { managerId, newPassword } = data;
  const password = newPassword?.trim();

  if (!password || password.length < 6) {
    return {
      success: false,
      error: "New password must be at least 6 characters long",
    };
  }

  try {
    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
        ...(session.role === "ADMIN" ? {} : { createdById: session.userId }),
      },
    });

    if (!manager) {
      return {
        success: false,
        error: "Manager account not found or you lack permission to manage this account",
      };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: managerId },
      data: { passwordHash },
    });

    revalidatePath("/settings");
    return {
      success: true,
      message: `Password updated successfully for @${manager.username}. You can now share the new credentials with the new CR.`,
    };
  } catch (err: any) {
    console.error("Reset manager password error:", err);
    return { success: false, error: "Failed to reset manager password" };
  }
}
