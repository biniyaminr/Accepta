"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

// Inline pipeline toggle for the new-users console — flips the user-research
// `interviewed` flag via the admin API and updates optimistically.
export function InterviewedToggle({
    userId,
    initial,
}: {
    userId: string;
    initial: boolean;
}) {
    const [interviewed, setInterviewed] = React.useState(initial);
    const [saving, setSaving] = React.useState(false);

    const toggle = async () => {
        const next = !interviewed;
        setSaving(true);
        setInterviewed(next); // optimistic
        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ interviewed: next }),
            });
            if (!res.ok) throw new Error("save failed");
        } catch {
            setInterviewed(!next); // roll back
            toast.error("Couldn't update the interview flag.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={saving}
            aria-pressed={interviewed}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition-all duration-200 disabled:opacity-60",
                interviewed
                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25 hover:bg-emerald-500/25"
                    : "bg-white/[0.02] text-neutral-400 ring-white/[0.08] hover:text-neutral-200 hover:ring-white/[0.16]"
            )}
        >
            {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
            ) : interviewed ? (
                <CheckCircle2 className="h-3 w-3" />
            ) : (
                <Circle className="h-3 w-3" />
            )}
            {interviewed ? "Interviewed" : "Mark interviewed"}
        </button>
    );
}
