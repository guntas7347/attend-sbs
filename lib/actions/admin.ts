"use server";

import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../auth";
import { revalidatePath } from "next/cache";

export async function getUsersAction() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        designation: true,
        department: true,
        email: true,
        mobileNumber: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            groups: true,
            courses: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, users };
  } catch (err: any) {
    return { success: false, error: err?.message || "UNAUTHORIZED", users: [] };
  }
}

export async function createUserAction(formData: {
  username: string;
  password: string;
  role?: "ADMIN" | "USER";
  fullName?: string;
  designation?: string;
  department?: string;
  email?: string;
  mobileNumber?: string;
}) {
  await requireAdmin();

  const username = formData.username?.trim();
  const password = formData.password?.trim();
  const role = formData.role || "USER";
  const fullName = formData.fullName?.trim() || null;
  const designation = formData.designation?.trim() || null;
  const department = formData.department?.trim() || null;
  const email = formData.email?.trim() || null;
  const mobileNumber = formData.mobileNumber?.trim() || null;

  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return { success: false, error: "A user with this username already exists" };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
        fullName,
        designation,
        department,
        email,
        mobileNumber,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        designation: true,
        department: true,
        email: true,
        mobileNumber: true,
        role: true,
        createdAt: true,
      },
    });

    revalidatePath("/admin");
    return { success: true, user: newUser };
  } catch (err: any) {
    console.error("Create user error:", err);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUserAction(
  userId: string,
  formData: {
    fullName?: string;
    designation?: string;
    department?: string;
    email?: string;
    mobileNumber?: string;
    role?: "ADMIN" | "USER";
  }
) {
  await requireAdmin();

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: formData.fullName?.trim() || null,
        designation: formData.designation?.trim() || null,
        department: formData.department?.trim() || null,
        email: formData.email?.trim() || null,
        mobileNumber: formData.mobileNumber?.trim() || null,
        ...(formData.role ? { role: formData.role } : {}),
      },
    });

    revalidatePath("/admin");
    return { success: true, user: updated };
  } catch (err: any) {
    console.error("Update user error:", err);
    return { success: false, error: "Failed to update user" };
  }
}

export async function resetUserPasswordAction(
  userId: string,
  newPassword: string
) {
  await requireAdmin();

  const password = newPassword?.trim();
  if (!password || password.length < 6) {
    return {
      success: false,
      error: "New password must be at least 6 characters long",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
      },
    });

    revalidatePath("/admin");
    return {
      success: true,
      message: `Password reset successfully for @${user.username}`,
    };
  } catch (err: any) {
    console.error("Reset password error:", err);
    return { success: false, error: "Failed to reset password" };
  }
}
