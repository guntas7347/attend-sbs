"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopHeader from "@/components/TopHeader";
import { useForm } from "@/hooks/useForm";
import { useTheme } from "@/hooks/useTheme";
import {
  getCurrentUserAction,
  changePasswordAction,
  updateUserProfileAction,
  logoutAction,
} from "@/lib/actions/auth";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Edit2,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Moon,
  Phone,
  Shield,
  Sun,
  User,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    designation: "",
    department: "",
    email: "",
    mobileNumber: "",
  });

  const { values, handleChange, resetForm } = useForm({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function load() {
    try {
      const user = await getCurrentUserAction();
      if (!user) {
        window.location.href = "/login";
        return;
      }
      setCurrentUser(user);
      setProfileForm({
        fullName: user.fullName || "",
        designation: user.designation || "",
        department: user.department || "",
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
      });
    } catch (e) {
      console.error("Failed to load user", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setSavingProfile(true);

    try {
      const res = await updateUserProfileAction(profileForm);
      if (res.success && res.user) {
        setProfileSuccess(true);
        setIsEditingProfile(false);
        await load();
      } else {
        setProfileError(res.error || "Failed to update profile");
      }
    } catch {
      setProfileError("An unexpected network error occurred");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setSavingPassword(true);

    try {
      const res = await changePasswordAction(values);
      if (res.success) {
        setPasswordSuccess(true);
        resetForm();
      } else {
        setPasswordError(res.error || "Failed to update password");
      }
    } catch {
      setPasswordError("An unexpected network error occurred");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopHeader title="Settings" />

      <div className="flex-1 p-4 space-y-6 max-w-2xl mx-auto w-full pb-24">
        {/* User Profile Card */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-accent font-bold text-lg">
                {currentUser?.fullName ? (
                  currentUser.fullName.slice(0, 2).toUpperCase()
                ) : (
                  <User className="h-6 w-6" />
                )}
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {currentUser?.fullName || currentUser?.username}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {currentUser?.fullName && (
                    <span className="text-xs text-muted-foreground font-mono">
                      @{currentUser?.username}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent">
                    <Shield className="h-3 w-3" />
                    {currentUser?.role}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold active:scale-95 transition-all"
            >
              <Edit2 className="h-3.5 w-3.5 text-accent" />
              <span>{isEditingProfile ? "Cancel" : "Edit Profile"}</span>
            </button>
          </div>

          {profileSuccess && (
            <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-xs font-semibold text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Profile updated successfully.</span>
            </div>
          )}

          {/* Profile Edit Form */}
          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} className="space-y-3 pt-2 border-t border-border">
              {profileError && (
                <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                  {profileError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, fullName: e.target.value })
                    }
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Designation</label>
                  <input
                    type="text"
                    value={profileForm.designation}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, designation: e.target.value })
                    }
                    placeholder="e.g. Associate Professor"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Department</label>
                  <input
                    type="text"
                    value={profileForm.department}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, department: e.target.value })
                    }
                    placeholder="e.g. Computer Science & Engg"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    placeholder="jane@college.edu"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Mobile Number</label>
                  <input
                    type="tel"
                    value={profileForm.mobileNumber}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, mobileNumber: e.target.value })
                    }
                    placeholder="+91 9876543210"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 h-10 rounded-xl border border-border bg-secondary text-xs font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Profile"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {currentUser?.designation && (
                <div className="flex items-center gap-2 text-foreground/90">
                  <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{currentUser.designation}</span>
                </div>
              )}
              {currentUser?.department && (
                <div className="flex items-center gap-2 text-foreground/90">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{currentUser.department}</span>
                </div>
              )}
              {currentUser?.email && (
                <div className="flex items-center gap-2 text-foreground/90">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{currentUser.email}</span>
                </div>
              )}
              {currentUser?.mobileNumber && (
                <div className="flex items-center gap-2 text-foreground/90">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{currentUser.mobileNumber}</span>
                </div>
              )}
              <div className="text-[11px] text-muted-foreground sm:col-span-2 pt-1">
                Member since {new Date(currentUser?.createdAt || "").toLocaleDateString()}
              </div>
            </div>
          )}

          {currentUser?.role === "ADMIN" && (
            <div className="pt-2 border-t border-border">
              <Link
                href="/admin"
                className="flex h-11 items-center justify-between rounded-xl bg-secondary px-3.5 text-xs font-bold text-foreground hover:bg-muted active:scale-[0.99] transition-all"
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>Admin Panel (Manage Users & Reset Passwords)</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </Link>
            </div>
          )}
        </div>

        {/* Theme Settings */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-foreground">Theme</span>
              <p className="text-xs text-muted-foreground">
                Currently using {theme === "dark" ? "Dark" : "Light"} mode
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-border bg-secondary text-xs font-bold text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-slate-700" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-bold text-foreground">Change Password</h3>
          </div>

          {passwordSuccess && (
            <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-xs font-semibold text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Password updated successfully.</span>
            </div>
          )}

          {passwordError && (
            <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Current Password
              </label>
              <input
                name="currentPassword"
                type="password"
                required
                value={values.currentPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                New Password
              </label>
              <input
                name="newPassword"
                type="password"
                required
                value={values.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Confirm New Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={values.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full h-11 flex items-center justify-center rounded-xl bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        </div>

        {/* Logout Action */}
        <div className="pt-2">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 text-danger font-bold text-xs hover:bg-danger/15 active:scale-[0.98] transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

