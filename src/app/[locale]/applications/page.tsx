"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Application } from "@prisma/client";
import {
    Building2, GraduationCap, Calendar, Loader2, LinkIcon,
    Sparkles, BookmarkIcon, CheckCircle2, Trash2, ChevronRight, ChevronLeft, GripVertical
} from "lucide-react";

const STATUS_ORDER = ["SAVED", "IN_PROGRESS", "SUBMITTED"] as const;
type AppStatus = typeof STATUS_ORDER[number];

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
        colorClass: "bg-blue-900/20",
        textClass: "text-blue-300",
        borderClass: "border-blue-800/30",
        accentClass: "bg-blue-900/30 text-blue-400",
        topBorder: "border-t-blue-500",
        dropHighlight: "border-blue-500/60 bg-blue-500/5",
        icon: BookmarkIcon,
    },
    IN_PROGRESS: {
        labelKey: "statusInProgress",
        colorClass: "bg-amber-900/20",
        textClass: "text-amber-300",
        borderClass: "border-amber-800/30",
        accentClass: "bg-amber-900/30 text-amber-400",
        topBorder: "border-t-amber-500",
        dropHighlight: "border-amber-500/60 bg-amber-500/5",
        icon: Loader2,
    },
    SUBMITTED: {
        labelKey: "statusSubmitted",
        colorClass: "bg-emerald-900/20",
        textClass: "text-emerald-300",
        borderClass: "border-emerald-800/30",
        accentClass: "bg-emerald-900/30 text-emerald-400",
        topBorder: "border-t-emerald-500",
        dropHighlight: "border-emerald-500/60 bg-emerald-500/5",
        icon: CheckCircle2,
    },
};

export default function ApplicationsDashboard() {
    const t = useTranslations("Applications");
    const [applications, setApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverStatus, setDragOverStatus] = useState<AppStatus | null>(null);
    const dragCounters = useRef<Record<string, number>>({});

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
                className={`group relative rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing select-none
                    ${isDragging ? "opacity-40 scale-[0.98] border-neutral-700" : "hover:bg-neutral-800/70 hover:shadow-lg hover:border-neutral-700"}
                `}
            >
                {/* Drag handle hint */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-30 transition-opacity">
                    <GripVertical className="w-4 h-4 text-neutral-400" />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                        <Building2 className="h-4 w-4 shrink-0" />
                        <span className="truncate pr-4">{app.universityName}</span>
                    </div>

                    <div className="flex items-start gap-2 text-white">
                        <GraduationCap className="h-5 w-5 shrink-0 text-neutral-500 mt-0.5" />
                        <h3 className="text-base font-semibold leading-tight line-clamp-2">{app.programName}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {app.deadline && (
                            <div className="flex items-center gap-1.5 rounded-md bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-300 border border-blue-800/30">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {app.deadline}
                            </div>
                        )}
                        {score !== null && (
                            <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium border ${
                                score >= 80 ? "bg-emerald-900/20 text-emerald-300 border-emerald-800/30" :
                                score >= 50 ? "bg-yellow-900/20 text-yellow-300 border-yellow-800/30" :
                                "bg-red-900/20 text-red-300 border-red-800/30"
                            }`}>
                                <Sparkles className="h-3 w-3 shrink-0" />
                                {score}% Match
                            </div>
                        )}
                    </div>

                    {app.url && (
                        <a href={app.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors w-fit"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <LinkIcon className="h-3.5 w-3.5" />
                            {t("portalLink")}
                        </a>
                    )}

                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-neutral-800">
                        <div className="flex items-center gap-1">
                            {prev && (
                                <button
                                    onClick={() => handleStatusChange(app.id, prev)}
                                    title={`Move to ${t(STATUS_META[prev].labelKey)}`}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    {t(STATUS_META[prev].labelKey)}
                                </button>
                            )}
                            {next && (
                                <button
                                    onClick={() => handleStatusChange(app.id, next)}
                                    title={`Move to ${t(STATUS_META[next].labelKey)}`}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-neutral-400 hover:bg-neutral-700 hover:text-white transition-all"
                                >
                                    {t(STATUS_META[next].labelKey)}
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => handleDelete(app.id)}
                            title="Delete application"
                            className="rounded-md p-1.5 text-neutral-600 hover:bg-red-900/30 hover:text-red-400 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
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
                        <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">
                            {t(meta.labelKey)}
                        </h2>
                    </div>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs font-medium text-neutral-400">
                        {apps.length}
                    </span>
                </div>

                {/* Drop zone */}
                <div
                    onDragEnter={(e) => handleDragEnter(e, status)}
                    onDragLeave={(e) => handleDragLeave(e, status)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className={`flex flex-col gap-3 rounded-2xl p-4 border-2 border-t-4 min-h-[500px] transition-all duration-200
                        ${meta.topBorder}
                        ${isOver
                            ? `${meta.dropHighlight} border-dashed shadow-lg`
                            : "bg-neutral-950/50 border-white/5"
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
                            <Icon className="h-8 w-8 text-neutral-500 mb-3" />
                            <p className="text-sm text-neutral-400">{t("empty")}</p>
                            <p className="text-xs text-neutral-600 mt-1">{t("dragCardsHere")}</p>
                        </div>
                    ) : (
                        apps.map(app => <AppCard key={app.id} app={app} />)
                    )}
                </div>
            </div>
        );
    };

    const savedApps = applications.filter(app => app.status === "SAVED" || app.status === "NOT_STARTED");
    const inProgressApps = applications.filter(app => app.status === "IN_PROGRESS");
    const submittedApps = applications.filter(app => app.status === "SUBMITTED");

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-400">
                    {t("pageTitle")}
                </h1>
                <p className="text-neutral-400">
                    {t("pageSubtitle")}
                </p>
            </div>

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
                </div>
            ) : (
                <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
                    <Column status="SAVED" apps={savedApps} />
                    <Column status="IN_PROGRESS" apps={inProgressApps} />
                    <Column status="SUBMITTED" apps={submittedApps} />
                </div>
            )}
        </div>
    );
}
