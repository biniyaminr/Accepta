"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
    BarChart3,
    GraduationCap,
    CheckCircle2,
    Target,
    TrendingUp,
    Clock,
    Globe,
    FileText,
    Activity,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
    totalApplications: number;
    byStatus: Record<string, number>;
    submittedCount: number;
    avgMatchScore: number;
    deadlinesByMonth: { month: string; count: number }[];
    countriesApplied: { country: string; count: number }[];
    recentActivity: {
        id: string;
        universityName: string;
        status: string;
        updatedAt: string;
    }[];
    documentsUploaded: number;
    completionRate: number;
}

// ── Country Flag Lookup ──────────────────────────────────────────────────────

const COUNTRY_FLAGS: [string, string][] = [
    ["usa", "\u{1F1FA}\u{1F1F8}"], ["united states", "\u{1F1FA}\u{1F1F8}"],
    ["uk", "\u{1F1EC}\u{1F1E7}"], ["united kingdom", "\u{1F1EC}\u{1F1E7}"],
    ["germany", "\u{1F1E9}\u{1F1EA}"],
    ["france", "\u{1F1EB}\u{1F1F7}"],
    ["canada", "\u{1F1E8}\u{1F1E6}"],
    ["australia", "\u{1F1E6}\u{1F1FA}"],
    ["netherlands", "\u{1F1F3}\u{1F1F1}"],
    ["sweden", "\u{1F1F8}\u{1F1EA}"],
    ["norway", "\u{1F1F3}\u{1F1F4}"],
    ["denmark", "\u{1F1E9}\u{1F1F0}"],
    ["finland", "\u{1F1EB}\u{1F1EE}"],
    ["switzerland", "\u{1F1E8}\u{1F1ED}"],
    ["austria", "\u{1F1E6}\u{1F1F9}"],
    ["belgium", "\u{1F1E7}\u{1F1EA}"],
    ["italy", "\u{1F1EE}\u{1F1F9}"],
    ["spain", "\u{1F1EA}\u{1F1F8}"],
    ["japan", "\u{1F1EF}\u{1F1F5}"],
    ["south korea", "\u{1F1F0}\u{1F1F7}"],
    ["china", "\u{1F1E8}\u{1F1F3}"],
    ["india", "\u{1F1EE}\u{1F1F3}"],
    ["turkey", "\u{1F1F9}\u{1F1F7}"],
    ["south africa", "\u{1F1FF}\u{1F1E6}"],
    ["brazil", "\u{1F1E7}\u{1F1F7}"],
    ["mexico", "\u{1F1F2}\u{1F1FD}"],
    ["ethiopia", "\u{1F1EA}\u{1F1F9}"],
    ["kenya", "\u{1F1F0}\u{1F1EA}"],
    ["ghana", "\u{1F1EC}\u{1F1ED}"],
    ["nigeria", "\u{1F1F3}\u{1F1EC}"],
    ["egypt", "\u{1F1EA}\u{1F1EC}"],
    ["singapore", "\u{1F1F8}\u{1F1EC}"],
    ["new zealand", "\u{1F1F3}\u{1F1FF}"],
    ["ireland", "\u{1F1EE}\u{1F1EA}"],
    ["portugal", "\u{1F1F5}\u{1F1F9}"],
];

function getCountryFlag(country: string): string {
    const lower = country.toLowerCase();
    for (const [key, flag] of COUNTRY_FLAGS) {
        if (lower.includes(key)) return flag;
    }
    return "\u{1F30D}";
}

// ── Status colors ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    NOT_STARTED: "bg-zinc-500",
    IN_PROGRESS: "bg-blue-500",
    READY: "bg-amber-500",
    SUBMITTED: "bg-emerald-500",
};

const STATUS_BAR_COLORS: Record<string, string> = {
    NOT_STARTED: "bg-gradient-to-r from-zinc-600 to-zinc-500",
    IN_PROGRESS: "bg-gradient-to-r from-blue-600 to-blue-400",
    READY: "bg-gradient-to-r from-amber-600 to-amber-400",
    SUBMITTED: "bg-gradient-to-r from-emerald-600 to-emerald-400",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string, todayLabel: string, daysAgoTemplate: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return todayLabel;
    return daysAgoTemplate.replace("{days}", String(diffDays));
}

function monthLabel(yyyymm: string): string {
    const [year, month] = yyyymm.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}

// ── Shared styles ────────────────────────────────────────────────────────────

const CARD =
    "relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm " +
    "transition-all duration-300 ease-in-out hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]";

// ── Ambient background glow ──────────────────────────────────────────────────

function AmbientGlow() {
    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -top-32 -left-32 h-[32rem] w-[32rem] rounded-full bg-purple-500 opacity-10 blur-3xl" />
            <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-orange-500 opacity-10 blur-3xl" />
            <div className="absolute -bottom-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-purple-600 opacity-10 blur-3xl" />
        </div>
    );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const t = useTranslations("Analytics");
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/analytics")
            .then((res) => res.json())
            .then((d) => setData(d))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="relative min-h-screen bg-[#09090b] p-6 md:p-8 lg:p-10">
                <AmbientGlow />
                <div className="relative max-w-7xl mx-auto space-y-8">
                    {/* Header skeleton */}
                    <div className="space-y-3">
                        <div className="h-9 w-64 bg-zinc-900 rounded-xl animate-pulse" />
                        <div className="h-4 w-96 bg-zinc-900/60 rounded-xl animate-pulse" />
                    </div>
                    {/* Stats row skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-3">
                                <div className="h-4 w-24 bg-zinc-800/80 rounded animate-pulse" />
                                <div className="h-10 w-16 bg-zinc-800/80 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                    {/* Charts skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 h-64 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── No data state ────────────────────────────────────────────────────────
    if (!data || data.totalApplications === 0) {
        return (
            <div className="relative min-h-screen bg-[#09090b] p-6 md:p-8 lg:p-10">
                <AmbientGlow />
                <div className="relative max-w-7xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-orange-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </span>
                            {t("pageTitle")}
                        </h1>
                        <p className="text-zinc-400 mt-2">{t("pageSubtitle")}</p>
                    </div>
                    <div className={`${CARD} flex flex-col items-center justify-center py-24 text-center`}>
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-purple-500 opacity-10 blur-3xl" />
                        <Activity className="h-16 w-16 text-zinc-700 mb-5" />
                        <p className="text-zinc-400 text-lg max-w-md">{t("noData")}</p>
                    </div>
                </div>
            </div>
        );
    }

    const maxStatusCount = Math.max(...Object.values(data.byStatus), 1);
    const maxDeadlineCount = Math.max(...data.deadlinesByMonth.map((d) => d.count), 1);
    const appsWithDocs = data.totalApplications > 0
        ? Math.round((data.documentsUploaded / data.totalApplications) * 100)
        : 0;
    const docsDisplayed = Math.min(appsWithDocs, 100);

    const statusKeys: { key: string; labelKey: string }[] = [
        { key: "NOT_STARTED", labelKey: "notStarted" },
        { key: "IN_PROGRESS", labelKey: "inProgress" },
        { key: "READY", labelKey: "ready" },
        { key: "SUBMITTED", labelKey: "submitted" },
    ];

    // SVG donut params
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (docsDisplayed / 100) * circumference;

    const stats = [
        {
            label: t("totalApplications"),
            value: String(data.totalApplications),
            icon: GraduationCap,
            iconClass: "text-purple-400",
            iconBg: "bg-purple-500/10",
        },
        {
            label: t("submitted"),
            value: String(data.submittedCount),
            icon: CheckCircle2,
            iconClass: "text-emerald-400",
            iconBg: "bg-emerald-500/10",
        },
        {
            label: t("avgFitScore"),
            value: data.avgMatchScore ? String(data.avgMatchScore) : "--",
            icon: Target,
            iconClass:
                data.avgMatchScore >= 70 ? "text-emerald-400" : data.avgMatchScore >= 40 ? "text-amber-400" : "text-red-400",
            iconBg:
                data.avgMatchScore >= 70 ? "bg-emerald-500/10" : data.avgMatchScore >= 40 ? "bg-amber-500/10" : "bg-red-500/10",
        },
        {
            label: t("completionRate"),
            value: `${data.completionRate}%`,
            icon: TrendingUp,
            iconClass: "text-orange-400",
            iconBg: "bg-orange-500/10",
        },
    ];

    return (
        <div className="relative min-h-screen bg-[#09090b] p-6 md:p-8 lg:p-10">
            <AmbientGlow />
            <div className="relative max-w-7xl mx-auto space-y-8">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="sticky top-0 z-20 -mx-6 md:-mx-8 lg:-mx-10 px-6 md:px-8 lg:px-10 py-4 bg-[#09090b]/70 backdrop-blur-md border-b border-white/5">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-50 flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-orange-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                            <BarChart3 className="h-6 w-6 text-white" />
                        </span>
                        {t("pageTitle")}
                    </h1>
                    <p className="text-zinc-400 mt-2">{t("pageSubtitle")}</p>
                </div>

                {/* ── Top Stats Row ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map(({ label, value, icon: Icon, iconClass, iconBg }) => (
                        <div key={label} className={`${CARD} group p-6`}>
                            <div className="absolute -top-14 -right-14 h-32 w-32 rounded-full bg-purple-500 opacity-0 blur-3xl transition-opacity duration-300 ease-in-out group-hover:opacity-10" />
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
                                    <Icon className={`h-5 w-5 ${iconClass}`} />
                                </span>
                                <span className="text-sm font-medium text-zinc-400">{label}</span>
                            </div>
                            <p className="text-4xl font-bold tracking-tight text-zinc-50">{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Charts Section ──────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Chart 1: Applications by Status (horizontal bar) */}
                    <div className={`${CARD} p-6 md:p-8`}>
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-50 mb-6 flex items-center gap-2.5">
                            <BarChart3 className="h-5 w-5 text-purple-400" />
                            {t("applicationsByStatus")}
                        </h2>
                        <div className="space-y-5">
                            {statusKeys.map(({ key, labelKey }) => (
                                <div key={key} className="space-y-1.5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-400">{t(labelKey as "notStarted" | "inProgress" | "ready" | "submitted")}</span>
                                        <span className="text-zinc-200 font-medium tabular-nums">{data.byStatus[key] || 0}</span>
                                    </div>
                                    <div className="w-full bg-zinc-800/60 rounded-lg h-8 overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full rounded-lg transition-all duration-700 ease-out ${STATUS_BAR_COLORS[key]}`}
                                            style={{
                                                width: `${((data.byStatus[key] || 0) / maxStatusCount) * 100}%`,
                                                minWidth: data.byStatus[key] ? "8px" : "0",
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart 2: Deadlines by Month (vertical bar) */}
                    <div className={`${CARD} p-6 md:p-8`}>
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-50 mb-6 flex items-center gap-2.5">
                            <Clock className="h-5 w-5 text-purple-400" />
                            {t("deadlinesByMonth")}
                        </h2>
                        {data.deadlinesByMonth.length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
                                No deadline data
                            </div>
                        ) : (
                            <div className="flex items-end justify-center gap-3 h-48">
                                {data.deadlinesByMonth.slice(0, 6).map((d) => (
                                    <div key={d.month} className="group flex flex-col items-center gap-2">
                                        <span className="text-xs text-zinc-400 font-medium tabular-nums">{d.count}</span>
                                        <div
                                            className="w-12 rounded-t-lg bg-gradient-to-t from-purple-600 via-purple-500 to-orange-500 transition-all duration-700 ease-out group-hover:brightness-125 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                                            style={{
                                                height: `${(d.count / maxDeadlineCount) * 140}px`,
                                                minHeight: "8px",
                                            }}
                                        />
                                        <span className="text-xs text-zinc-500">{monthLabel(d.month)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chart 3: Documents Progress (donut/ring) */}
                    <div className={`${CARD} p-6 md:p-8`}>
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-50 mb-6 flex items-center gap-2.5">
                            <FileText className="h-5 w-5 text-purple-400" />
                            {t("documentsProgress")}
                        </h2>
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-purple-500 opacity-10 blur-3xl" />
                                <svg width="160" height="160" viewBox="0 0 160 160" className="relative">
                                    <defs>
                                        <linearGradient id="accepta-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#a855f7" />
                                            <stop offset="100%" stopColor="#f97316" />
                                        </linearGradient>
                                    </defs>
                                    {/* Track */}
                                    <circle
                                        cx="80" cy="80" r={radius}
                                        fill="none"
                                        stroke="rgba(255,255,255,0.06)"
                                        strokeWidth="14"
                                    />
                                    {/* Fill */}
                                    <circle
                                        cx="80" cy="80" r={radius}
                                        fill="none"
                                        stroke="url(#accepta-ring)"
                                        strokeWidth="14"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        transform="rotate(-90 80 80)"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold tracking-tight text-zinc-50 tabular-nums">
                                        {data.documentsUploaded}/{data.totalApplications}
                                    </span>
                                    <span className="text-xs text-zinc-500">docs</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart 4: Recent Activity Timeline */}
                    <div className={`${CARD} p-6 md:p-8`}>
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-50 mb-6 flex items-center gap-2.5">
                            <Activity className="h-5 w-5 text-purple-400" />
                            {t("recentActivity")}
                        </h2>
                        {data.recentActivity.length === 0 ? (
                            <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
                                No recent activity
                            </div>
                        ) : (
                            <div className="relative pl-6">
                                {/* Vertical line */}
                                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-purple-500/40 via-white/10 to-transparent" />
                                <div className="space-y-5">
                                    {data.recentActivity.map((item) => (
                                        <div key={item.id} className="relative flex items-start gap-4">
                                            {/* Dot */}
                                            <div
                                                className={`absolute -left-6 top-1.5 h-3 w-3 rounded-full ring-2 ring-zinc-900 ${STATUS_COLORS[item.status] || "bg-zinc-500"}`}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-200 truncate">
                                                    {item.universityName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span
                                                        className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium border ${
                                                            item.status === "SUBMITTED"
                                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                                : item.status === "READY"
                                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                                    : item.status === "IN_PROGRESS"
                                                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                                                        : "bg-zinc-800/50 text-zinc-400 border-white/5"
                                                        }`}
                                                    >
                                                        {item.status === "NOT_STARTED" ? t("notStarted")
                                                            : item.status === "IN_PROGRESS" ? t("inProgress")
                                                                : item.status === "READY" ? t("ready")
                                                                    : t("submitted")}
                                                    </span>
                                                    <span className="text-xs text-zinc-500">
                                                        {relativeTime(item.updatedAt, t("today"), t("daysAgo"))}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Bottom: Countries Applied ───────────────────────────── */}
                {data.countriesApplied.length > 0 && (
                    <div className={`${CARD} p-6 md:p-8`}>
                        <h2 className="text-lg font-semibold tracking-tight text-zinc-50 mb-5 flex items-center gap-2.5">
                            <Globe className="h-5 w-5 text-purple-400" />
                            {t("countriesApplied")}
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {data.countriesApplied.map((c) => (
                                <span
                                    key={c.country}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800/50 border border-white/5 text-sm text-zinc-200 font-medium transition-all duration-300 ease-in-out hover:border-purple-500/30 hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] cursor-default"
                                >
                                    <span>{getCountryFlag(c.country)}</span>
                                    {c.country}
                                    <span className="text-zinc-500 ml-1 tabular-nums">{c.count}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
