"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Application } from "@prisma/client";
import {
    Building2, GraduationCap, Calendar, Loader2, LinkIcon,
    Sparkles, BookmarkIcon, CheckCircle2, Trash2, ChevronRight, ChevronLeft, GripVertical,
    StickyNote, X, Pin, PinOff, Pencil, Plus
} from "lucide-react";

const STATUS_ORDER = ["SAVED", "IN_PROGRESS", "SUBMITTED"] as const;
type AppStatus = typeof STATUS_ORDER[number];

type NoteCategory = "general" | "todo" | "feedback" | "research";

interface ApplicationNote {
    id: string;
    content: string;
    category: NoteCategory;
    isPinned: boolean;
    applicationId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

const CATEGORY_STYLES: Record<NoteCategory, string> = {
    general: "bg-zinc-800/50 text-zinc-300 border border-white/5",
    todo: "bg-gradient-to-r from-blue-500/15 to-blue-400/5 text-blue-400 border border-blue-500/20",
    feedback: "bg-gradient-to-r from-amber-500/15 to-amber-400/5 text-amber-400 border border-amber-500/20",
    research: "bg-gradient-to-r from-violet-500/15 to-violet-400/5 text-violet-400 border border-violet-500/20",
};

const STATUS_META: Record<AppStatus, {
    labelKey: string;
    colorClass: string;
    textClass: string;
    borderClass: string;
    accentClass: string;
    topBorder: string;
    dropHighlight: string;
    icon: React.ElementType;
}> = {
    SAVED: {
        labelKey: "statusSaved",
        colorClass: "bg-blue-500/10",
        textClass: "text-blue-300",
        borderClass: "border-blue-500/30",
        accentClass: "bg-gradient-to-r from-blue-500/20 to-blue-400/10 text-blue-400 border border-blue-500/20",
        topBorder: "border-t-blue-500",
        dropHighlight: "border-blue-500/60 bg-blue-500/5",
        icon: BookmarkIcon,
    },
    IN_PROGRESS: {
        labelKey: "statusInProgress",
        colorClass: "bg-amber-500/10",
        textClass: "text-amber-300",
        borderClass: "border-amber-500/30",
        accentClass: "bg-gradient-to-r from-amber-500/20 to-amber-400/10 text-amber-400 border border-amber-500/20",
        topBorder: "border-t-amber-500",
        dropHighlight: "border-amber-500/60 bg-amber-500/5",
        icon: Loader2,
    },
    SUBMITTED: {
        labelKey: "statusSubmitted",
        colorClass: "bg-emerald-500/10",
        textClass: "text-emerald-300",
        borderClass: "border-emerald-500/30",
        accentClass: "bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-400 border border-emerald-500/20",
        topBorder: "border-t-emerald-500",
        dropHighlight: "border-emerald-500/60 bg-emerald-500/5",
        icon: CheckCircle2,
    },
};

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
}

// ── Ambient background glow ──────────────────────────────────────────────────

function AmbientGlow() {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-purple-500 opacity-10 blur-3xl" />
            <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-orange-500 opacity-10 blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-violet-600 opacity-10 blur-3xl" />
        </div>
    );
}

// ── Shared styles ────────────────────────────────────────────────────────────

const GRADIENT_BTN =
    "rounded-md bg-gradient-to-r from-purple-500 to-orange-500 text-white font-semibold " +
    "transition-all duration-300 ease-in-out hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";

const FIELD =
    "rounded-md bg-zinc-900/80 border border-white/10 text-zinc-200 placeholder-zinc-500 " +
    "focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/30 transition-all duration-300 ease-in-out";

export default function ApplicationsDashboard() {
    const t = useTranslations("Applications");
    const tn = useTranslations("Notes");
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<AppStatus | null>(null);
    const dragCounters = useRef<Record<string, number>>({});

    // Notes drawer state
    const [drawerApp, setDrawerApp] = useState<Application | null>(null);
    const [notes, setNotes] = useState<ApplicationNote[]>([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [showNewNote, setShowNewNote] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState("");
    const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("general");
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [editCategory, setEditCategory] = useState<NoteCategory>("general");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch("/api/applications");
                if (res.ok) setApplications(await res.json());
            } catch (error) {
                console.error("Failed to load applications", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchApps();
    }, []);

    // Fetch notes when drawer opens
    const fetchNotes = useCallback(async (appId: string) => {
        setNotesLoading(true);
        try {
            const res = await fetch(`/api/applications/${appId}/notes`);
            if (res.ok) {
                setNotes(await res.json());
            }
        } catch (error) {
            console.error("Failed to load notes", error);
        } finally {
            setNotesLoading(false);
        }
    }, []);

    const openDrawer = useCallback((app: Application) => {
        setDrawerApp(app);
        setShowNewNote(false);
        setEditingNoteId(null);
        setConfirmDeleteId(null);
        setNewNoteContent("");
        setNewNoteCategory("general");
        fetchNotes(app.id);
    }, [fetchNotes]);

    const closeDrawer = useCallback(() => {
        setDrawerApp(null);
        setNotes([]);
        setShowNewNote(false);
        setEditingNoteId(null);
        setConfirmDeleteId(null);
    }, []);

    const handleCreateNote = async () => {
        if (!drawerApp || !newNoteContent.trim()) return;
        setSavingNote(true);
        try {
            const res = await fetch(`/api/applications/${drawerApp.id}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newNoteContent, category: newNoteCategory }),
            });
            if (res.ok) {
                setNewNoteContent("");
                setNewNoteCategory("general");
                setShowNewNote(false);
                fetchNotes(drawerApp.id);
            }
        } catch (error) {
            console.error("Failed to create note", error);
        } finally {
            setSavingNote(false);
        }
    };

    const handleUpdateNote = async (noteId: string) => {
        if (!drawerApp || !editContent.trim()) return;
        setSavingNote(true);
        try {
            const res = await fetch(`/api/applications/${drawerApp.id}/notes/${noteId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent, category: editCategory }),
            });
            if (res.ok) {
                setEditingNoteId(null);
                fetchNotes(drawerApp.id);
            }
        } catch (error) {
            console.error("Failed to update note", error);
        } finally {
            setSavingNote(false);
        }
    };

    const handleTogglePin = async (note: ApplicationNote) => {
        if (!drawerApp) return;
        try {
            const res = await fetch(`/api/applications/${drawerApp.id}/notes/${note.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPinned: !note.isPinned }),
            });
            if (res.ok) {
                fetchNotes(drawerApp.id);
            }
        } catch (error) {
            console.error("Failed to toggle pin", error);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!drawerApp) return;
        try {
            const res = await fetch(`/api/applications/${drawerApp.id}/notes/${noteId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                setConfirmDeleteId(null);
                fetchNotes(drawerApp.id);
            }
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    const handleDelete = async (id: string) => {
        setApplications(prev => prev.filter(app => app.id !== id));
        try {
            const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const refreshed = await fetch("/api/applications");
                if (refreshed.ok) setApplications(await refreshed.json());
            }
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleStatusChange = async (id: string, newStatus: AppStatus) => {
        setApplications(prev =>
            prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
        );
        try {
            await fetch(`/api/applications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch (error) {
            console.error("Status update failed:", error);
        }
    };

    const getAdjacentStatuses = (currentStatus: string) => {
        const idx = STATUS_ORDER.indexOf(currentStatus as AppStatus);
        return {
            prev: idx > 0 ? STATUS_ORDER[idx - 1] : null,
            next: idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1] : null,
        };
    };

    // ── Drag handlers ──────────────────────────────────────────────────────────

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverStatus(null);
        dragCounters.current = {};
    };

    const handleDragEnter = (e: React.DragEvent, status: AppStatus) => {
        e.preventDefault();
        dragCounters.current[status] = (dragCounters.current[status] || 0) + 1;
        setDragOverStatus(status);
    };

    const handleDragLeave = (e: React.DragEvent, status: AppStatus) => {
        dragCounters.current[status] = (dragCounters.current[status] || 1) - 1;
        if (dragCounters.current[status] <= 0) {
            dragCounters.current[status] = 0;
            setDragOverStatus(prev => prev === status ? null : prev);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetStatus: AppStatus) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain");
        const app = applications.find(a => a.id === id);
        if (app && app.status !== targetStatus) {
            handleStatusChange(id, targetStatus);
        }
        setDraggingId(null);
        setDragOverStatus(null);
        dragCounters.current = {};
    };

    // ── Category select component ─────────────────────────────────────────────

    const CategorySelect = ({ value, onChange }: { value: NoteCategory; onChange: (v: NoteCategory) => void }) => (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as NoteCategory)}
            className={`${FIELD} px-2 py-1 text-xs`}
        >
            <option value="general">{tn("general")}</option>
            <option value="todo">{tn("todo")}</option>
            <option value="feedback">{tn("feedback")}</option>
            <option value="research">{tn("research")}</option>
        </select>
    );

    // ── Note Card ─────────────────────────────────────────────────────────────

    const NoteCard = ({ note }: { note: ApplicationNote }) => {
        const isEditing = editingNoteId === note.id;
        const isConfirmingDelete = confirmDeleteId === note.id;

        if (isEditing) {
            return (
                <div className={`rounded-xl border p-3 space-y-2 backdrop-blur-sm ${note.isPinned ? "border-amber-500/30 bg-amber-500/5" : "border-white/5 bg-zinc-900/50"}`}>
                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className={`${FIELD} w-full p-2 text-sm resize-none`}
                        rows={3}
                    />
                    <div className="flex items-center gap-2">
                        <CategorySelect value={editCategory} onChange={setEditCategory} />
                        <div className="flex-1" />
                        <button
                            onClick={() => setEditingNoteId(null)}
                            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-50 transition-all duration-300 ease-in-out"
                        >
                            {tn("cancel")}
                        </button>
                        <button
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={savingNote || !editContent.trim()}
                            className={`${GRADIENT_BTN} px-3 py-1 text-xs`}
                        >
                            {tn("saveNote")}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className={`group/note rounded-xl border p-3 backdrop-blur-sm transition-all duration-300 ease-in-out ${note.isPinned ? "border-amber-500/30 bg-amber-500/5" : "border-white/5 bg-zinc-900/50 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]"}`}>
                <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-zinc-200 whitespace-pre-wrap flex-1">{note.content}</p>
                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/note:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={() => handleTogglePin(note)}
                            title={note.isPinned ? "Unpin" : "Pin"}
                            className="p-1 rounded text-zinc-500 hover:text-amber-400 transition-all duration-300 ease-in-out"
                        >
                            {note.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                        </button>
                        <button
                            onClick={() => {
                                setEditingNoteId(note.id);
                                setEditContent(note.content);
                                setEditCategory(note.category);
                            }}
                            title={tn("editNote")}
                            className="p-1 rounded text-zinc-500 hover:text-zinc-50 transition-all duration-300 ease-in-out"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={() => setConfirmDeleteId(note.id)}
                            title={tn("deleteNote")}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 transition-all duration-300 ease-in-out"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_STYLES[note.category]}`}>
                        {tn(note.category)}
                    </span>
                    {note.isPinned && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400">
                            <Pin className="h-2.5 w-2.5" />
                            {tn("pinned")}
                        </span>
                    )}
                    <span className="text-[10px] text-zinc-600 ml-auto tabular-nums">{timeAgo(note.createdAt)}</span>
                </div>
                {isConfirmingDelete && (
                    <div className="mt-2 flex items-center gap-2 p-2 rounded-md bg-red-500/5 border border-red-500/20">
                        <span className="text-xs text-red-300 flex-1">{tn("confirmDelete")}</span>
                        <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 text-xs text-zinc-400 hover:text-zinc-50 transition-all duration-300 ease-in-out"
                        >
                            {tn("cancel")}
                        </button>
                        <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="px-2 py-0.5 text-xs font-medium text-red-400 hover:text-red-300 transition-all duration-300 ease-in-out active:scale-95"
                        >
                            {tn("deleteNote")}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // ── App Card ───────────────────────────────────────────────────────────────

    const AppCard = ({ app }: { app: Application }) => {
        const { prev, next } = getAdjacentStatuses(app.status);
        const score = app.matchScore;
        const isDragging = draggingId === app.id;

        return (
            <div
                draggable
                onDragStart={(e) => handleDragStart(e, app.id)}
                onDragEnd={handleDragEnd}
                className={`group relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm p-5 transition-all duration-300 ease-in-out cursor-grab active:cursor-grabbing select-none
                    ${isDragging
                        ? "opacity-40 scale-[0.98] border-purple-500/30"
                        : "hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]"}
                `}
            >
                {/* Internal corner glow */}
                <div className="pointer-events-none absolute -top-14 -right-14 h-32 w-32 rounded-full bg-purple-500 opacity-0 blur-3xl transition-opacity duration-300 ease-in-out group-hover:opacity-10" />

                {/* Drag handle hint */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity duration-300">
                    <GripVertical className="w-4 h-4 text-zinc-400" />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate pr-4">{app.universityName}</span>
                    </div>

                    <div className="flex items-start gap-2 text-zinc-50">
                        <GraduationCap className="h-5 w-5 shrink-0 text-zinc-500 mt-0.5" />
                        <h3 className="text-base font-semibold tracking-tight leading-tight line-clamp-2">{app.programName}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {app.deadline && (
                            <div className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-blue-500/15 to-blue-400/5 px-2 py-1 text-xs font-medium text-blue-300 border border-blue-500/20 tabular-nums">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {app.deadline}
                            </div>
                        )}
                        {score !== null && (
                            <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border tabular-nums ${
                                score >= 80 ? "bg-gradient-to-r from-emerald-500/15 to-emerald-400/5 text-emerald-300 border-emerald-500/20" :
                                score >= 50 ? "bg-gradient-to-r from-amber-500/15 to-amber-400/5 text-amber-300 border-amber-500/20" :
                                "bg-gradient-to-r from-red-500/15 to-red-400/5 text-red-300 border-red-500/20"
                            }`}>
                                <Sparkles className="h-3 w-3 shrink-0" />
                                {score}% Match
                            </div>
                        )}
                    </div>

                    {app.url && (
                        <a href={app.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-50 transition-all duration-300 ease-in-out w-fit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <LinkIcon className="h-3.5 w-3.5" />
                            {t("portalLink")}
                        </a>
                    )}

                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5">
                        <div className="flex items-center gap-1">
                            {prev && (
                                <button
                                    onClick={() => handleStatusChange(app.id, prev)}
                                    title={`Move to ${t(STATUS_META[prev].labelKey)}`}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-50 transition-all duration-300 ease-in-out active:scale-95"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    {t(STATUS_META[prev].labelKey)}
                                </button>
                            )}
                            {next && (
                                <button
                                    onClick={() => handleStatusChange(app.id, next)}
                                    title={`Move to ${t(STATUS_META[next].labelKey)}`}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-50 transition-all duration-300 ease-in-out active:scale-95"
                                >
                                    {t(STATUS_META[next].labelKey)}
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openDrawer(app);
                                }}
                                title={tn("addNote")}
                                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-800/70 hover:text-amber-400 transition-all duration-300 ease-in-out active:scale-95"
                            >
                                <StickyNote className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(app.id)}
                                title="Delete application"
                                className="rounded-md p-1.5 text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 ease-in-out active:scale-95"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ── Column ─────────────────────────────────────────────────────────────────

    const Column = ({ status, apps }: { status: AppStatus; apps: Application[] }) => {
        const meta = STATUS_META[status];
        const Icon = meta.icon;
        const isOver = dragOverStatus === status;

        return (
            <div className="flex flex-col min-w-[300px] max-w-sm flex-1">
                {/* Column header */}
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${meta.accentClass}`}>
                            <Icon className="h-4 w-4" />
                        </div>
                        <h2 className="text-sm font-semibold tracking-tight text-zinc-200 uppercase">
                            {t(meta.labelKey)}
                        </h2>
                    </div>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900/80 border border-white/5 text-xs font-medium text-zinc-400 tabular-nums">
                        {apps.length}
                    </span>
                </div>

                {/* Drop zone */}
                <div
                    onDragEnter={(e) => handleDragEnter(e, status)}
                    onDragLeave={(e) => handleDragLeave(e, status)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className={`flex flex-col gap-3 rounded-2xl p-4 border-2 border-t-4 min-h-[500px] backdrop-blur-sm transition-all duration-300 ease-in-out
                        ${meta.topBorder}
                        ${isOver
                            ? `${meta.dropHighlight} border-dashed shadow-lg`
                            : "bg-zinc-950/50 border-white/5"
                        }
                    `}
                >
                    {isOver && draggingId && (
                        <div className={`rounded-xl border-2 border-dashed ${meta.borderClass} h-24 flex items-center justify-center`}>
                            <p className={`text-xs font-medium ${meta.textClass}`}>{t("dropHere")}</p>
                        </div>
                    )}
                    {apps.length === 0 && !isOver ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center opacity-40">
                            <Icon className="h-8 w-8 text-zinc-500 mb-3" />
                            <p className="text-sm text-zinc-400">{t("empty")}</p>
                            <p className="text-xs text-zinc-600 mt-1">{t("dragCardsHere")}</p>
                        </div>
                    ) : (
                        apps.map(app => <AppCard key={app.id} app={app} />)
                    )}
                </div>
            </div>
        );
    };

    // ── Notes Drawer ──────────────────────────────────────────────────────────

    const NotesDrawer = () => {
        if (!drawerApp) return null;

        const statusMeta = STATUS_META[drawerApp.status as AppStatus] || STATUS_META.SAVED;

        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                    onClick={closeDrawer}
                />
                {/* Drawer */}
                <div className="fixed right-0 top-0 h-full w-full max-w-md bg-zinc-950/95 backdrop-blur-md border-l border-white/10 z-50 flex flex-col animate-in slide-in-from-right duration-300 overflow-hidden">
                    {/* Ambient drawer glow */}
                    <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-purple-500 opacity-10 blur-3xl" />

                    {/* Header */}
                    <div className="relative flex items-start justify-between p-6 border-b border-white/5">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="text-sm font-medium text-emerald-400 truncate">{drawerApp.universityName}</span>
                            </div>
                            <h2 className="text-lg font-semibold tracking-tight text-zinc-50 truncate">{drawerApp.programName}</h2>
                            <div className="mt-2">
                                <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${statusMeta.accentClass}`}>
                                    {t(statusMeta.labelKey)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={closeDrawer}
                            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/70 transition-all duration-300 ease-in-out active:scale-95 shrink-0 ml-2"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Notes content */}
                    <div className="relative flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Add note button / form */}
                        {!showNewNote ? (
                            <button
                                onClick={() => setShowNewNote(true)}
                                className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-3 text-sm text-zinc-400 hover:text-zinc-50 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all duration-300 ease-in-out active:scale-95"
                            >
                                <Plus className="h-4 w-4" />
                                {tn("addNote")}
                            </button>
                        ) : (
                            <div className="rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm p-3 space-y-2">
                                <textarea
                                    value={newNoteContent}
                                    onChange={(e) => setNewNoteContent(e.target.value)}
                                    placeholder={tn("placeholder")}
                                    className={`${FIELD} w-full p-2 text-sm resize-none`}
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-zinc-500">{tn("category")}:</span>
                                    <CategorySelect value={newNoteCategory} onChange={setNewNoteCategory} />
                                    <div className="flex-1" />
                                    <button
                                        onClick={() => {
                                            setShowNewNote(false);
                                            setNewNoteContent("");
                                            setNewNoteCategory("general");
                                        }}
                                        className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-50 transition-all duration-300 ease-in-out"
                                    >
                                        {tn("cancel")}
                                    </button>
                                    <button
                                        onClick={handleCreateNote}
                                        disabled={savingNote || !newNoteContent.trim()}
                                        className={`${GRADIENT_BTN} px-3 py-1 text-xs`}
                                    >
                                        {tn("saveNote")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Notes list */}
                        {notesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <StickyNote className="h-10 w-10 text-zinc-700 mb-3" />
                                <p className="text-sm text-zinc-500">{tn("noNotes")}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notes.map(note => (
                                    <NoteCard key={note.id} note={note} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    };

    const savedApps = applications.filter(app => app.status === "SAVED" || app.status === "NOT_STARTED");
    const inProgressApps = applications.filter(app => app.status === "IN_PROGRESS");
    const submittedApps = applications.filter(app => app.status === "SUBMITTED");

    return (
        <div className="relative flex h-[calc(100vh-8rem)] flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <AmbientGlow />
            <div className="relative flex flex-col gap-2">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50">
                    {t("pageTitle")}
                </h1>
                <p className="text-zinc-400">
                    {t("pageSubtitle")}
                </p>
            </div>

            {isLoading ? (
                <div className="relative flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                </div>
            ) : (
                <div className="relative flex flex-1 gap-6 overflow-x-auto pb-4">
                    <Column status="SAVED" apps={savedApps} />
                    <Column status="IN_PROGRESS" apps={inProgressApps} />
                    <Column status="SUBMITTED" apps={submittedApps} />
                </div>
            )}

            {/* Notes Drawer */}
            <NotesDrawer />
        </div>
    );
}
