"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@/hooks/useForm";
import { loginAction } from "@/lib/actions/auth";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun, Lock, User, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { values, handleChange } = useForm({
    username: "",
    password: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginAction(values);
      if (res.success) {
        router.push("/courses");
        router.refresh();
      } else {
        setError(res.error || "Login failed");
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-between px-6 py-8">
      {/* Top bar with theme toggle */}
      <div className="flex justify-end">
        <button
          onClick={toggleTheme}
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground hover:bg-muted active:scale-95 transition-transform"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700" />
          )}
        </button>
      </div>

      {/* Main Login Form */}
      <div className="w-full max-w-sm mx-auto my-auto space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground font-bold text-xl shadow-sm mb-2">
            A
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign In
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to manage attendance
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="username"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Username
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={values.username}
                onChange={handleChange}
                placeholder="e.g. admin"
                className="w-full h-12 rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={values.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-12 rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 mt-2 shadow-sm"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-muted-foreground">
        Attendance Management System
      </div>
    </div>
  );
}
