"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import { useForm } from "@/hooks/useForm";
import { createGroupAction } from "@/lib/actions/groups";
import { Loader2 } from "lucide-react";

export default function NewGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { values, handleChange } = useForm({
    name: "",
    detail: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createGroupAction({
        name: values.name,
        detail: values.detail,
      });

      if (res.success && res.group) {
        router.push(`/groups/${res.group.id}`);
        router.refresh();
      } else {
        setError(res.error || "Failed to create group");
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TopHeader title="New Group" backHref="/groups" />

      <div className="flex-1 p-4 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/10 p-3.5 text-xs font-medium text-danger">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label
              htmlFor="name"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Group Name <span className="text-danger">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={values.name}
              onChange={handleChange}
              placeholder="e.g. CSE 3A"
              className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="detail"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Detail / Batch Description <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <textarea
              id="detail"
              name="detail"
              rows={3}
              value={values.detail}
              onChange={handleChange}
              placeholder="e.g. CSE 3rd year morning batch"
              className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 flex items-center justify-center rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Create Group"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
