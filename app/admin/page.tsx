"use client";

import { useEffect, useState } from "react";
import TopHeader from "@/components/TopHeader";
import { useForm } from "@/hooks/useForm";
import {
  getUsersAction,
  createUserAction,
  updateUserAction,
  resetUserPasswordAction,
} from "@/lib/actions/admin";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Edit2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetModalError, setResetModalError] = useState<string | null>(null);
  const [resetModalSuccess, setResetModalSuccess] = useState<string | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    designation: "",
    department: "",
    email: "",
    mobileNumber: "",
    role: "USER" as "ADMIN" | "USER",
  });

  const { values, handleChange, resetForm } = useForm({
    username: "",
    password: "",
    role: "USER" as "ADMIN" | "USER",
    fullName: "",
    designation: "",
    department: "",
    email: "",
    mobileNumber: "",
  });

  async function loadUsers() {
    try {
      const res = await getUsersAction();
      if (res.success && res.users) {
        setUsers(res.users);
      } else if (res.error === "FORBIDDEN" || res.error === "UNAUTHORIZED") {
        window.location.href = "/courses";
      }
    } catch {
      setErrorMsg("Failed to load user list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setCreating(true);

    try {
      const res = await createUserAction({
        username: values.username,
        password: values.password,
        role: values.role,
        fullName: values.fullName,
        designation: values.designation,
        department: values.department,
        email: values.email,
        mobileNumber: values.mobileNumber,
      });

      if (res.success) {
        setSuccessMsg(`User '${res.user?.username}' created successfully`);
        resetForm();
        setShowOptionalFields(false);
        await loadUsers();
      } else {
        setErrorMsg(res.error || "Failed to create user");
      }
    } catch {
      setErrorMsg("An unexpected network error occurred");
    } finally {
      setCreating(false);
    }
  }

  function openResetPasswordModal(u: any) {
    setResetModalUser(u);
    setNewPassword("");
    setResetModalError(null);
    setResetModalSuccess(null);
  }

  async function handleResetPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetModalError(null);
    setResetModalSuccess(null);
    setResettingPassword(true);

    try {
      const res = await resetUserPasswordAction(resetModalUser.id, newPassword);
      if (res.success) {
        setResetModalSuccess(res.message || "Password updated successfully!");
        setTimeout(() => {
          setResetModalUser(null);
        }, 1500);
      } else {
        setResetModalError(res.error || "Failed to reset password");
      }
    } catch {
      setResetModalError("An unexpected error occurred");
    } finally {
      setResettingPassword(false);
    }
  }

  function openEditUserModal(u: any) {
    setEditingUser(u);
    setEditForm({
      fullName: u.fullName || "",
      designation: u.designation || "",
      department: u.department || "",
      email: u.email || "",
      mobileNumber: u.mobileNumber || "",
      role: u.role || "USER",
    });
    setEditModalError(null);
  }

  async function handleEditUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditModalError(null);
    setSavingEdit(true);

    try {
      const res = await updateUserAction(editingUser.id, editForm);
      if (res.success) {
        setSuccessMsg(`User '@${editingUser.username}' updated successfully`);
        setEditingUser(null);
        await loadUsers();
      } else {
        setEditModalError(res.error || "Failed to update user details");
      }
    } catch {
      setEditModalError("An unexpected error occurred");
    } finally {
      setSavingEdit(false);
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
      <TopHeader title="Admin Panel" subtitle="User Management" backHref="/settings" />

      <div className="flex-1 p-4 space-y-6 pb-24 max-w-4xl mx-auto w-full">
        {/* Create User Card */}
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-bold text-foreground">Create New User</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-xs font-semibold text-accent hover:underline"
            >
              {showOptionalFields ? "Hide profile details" : "+ Add profile details"}
            </button>
          </div>

          {successMsg && (
            <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-xs font-semibold text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Username <span className="text-danger">*</span>
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <input
                    name="username"
                    type="text"
                    required
                    value={values.username}
                    onChange={handleChange}
                    placeholder="e.g. john_doe"
                    className="w-full h-11 rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Initial Password <span className="text-danger">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <input
                    name="password"
                    type="password"
                    required
                    value={values.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    className="w-full h-11 rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Role
              </label>
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                className="w-full h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="USER">USER (Teacher / Operator)</option>
                <option value="ADMIN">ADMIN (Full Administrative Access)</option>
              </select>
            </div>

            {/* Optional profile fields */}
            {showOptionalFields && (
              <div className="rounded-xl border border-border/80 bg-background/60 p-3.5 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Optional Profile Information
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Full Name</label>
                    <div className="relative flex items-center">
                      <UserCheck className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <input
                        name="fullName"
                        type="text"
                        value={values.fullName}
                        onChange={handleChange}
                        placeholder="Dr. John Doe"
                        className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Designation</label>
                    <div className="relative flex items-center">
                      <Briefcase className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <input
                        name="designation"
                        type="text"
                        value={values.designation}
                        onChange={handleChange}
                        placeholder="Assistant Professor / HOD"
                        className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Department</label>
                    <div className="relative flex items-center">
                      <Building2 className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <input
                        name="department"
                        type="text"
                        value={values.department}
                        onChange={handleChange}
                        placeholder="Computer Science & Engg"
                        className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-foreground">Email Address</label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <input
                        name="email"
                        type="email"
                        value={values.email}
                        onChange={handleChange}
                        placeholder="john.doe@college.edu"
                        className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-foreground">Mobile Number</label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      <input
                        name="mobileNumber"
                        type="tel"
                        value={values.mobileNumber}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        className="w-full h-10 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="w-full h-11 flex items-center justify-center rounded-xl bg-accent text-accent-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create User"
              )}
            </button>
          </form>
        </div>

        {/* Existing Users List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Existing Users ({users.length})
            </span>
          </div>

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-xl border border-border bg-surface p-4 space-y-3 hover:border-accent/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-accent font-bold">
                      {u.fullName ? (
                        u.fullName.slice(0, 2).toUpperCase()
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {u.fullName ? u.fullName : u.username}
                        </span>
                        {u.fullName && (
                          <span className="text-xs text-muted-foreground font-mono">
                            (@{u.username})
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            u.role === "ADMIN"
                              ? "bg-accent/15 text-accent"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <Shield className="h-2.5 w-2.5" />
                          {u.role}
                        </span>
                      </div>

                      {(u.designation || u.department) && (
                        <div className="text-xs text-foreground/80 font-medium flex items-center gap-1.5 mt-0.5">
                          {u.designation && <span>{u.designation}</span>}
                          {u.designation && u.department && <span>•</span>}
                          {u.department && <span>{u.department}</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit Details & Reset Password */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => openEditUserModal(u)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold active:scale-95 transition-all"
                      title="Edit Profile Details"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-accent" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openResetPasswordModal(u)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground text-xs font-semibold active:scale-95 transition-all"
                      title="Reset Password for this user"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>

                {/* Additional details: email, mobile, created date */}
                <div className="pt-2 border-t border-border/60 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                  {u.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span>{u.email}</span>
                    </div>
                  )}
                  {u.mobileNumber && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{u.mobileNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                  </div>
                  {u._count && (
                    <div className="flex items-center gap-2">
                      <span>• {u._count.courses || 0} courses</span>
                      <span>• {u._count.groups || 0} groups</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Reset Password</h3>
                  <p className="text-xs text-muted-foreground">
                    For user: <span className="font-semibold text-foreground">@{resetModalUser.username}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {resetModalSuccess && (
              <div className="rounded-xl border border-success/20 bg-success/10 p-3 text-xs font-semibold text-success flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{resetModalSuccess}</span>
              </div>
            )}

            {resetModalError && (
              <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                {resetModalError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  New Password <span className="text-danger">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)"
                    className="w-full h-11 rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 h-10 rounded-xl border border-border bg-secondary text-xs font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resettingPassword || !newPassword}
                  className="px-4 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {resettingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirm Reset"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Edit User Profile</h3>
                  <p className="text-xs text-muted-foreground">
                    Editing user: <span className="font-semibold text-foreground">@{editingUser.username}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editModalError && (
              <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs font-medium text-danger">
                {editModalError}
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Designation</label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    placeholder="e.g. Associate Professor"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    placeholder="e.g. Mechanical Engg"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="jane@college.edu"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Mobile Number</label>
                  <input
                    type="tel"
                    value={editForm.mobileNumber}
                    onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 h-10 rounded-xl border border-border bg-secondary text-xs font-semibold text-foreground hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 h-10 flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {savingEdit ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
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

