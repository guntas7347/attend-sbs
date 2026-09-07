"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TopHeader from "@/components/TopHeader";
import ConfirmModal from "@/components/ConfirmModal";
import { useForm } from "@/hooks/useForm";
import {
  getGroupByIdAction,
  updateGroupAction,
  deleteGroupAction,
} from "@/lib/actions/groups";
import { Loader2, Trash2 } from "lucide-react";

export default function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(true);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { values, handleChange, setField } = useForm({
    name: "",
    detail: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await getGroupByIdAction(groupId);
        if (res.success && res.group) {
          setField("name", res.group.name);
          setField("detail", res.group.detail || "");
          setIsOwner(res.group.isOwner ?? false);
          if (!res.group.isOwner) {
            setError("Unauthorized: Only the group owner can edit this group.");
          }
        } else {
          setError(res.error || "Group not found");
        }
      } catch {
        setError("Failed to load group");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner) return;
    setError(null);
    setSaving(true);

    try {
      const res = await updateGroupAction(groupId, {
        name: values.name,
        detail: values.detail,
      });

      if (res.success) {
        router.push(`/groups/${groupId}`);
        router.refresh();
      } else {
        setError(res.error || "Failed to update group");
      }
    } catch {
      setError("An unexpected network error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteGroup() {
    setDeleting(true);
    try {
      const res = await deleteGroupAction(groupId);
      if (res.success) {
        setShowDeleteModal(false);
        router.push("/groups");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete group");
      }
    } catch {
      setError("An unexpected error occurred while deleting group");
    } finally {
      setDeleting(false);
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
      <TopHeader title="Edit Group" backHref={`/groups/${groupId}`} />

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
              disabled={!isOwner}
              value={values.name}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border border-border bg-surface px-4 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="detail"
              className="text-xs font-semibold text-foreground uppercase tracking-wider"
            >
              Detail / Batch Description
            </label>
            <textarea
              id="detail"
              name="detail"
              rows={3}
              disabled={!isOwner}
              value={values.detail}
              onChange={handleChange}
              className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all resize-none disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !isOwner}
            className="w-full h-12 flex items-center justify-center rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 shadow-sm"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Save Changes"
            )}
          </button>
        </form>

        {isOwner && (
          <div className="pt-6 border-t border-border">
            <div className="rounded-2xl border border-danger/20 bg-danger/5 p-4 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-danger uppercase tracking-wider">
                  Danger Zone
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deleting this group will archive it if historical attendance exists, or permanently remove it if unused.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-danger/30 bg-surface text-danger text-xs font-bold hover:bg-danger/10 active:scale-95 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete or Archive Group</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteGroup}
        title="Delete Group"
        description="Are you sure you want to delete this group? If it has historical course attendance, it will be safely archived without losing past records."
        confirmText="Delete / Archive Group"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
