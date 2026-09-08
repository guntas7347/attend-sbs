"use server";

import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, signToken, getSessionUser, requireUser } from "../auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: { username: string; password: string }) {
  const username = formData.username?.trim();
  const password = formData.password?.trim();

  if (!username || !password) {
    return { success: false, error: "Username and password are required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Invalid username or password" };
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      username: user.username,
    });

    const cookieStore = await cookies();
    cookieStore.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return { success: true, role: user.role };
  } catch (err: any) {
    console.error("Login action error:", err);
    return { success: false, error: "An unexpected error occurred during login" };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect("/login");
}

export async function getCurrentUserAction() {
  const session = await getSessionUser();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        designation: true,
        department: true,
        email: true,
        mobileNumber: true,
        createdAt: true,
      },
    });
    return user;
  } catch {
    return null;
  }
}

export async function updateUserProfileAction(data: {
  fullName?: string;
  designation?: string;
  department?: string;
  email?: string;
  mobileNumber?: string;
}) {
  const session = await requireUser();

  if (session.role === "MANAGER") {
    return { success: false, error: "Managers are not permitted to edit profile settings" };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName: data.fullName?.trim() || null,
        designation: data.designation?.trim() || null,
        department: data.department?.trim() || null,
        email: data.email?.trim() || null,
        mobileNumber: data.mobileNumber?.trim() || null,
      },
    });

    return { success: true, user: updated };
  } catch (err: any) {
    console.error("Update profile error:", err);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await requireUser();

  if (session.role === "MANAGER") {
    return {
      success: false,
      error: "Managers cannot change their own password. Please contact the course teacher.",
    };
  }

  const { currentPassword, newPassword, confirmPassword } = data;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: "All password fields are required" };
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: "New passwords do not match" };
  }

  if (newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { success: false, error: "Incorrect current password" };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (err: any) {
    console.error("Change password error:", err);
    return { success: false, error: "Failed to update password" };
  }
}
