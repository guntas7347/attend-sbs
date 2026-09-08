"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  getTeacherManagersAction,
  createManagerAction,
  resetManagerPasswordAction,
} from "@/lib/actions/managers";
import {
  BookOpen,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Edit2,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Moon,
  Phone,
  Plus,
  RotateCw,
  Shield,
  Sun,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
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

  // Managers State
  const [managers, setManagers] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Create Manager Modal State
  const [showCreateManagerModal, setShowCreateManagerModal] = useState(false);
  const [initialManagerPassword, setInitialManagerPassword] = useState("");
  const [creatingManager, setCreatingManager] = useState(false);
  const [createManagerError, setCreateManagerError] = useState<string | null>(null);
  const [createdManagerResult, setCreatedManagerResult] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset Manager Password Modal State
  const [managerToReset, setManagerToReset] = useState<any | null>(null);
  const [newManagerPassword, setNewManagerPassword] = useState("");
  const [resettingManagerPassword, setResettingManagerPassword] = useState(false);
  const [resetManagerError, setResetManagerError] = useState<string | null>(null);
  const [resetManagerSuccess, setResetManagerSuccess] = useState<string | null>(null);

  const { values, handleChange, resetForm } = useForm({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function loadManagers() {
    setLoadingManagers(true);
    try {
      const res = await getTeacherManagersAction();
      if (res.success && res.managers) {
        setManagers(res.managers);
      }
    } catch (e) {
      console.error("Failed to load managers", e);
    } finally {
      setLoadingManagers(false);
    }
  }

  async function load() {
    try {
      const user = await getCurrentUserAction();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      if (user.role === "MANAGER") {
        router.replace("/courses");
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

      await loadManagers();
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

  async function handleCreateManager(e: React.FormEvent) {
    e.preventDefault();
    setCreateManagerError(null);
    setCreatingManager(true);

    try {
      const res = await createManagerAction({
        initialPassword: initialManagerPassword,
      });

      if (res.success && res.manager) {
        setCreatedManagerResult({
          username: res.manager.username,
          password: initialManagerPassword,
        });
        setInitialManagerPassword("");
        await loadManagers();
      } else {
        setCreateManagerError(res.error || "Failed to create manager account");
      }
    } catch {
      setCreateManagerError("An unexpected network error occurred");
    } finally {
      setCreatingManager(false);
    }
  }

  async function handleResetManagerPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!managerToReset) return;

    setResetManagerError(null);
    setResetManagerSuccess(null);
    setResettingManagerPassword(true);

    try {
      const res = await resetManagerPasswordAction({
        managerId: managerToReset.id,
        newPassword: newManagerPassword,
      });

      if (res.success) {
        setResetManagerSuccess(res.message || "Password updated successfully");
        setNewManagerPassword("");
        setTimeout(() => {
          setManagerToReset(null);
          setResetManagerSuccess(null);
        }, 2000);
      } else {
        setResetManagerError(res.error || "Failed to reset manager password");
      }
    } catch {
      setResetManagerError("An unexpected network error occurred");
    } finally {
      setResettingManagerPassword(false);
    }
  }

  function copyCredentials() {
    if (!createdManagerResult) return;
    const text = `Username: ${createdManagerResult.username}\nPassword: ${createdManagerResult.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* Course Managers Section (for Teachers and Admins) */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-bold text-foreground">Course Managers (CR Accounts)</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transferable accounts (e.g. <span className="font-mono text-accent font-semibold">mgr-001</span>) for CRs to mark attendance.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCreateManagerModal(true);
                setCreateManagerError(null);
                setCreatedManagerResult(null);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto shrink-0 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Manager</span>
            </button>
          </div>

          {loadingManagers ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-accent" />
              Loading manager accounts...
            </div>
          ) : managers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/50 p-6 text-center space-y-2">
              <UserPlus className="h-8 w-8 text-muted-foreground mx-auto" />
              <h4 className="text-xs font-semibold text-foreground">No Manager Accounts Created</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a manager account such as <span className="font-mono font-bold">mgr-001</span> to delegate attendance marking to your Class Representatives.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {managers.map((mgr) => (
                <div
                  key={mgr.id}
                  className="rounded-xl border border-border bg-background/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-accent/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {mgr.fullName ? (
                        <>
                          <span className="text-sm font-bold text-foreground">
                            {mgr.fullName}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                            @{mgr.username}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono font-bold text-sm text-foreground bg-secondary px-2.5 py-0.5 rounded-md">
                          @{mgr.username}
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        Created {new Date(mgr.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        Assigned Courses ({mgr.assignedCourseCount}):
                      </span>
                      {mgr.assignedCourses.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">
                          None (assign in Course Edit)
                        </span>
                      ) : (
                        mgr.assignedCourses.map((c: any) => (
                          <span
                            key={c.id}
                            className="rounded-md border border-border bg-secondary px-2 py-0.5 text-[11px] text-foreground font-medium"
                          >
                            {c.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {mgr.isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setManagerToReset(mgr);
                        setNewManagerPassword("");
                        setResetManagerError(null);
                        setResetManagerSuccess(null);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold active:scale-95 transition-all self-end sm:self-auto shrink-0"
                      title="Reset password to transfer to a new CR"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                      <span>Change Password (Rotate CR)</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change Password Form */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-accent" />
            <h3 className="text-sm font-bold text-foreground">Change Personal Password</h3>
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

      {/* Create Manager Modal */}
      {showCreateManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Create Manager Account</h3>
                  <p className="text-xs text-muted-foreground">
                    Auto-generates sequential username (e.g. mgr-001)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateManagerModal(false)}
                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createManagerError && (
              <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                {createManagerError}
              </div>
            )}

            {createdManagerResult ? (
              <div className="space-y-4 pt-1">
                <div className="rounded-xl border border-success/30 bg-success/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-success font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Manager Account Created Successfully!</span>
                  </div>

                  <div className="rounded-lg bg-surface/90 border border-border p-3 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Username:</span>
                      <span className="font-bold text-accent text-sm">
                        {createdManagerResult.username}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Password:</span>
                      <span className="font-bold text-foreground text-sm">
                        {createdManagerResult.password}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Copy and share these credentials with your CR. You can later assign this account to courses and reset its password whenever a new CR takes over.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyCredentials}
                    className="flex-1 flex h-10 items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy Credentials</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateManagerModal(false)}
                    className="px-4 h-10 rounded-xl border border-border bg-secondary text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateManager} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Initial Password for Manager <span className="text-danger">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      value={initialManagerPassword}
                      onChange={(e) => setInitialManagerPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full h-11 rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    The username will be assigned automatically (e.g. mgr-001).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateManagerModal(false)}
                    className="px-4 h-10 rounded-xl border border-border bg-secondary text-xs font-semibold text-foreground hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingManager || !initialManagerPassword}
                    className="px-4 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {creatingManager ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Create Manager"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Reset Manager Password Modal */}
      {managerToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Change Manager Password</h3>
                  <p className="text-xs text-muted-foreground">
                    For account: <span className="font-mono font-bold text-foreground">@{managerToReset.username}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagerToReset(null)}
                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetManagerSuccess && (
              <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-xs font-semibold text-success flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{resetManagerSuccess}</span>
              </div>
            )}

            {resetManagerError && (
              <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                {resetManagerError}
              </div>
            )}

            <form onSubmit={handleResetManagerPassword} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  New Password for @{managerToReset.username} <span className="text-danger">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={newManagerPassword}
                    onChange={(e) => setNewManagerPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full h-11 rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Changing the password transfers this existing account to a new CR while preserving all existing course assignments.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManagerToReset(null)}
                  className="px-4 h-10 rounded-xl border border-border bg-secondary text-xs font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingManagerPassword || !newManagerPassword}
                  className="px-4 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {resettingManagerPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm & Update"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

