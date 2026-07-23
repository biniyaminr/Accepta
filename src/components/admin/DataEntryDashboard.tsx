"use client";

import * as React from "react";
import { toast } from "sonner";
import {
    LayoutDashboard,
    ScrollText,
    GraduationCap,
    Building2,
    MapPin,
    CalendarClock,
    Link2,
    Award,
    Wallet,
    Languages,
    Loader2,
    Plus,
    Pencil,
    CheckCircle2,
    Clock3,
    Send,
    Trash2,
    X,
    RefreshCw,
    ChevronDown,
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";

// Persisted in the Opportunity.status column; global entries carry userId null
// and only PUBLISHED ones reach the student feed.
type EntryStatus = "DRAFT" | "NEEDS_REVIEW" | "PUBLISHED";

type Opportunity = {
    id: string;
    university: string;
    programName: string;
    description: string | null;
    deadline: string | null;
    isScholarship: boolean;
    isFreeApp: boolean;
    country: string | null;
    link: string;
    status: EntryStatus;
    tags: string[];
    createdAt: string;
};

const STATUSES: EntryStatus[] = ["DRAFT", "NEEDS_REVIEW", "PUBLISHED"];

const STATUS_LABEL: Record<EntryStatus, string> = {
    DRAFT: "Draft",
    NEEDS_REVIEW: "Needs Review",
    PUBLISHED: "Published",
};

const STATUS_PILL: Record<EntryStatus, string> = {
    DRAFT: "bg-gradient-to-r from-amber-500/15 to-amber-400/10 text-amber-300 ring-amber-500/25",
    NEEDS_REVIEW:
        "bg-gradient-to-r from-sky-500/15 to-indigo-400/10 text-sky-300 ring-sky-500/25",
    PUBLISHED:
        "bg-gradient-to-r from-emerald-500/15 to-teal-400/10 text-emerald-300 ring-emerald-500/25",
};

// Keys match Opportunity.tags in the DB, so entries round-trip losslessly.
const TAGS = [
    { key: "FULLY_FUNDED", label: "Fully Funded", icon: Award },
    { key: "PARTIAL_SCHOLARSHIP", label: "Partial Scholarship", icon: Wallet },
    { key: "NO_IELTS", label: "No IELTS Required", icon: Languages },
] as const;

type TagKey = (typeof TAGS)[number]["key"];

const EMPTY_FORM = {
    university: "",
    programName: "",
    country: "",
    deadline: "",
    link: "",
    description: "",
};

const EMPTY_TAGS: Record<TagKey, boolean> = {
    FULLY_FUNDED: false,
    PARTIAL_SCHOLARSHIP: false,
    NO_IELTS: false,
};

// canDelete: only super admins may delete entries; data-entry admins
// create/edit/publish (the API enforces this server-side too).
export function DataEntryDashboard({ canDelete }: { canDelete: boolean }) {
    const [form, setForm] = React.useState({ ...EMPTY_FORM });
    const [tags, setTags] = React.useState({ ...EMPTY_TAGS });
    const [status, setStatus] = React.useState<EntryStatus>("DRAFT");
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [submitting, setSubmitting] = React.useState(false);
    const [rows, setRows] = React.useState<Opportunity[]>([]);
    const [loadingRows, setLoadingRows] = React.useState(true);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
    const [statusSavingId, setStatusSavingId] = React.useState<string | null>(null);
    const [syncing, setSyncing] = React.useState(false);
    const formRef = React.useRef<HTMLDivElement>(null);

    const fetchRows = React.useCallback(async () => {
        const res = await fetch("/api/admin/opportunities");
        if (!res.ok) throw new Error("fetch failed");
        const data: Opportunity[] = await res.json();
        setRows(data);
    }, []);

    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/admin/opportunities");
                if (!res.ok) throw new Error("fetch failed");
                const data: Opportunity[] = await res.json();
                if (!cancelled) setRows(data);
            } catch {
                if (!cancelled) toast.error("Couldn't load recent uploads.");
            } finally {
                if (!cancelled) setLoadingRows(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Scrape the Telegram channels into the global review queue, then refresh.
    const handleSync = async () => {
        setSyncing(true);
        const toastId = toast.loading("Syncing Telegram channels…");
        try {
            const res = await fetch("/api/admin/sync-telegram");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "sync failed");
            if (data.addedCount > 0) {
                await fetchRows();
                toast.success(
                    `${data.addedCount} new program${data.addedCount === 1 ? "" : "s"} queued for review.`,
                    { id: toastId }
                );
            } else {
                toast.success("Sync complete — nothing new found.", { id: toastId });
            }
        } catch {
            toast.error("Telegram sync failed. Please try again.", { id: toastId });
        } finally {
            setSyncing(false);
        }
    };

    // Inline status change from the table — no full edit round-trip needed.
    const handleStatusChange = async (row: Opportunity, next: EntryStatus) => {
        if (next === row.status) return;
        setStatusSavingId(row.id);
        const prev = row.status;
        setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: next } : x))); // optimistic
        try {
            const res = await fetch(`/api/admin/opportunities/${row.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            });
            if (!res.ok) throw new Error("save failed");
            toast.success(`"${row.programName}" → ${STATUS_LABEL[next]}.`);
        } catch {
            setRows((r) => r.map((x) => (x.id === row.id ? { ...x, status: prev } : x))); // roll back
            toast.error("Couldn't change the status.");
        } finally {
            setStatusSavingId(null);
        }
    };

    const update = (key: keyof typeof EMPTY_FORM) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setForm((f) => ({ ...f, [key]: e.target.value }));

    const toggleTag = (key: TagKey) => setTags((t) => ({ ...t, [key]: !t[key] }));

    const resetForm = () => {
        setForm({ ...EMPTY_FORM });
        setTags({ ...EMPTY_TAGS });
        setStatus("DRAFT");
        setEditingId(null);
    };

    const startEdit = (row: Opportunity) => {
        setEditingId(row.id);
        setForm({
            university: row.university,
            programName: row.programName,
            country: row.country ?? "",
            deadline: row.deadline ? row.deadline.slice(0, 10) : "",
            link: row.link,
            description: row.description ?? "",
        });
        setTags({
            FULLY_FUNDED: row.tags.includes("FULLY_FUNDED"),
            PARTIAL_SCHOLARSHIP: row.tags.includes("PARTIAL_SCHOLARSHIP"),
            NO_IELTS: row.tags.includes("NO_IELTS"),
        });
        setStatus(row.status);
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleDelete = async (row: Opportunity) => {
        // Two-step inline confirm — first tap arms, second tap deletes.
        if (confirmDeleteId !== row.id) {
            setConfirmDeleteId(row.id);
            return;
        }
        setConfirmDeleteId(null);
        setDeletingId(row.id);
        try {
            const res = await fetch(`/api/admin/opportunities/${row.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("delete failed");
            setRows((r) => r.filter((x) => x.id !== row.id));
            if (editingId === row.id) resetForm();
            toast.success(`"${row.programName}" deleted.`);
        } catch {
            toast.error("Failed to delete the entry.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.university.trim() || !form.programName.trim() || !form.link.trim()) {
            toast.error("University, Program Title, and Application URL are required.");
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                university: form.university.trim(),
                programName: form.programName.trim(),
                description: form.description.trim() || null,
                deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
                country: form.country.trim() || null,
                link: form.link.trim(),
                tags: TAGS.filter((t) => tags[t.key]).map((t) => t.key),
                isFreeApp: false,
                status,
            };
            const res = await fetch(
                editingId ? `/api/admin/opportunities/${editingId}` : "/api/admin/opportunities",
                {
                    method: editingId ? "PATCH" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );
            if (!res.ok) throw new Error("save failed");
            const saved: Opportunity = await res.json();
            setRows((r) =>
                editingId
                    ? r.map((x) => (x.id === saved.id ? saved : x))
                    : [saved, ...r]
            );
            toast.success(
                `"${saved.programName}" ${editingId ? "updated" : "saved"} as ${STATUS_LABEL[saved.status]}.`
            );
            resetForm();
        } catch {
            toast.error("Failed to save the entry. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const stats = React.useMemo(() => {
        const total = rows.length;
        const published = rows.filter((r) => r.status === "PUBLISHED").length;
        const review = rows.filter((r) => r.status === "NEEDS_REVIEW").length;
        const funded = rows.filter((r) => r.isScholarship).length;
        return { total, published, review, funded };
    }, [rows]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Program Data Entry</h1>
                    <p className="text-sm text-neutral-400 mt-0.5">
                        Add and publish university programs to the Accepta live feed.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-[13px] font-semibold text-neutral-200 bg-white/[0.04] ring-1 ring-inset ring-white/[0.1] hover:bg-white/[0.08] hover:text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                >
                    <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
                    {syncing ? "Syncing…" : "Sync Telegram"}
                </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: "Total Entries", value: stats.total, icon: LayoutDashboard, tint: "text-neutral-200" },
                    { label: "Published", value: stats.published, icon: CheckCircle2, tint: "text-emerald-300" },
                    { label: "Needs Review", value: stats.review, icon: Clock3, tint: "text-sky-300" },
                    { label: "Funded Programs", value: stats.funded, icon: Award, tint: "text-amber-300" },
                ].map((s) => (
                    <GlassCard key={s.label} className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                                {s.label}
                            </span>
                            <s.icon className={cn("h-4 w-4", s.tint)} />
                        </div>
                        <p className={cn("mt-2 text-3xl font-bold tabular-nums", s.tint)}>
                            {loadingRows ? "—" : s.value}
                        </p>
                    </GlassCard>
                ))}
            </div>

            {/* Entry form */}
            <div ref={formRef} className="scroll-mt-6">
                <GlassCard className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                            {editingId ? (
                                <Pencil className="h-4 w-4 text-violet-400" />
                            ) : (
                                <Plus className="h-4 w-4 text-violet-400" />
                            )}
                            <h2 className="text-sm font-semibold text-white">
                                {editingId ? "Edit Program Entry" : "New Program Entry"}
                            </h2>
                        </div>
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 text-[13px] font-medium text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.04] transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                                Cancel edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field icon={Building2} label="University Name" required>
                                <input
                                    value={form.university}
                                    onChange={update("university")}
                                    placeholder="Massachusetts Institute of Technology"
                                    className={inputCls}
                                />
                            </Field>
                            <Field icon={GraduationCap} label="Program Title" required>
                                <input
                                    value={form.programName}
                                    onChange={update("programName")}
                                    placeholder="MSc Computer Science"
                                    className={inputCls}
                                />
                            </Field>
                            <Field icon={MapPin} label="Location">
                                <input
                                    value={form.country}
                                    onChange={update("country")}
                                    placeholder="Cambridge, USA"
                                    className={inputCls}
                                />
                            </Field>
                            <Field icon={CalendarClock} label="Application Deadline">
                                <input
                                    type="date"
                                    value={form.deadline}
                                    onChange={update("deadline")}
                                    className={cn(inputCls, "[color-scheme:dark]")}
                                />
                            </Field>
                            <Field icon={Link2} label="Application URL" required className="md:col-span-2">
                                <input
                                    value={form.link}
                                    onChange={update("link")}
                                    placeholder="https://gradadmissions.mit.edu/apply"
                                    className={inputCls}
                                />
                            </Field>
                        </div>

                        <Field icon={ScrollText} label="Description">
                            <textarea
                                value={form.description}
                                onChange={update("description")}
                                rows={4}
                                placeholder="Program overview, eligibility, funding notes, required documents…"
                                className={cn(inputCls, "resize-y min-h-[96px] leading-relaxed")}
                            />
                            <p className="mt-1.5 text-[11px] text-neutral-600">
                                Rich-text formatting coming soon — plain text is stored for now.
                            </p>
                        </Field>

                        {/* Smart toggles */}
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2.5">
                                Quick Tags
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {TAGS.map((tag) => {
                                    const on = tags[tag.key];
                                    return (
                                        <button
                                            key={tag.key}
                                            type="button"
                                            onClick={() => toggleTag(tag.key)}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 rounded-full px-3.5 h-9 text-[13px] font-medium ring-1 ring-inset transition-all duration-200",
                                                on
                                                    ? "bg-violet-500/15 text-violet-100 ring-violet-500/40"
                                                    : "bg-white/[0.02] text-neutral-400 ring-white/[0.08] hover:text-neutral-200 hover:ring-white/[0.16]"
                                            )}
                                            aria-pressed={on}
                                        >
                                            <tag.icon className="h-3.5 w-3.5" />
                                            {tag.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Status + submit */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-1">
                            <div>
                                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2.5">
                                    Status
                                </p>
                                <div className="inline-flex rounded-lg bg-white/[0.03] p-1 ring-1 ring-inset ring-white/[0.08]">
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setStatus(s)}
                                            className={cn(
                                                "px-3.5 h-8 rounded-md text-[13px] font-medium transition-all duration-200",
                                                status === s
                                                    ? "bg-white/[0.08] text-white shadow-sm ring-1 ring-inset ring-white/[0.1]"
                                                    : "text-neutral-400 hover:text-neutral-200"
                                            )}
                                        >
                                            {STATUS_LABEL[s]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={submitting}
                                    className="h-11 px-4 rounded-lg text-sm font-medium text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                                >
                                    Clear
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 h-11 px-6 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-500 hover:to-orange-400 shadow-lg shadow-violet-950/40 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    {submitting
                                        ? "Saving…"
                                        : editingId
                                          ? "Update Entry"
                                          : "Save Entry"}
                                </button>
                            </div>
                        </div>
                    </form>
                </GlassCard>
            </div>

            {/* Recent uploads */}
            <GlassCard className="overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-white">Recent Uploads</h2>
                    <span className="text-[11px] text-neutral-500 tabular-nums">
                        Last {Math.min(rows.length, 10)} programs
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] uppercase tracking-wider text-neutral-500">
                            <tr className="border-b border-white/[0.06]">
                                <th className="px-5 py-3 font-medium">Program</th>
                                <th className="px-5 py-3 font-medium">Location</th>
                                <th className="px-5 py-3 font-medium">Deadline</th>
                                <th className="px-5 py-3 font-medium">Status</th>
                                <th className="px-5 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                            {loadingRows ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-neutral-500">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                        Loading…
                                    </td>
                                </tr>
                            ) : rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-neutral-500">
                                        No programs yet — add your first entry above.
                                    </td>
                                </tr>
                            ) : (
                                rows.slice(0, 10).map((r) => (
                                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="font-medium text-neutral-100 truncate max-w-[220px]">
                                                {r.programName}
                                            </div>
                                            <div className="text-[12px] text-neutral-500 truncate max-w-[220px]">
                                                {r.university}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-neutral-400 whitespace-nowrap">
                                            {r.country || "—"}
                                        </td>
                                        <td className="px-5 py-3.5 text-neutral-400 tabular-nums whitespace-nowrap">
                                            {r.deadline ? r.deadline.slice(0, 10) : "—"}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {/* Inline status switcher, styled as the pill */}
                                            <span className="relative inline-flex items-center">
                                                <select
                                                    value={r.status}
                                                    onChange={(e) =>
                                                        handleStatusChange(r, e.target.value as EntryStatus)
                                                    }
                                                    disabled={statusSavingId === r.id}
                                                    className={cn(
                                                        "appearance-none cursor-pointer rounded-full pl-2.5 pr-6 py-0.5 text-[11px] font-medium ring-1 ring-inset outline-none transition-all duration-200 disabled:opacity-60 disabled:cursor-wait",
                                                        STATUS_PILL[r.status]
                                                    )}
                                                >
                                                    {STATUSES.map((s) => (
                                                        <option key={s} value={s} className="bg-zinc-900 text-neutral-200">
                                                            {STATUS_LABEL[s]}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 opacity-60" />
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => startEdit(r)}
                                                className="inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 text-[13px] font-medium text-neutral-300 ring-1 ring-inset ring-white/[0.08] hover:bg-white/[0.04] hover:text-white transition-colors"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                Edit
                                            </button>
                                            {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(r)}
                                                disabled={deletingId === r.id}
                                                className={cn(
                                                    "ml-2 inline-flex items-center gap-1.5 rounded-md px-2.5 h-8 text-[13px] font-medium ring-1 ring-inset transition-colors disabled:opacity-50",
                                                    confirmDeleteId === r.id
                                                        ? "bg-red-500/15 text-red-300 ring-red-500/40 hover:bg-red-500/25"
                                                        : "text-neutral-400 ring-white/[0.08] hover:bg-white/[0.04] hover:text-red-300"
                                                )}
                                            >
                                                {deletingId === r.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                                {confirmDeleteId === r.id ? "Confirm?" : "Delete"}
                                            </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}

const inputCls =
    "w-full h-11 px-3.5 rounded-lg bg-white/[0.02] text-[14px] text-neutral-100 placeholder:text-neutral-600 ring-1 ring-inset ring-white/[0.08] focus:ring-2 focus:ring-violet-500/50 focus:bg-white/[0.03] outline-none transition-all duration-200";

function Field({
    icon: Icon,
    label,
    required,
    className,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    required?: boolean;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div className={className}>
            <label className="flex items-center gap-1.5 text-[12px] font-medium text-neutral-400 mb-1.5">
                <Icon className="h-3.5 w-3.5 text-neutral-500" />
                {label}
                {required && <span className="text-orange-400">*</span>}
            </label>
            {children}
        </div>
    );
}
