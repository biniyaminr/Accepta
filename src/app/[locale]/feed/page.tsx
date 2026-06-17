"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ExternalLink, GraduationCap, DollarSign, Calendar, Globe,
    RefreshCw, Sparkles, CheckCircle2, AlertCircle,
    ScaleIcon, PinIcon, XIcon, CheckIcon,
    BookmarkIcon, SearchIcon, SlidersHorizontal, Zap, Eye,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Opportunity {
    id: string;
    university: string;
    programName: string;
    description: string | null;
    deadline: string | null;
    isScholarship: boolean;
    isFreeApp: boolean;
    country: string | null;
    link: string;
    createdAt: string;
}

// ── Country Flag Lookup ───────────────────────────────────────────────────────

const COUNTRY_FLAGS: [string, string][] = [
    ["usa", "🇺🇸"], ["united states", "🇺🇸"],
    ["uk", "🇬🇧"], ["united kingdom", "🇬🇧"],
    ["germany", "🇩🇪"],
    ["france", "🇫🇷"],
    ["canada", "🇨🇦"],
    ["australia", "🇦🇺"],
    ["netherlands", "🇳🇱"],
    ["sweden", "🇸🇪"],
    ["norway", "🇳🇴"],
    ["denmark", "🇩🇰"],
    ["finland", "🇫🇮"],
    ["switzerland", "🇨🇭"],
    ["austria", "🇦🇹"],
    ["belgium", "🇧🇪"],
    ["italy", "🇮🇹"],
    ["spain", "🇪🇸"],
    ["japan", "🇯🇵"],
    ["south korea", "🇰🇷"],
    ["china", "🇨🇳"],
    ["india", "🇮🇳"],
    ["turkey", "🇹🇷"],
    ["south africa", "🇿🇦"],
    ["brazil", "🇧🇷"],
    ["mexico", "🇲🇽"],
    ["ethiopia", "🇪🇹"],
    ["kenya", "🇰🇪"],
    ["ghana", "🇬🇭"],
    ["nigeria", "🇳🇬"],
    ["egypt", "🇪🇬"],
    ["morocco", "🇲🇦"],
    ["russia", "🇷🇺"],
    ["poland", "🇵🇱"],
    ["singapore", "🇸🇬"],
    ["new zealand", "🇳🇿"],
    ["ireland", "🇮🇪"],
    ["portugal", "🇵🇹"],
    ["greece", "🇬🇷"],
    ["uae", "🇦🇪"],
    ["qatar", "🇶🇦"],
    ["taiwan", "🇹🇼"],
    ["thailand", "🇹🇭"],
    ["malaysia", "🇲🇾"],
    ["indonesia", "🇮🇩"],
    ["pakistan", "🇵🇰"],
];

function getCountryFlag(country: string | null): string {
    if (!country) return "🌍";
    const lower = country.toLowerCase();
    for (const [key, flag] of COUNTRY_FLAGS) {
        if (lower.includes(key)) return flag;
    }
    return "🌍";
}

function CountryLabel({ country }: { country: string | null }) {
    if (!country) return null;
    return (
        <span className="flex items-center gap-1.5">
            <span>{getCountryFlag(country)}</span>
            <span>{country}</span>
        </span>
    );
}

// ── Deadline Countdown ────────────────────────────────────────────────────────

function getDeadlineInfo(deadline: string | null, t: (key: string, opts?: Record<string, unknown>) => string): {
    label: string;
    colorClass: string;
    isUrgent: boolean;
} {
    if (!deadline) return { label: t("noDeadline"), colorClass: "text-neutral-500", isUrgent: false };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const days = differenceInDays(deadlineDate, today);

    if (days < 0) return { label: t("expired"), colorClass: "text-neutral-500 line-through", isUrgent: false };
    if (days === 0) return { label: t("todayDeadline"), colorClass: "text-red-400 font-bold", isUrgent: true };
    if (days <= 7) return { label: t("daysLeft", { days }), colorClass: "text-red-400 font-semibold", isUrgent: true };
    if (days <= 14) return { label: t("daysLeft", { days }), colorClass: "text-amber-400 font-medium", isUrgent: false };
    if (days <= 30) return { label: t("daysLeft", { days }), colorClass: "text-blue-400", isUrgent: false };
    return { label: t("daysLeft", { days }), colorClass: "text-neutral-400", isUrgent: false };
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
    opp,
    evaluationResult,
    isSaved,
    isSaving,
    onClose,
    onSave,
    onMarkRead,
}: {
    opp: Opportunity | null;
    evaluationResult?: { score: number; strengths: string; missing: string };
    isSaved: boolean;
    isSaving: boolean;
    onClose: () => void;
    onSave: (opp: Opportunity) => void;
    onMarkRead: (id: string) => void;
}) {
    const t = useTranslations("Feed");

    useEffect(() => {
        if (opp) {
            onMarkRead(opp.id);
        }
    }, [opp, onMarkRead]);

    if (!opp) return null;

    const deadlineInfo = getDeadlineInfo(opp.deadline, t);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCountryFlag(opp.country)}</span>
                        <div>
                            <h2 className="text-base font-bold text-neutral-100 line-clamp-1">{opp.university}</h2>
                            <p className="text-xs text-violet-400 font-medium line-clamp-1">{opp.programName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors shrink-0"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                        {opp.isScholarship && (
                            <Badge className="bg-amber-900/30 text-amber-400 border-amber-800">
                                <GraduationCap className="mr-1 h-3 w-3" /> 🏆 {t("scholarship")}
                            </Badge>
                        )}
                        {opp.isFreeApp && (
                            <Badge className="bg-emerald-900/30 text-emerald-400 border-emerald-800">
                                <DollarSign className="mr-1 h-3 w-3" /> 💸 {t("freeRegistration")}
                            </Badge>
                        )}
                    </div>

                    {/* Country */}
                    {opp.country && (
                        <div className="flex items-center gap-2 text-sm text-neutral-300">
                            <Globe className="w-4 h-4 text-neutral-500 shrink-0" />
                            <CountryLabel country={opp.country} />
                        </div>
                    )}

                    {/* Deadline */}
                    {opp.deadline && (
                        <div className="flex items-start gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                            <div>
                                <span className={`block text-base font-bold ${deadlineInfo.colorClass}`}>
                                    {deadlineInfo.label}
                                    {deadlineInfo.isUrgent && (
                                        <span className="ml-2 inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse align-middle" />
                                    )}
                                </span>
                                <span className="text-xs text-neutral-500">{format(new Date(opp.deadline), "PPP")}</span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">{t("description")}</h3>
                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                            {opp.description || t("noDescriptionOpportunity")}
                        </p>
                    </div>

                    {/* AI Fit Analysis */}
                    {evaluationResult && (
                        <div className="relative p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden flex flex-col gap-3">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" /> {t("aiFitAnalysis")}
                                </span>
                                <div className={`px-3 py-1 rounded-full border text-lg font-bold ${
                                    evaluationResult.score >= 80 ? "text-green-400 bg-green-400/10 border-green-400/20" :
                                    evaluationResult.score >= 50 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" :
                                    "text-red-400 bg-red-400/10 border-red-400/20"
                                }`}>
                                    {evaluationResult.score}%
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex gap-2 items-start">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <p className="text-neutral-400 leading-snug">
                                        <strong className="text-neutral-200 font-semibold">{t("strengths")}</strong> {evaluationResult.strengths}
                                    </p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                    <p className="text-neutral-400 leading-snug">
                                        <strong className="text-neutral-200 font-semibold">{t("missing")}</strong> {evaluationResult.missing}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-800 shrink-0">
                    <Button variant="outline" className="flex-1" asChild>
                        <a href={opp.link} target="_blank" rel="noopener noreferrer">
                            {t("view")} <ExternalLink className="ml-2 h-3.5 w-3.5" />
                        </a>
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={() => onSave(opp)}
                        disabled={isSaving || isSaved}
                    >
                        {isSaving ? (
                            <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                        ) : isSaved ? t("savedCheck") : t("saveTracker")}
                    </Button>
                </div>
            </div>
        </>
    );
}

// ── Comparison Modal ──────────────────────────────────────────────────────────

function CompareModal({
    pinned,
    evaluationResults,
    onClose,
    onUnpin,
}: {
    pinned: Opportunity[];
    evaluationResults: Record<string, { score: number; strengths: string; missing: string }>;
    onClose: () => void;
    onUnpin: (id: string) => void;
}) {
    const t = useTranslations("Feed");

    const rows: { label: string; render: (opp: Opportunity) => React.ReactNode }[] = [
        {
            label: t("university"),
            render: (o) => <span className="font-bold text-neutral-100">{o.university}</span>,
        },
        {
            label: t("program"),
            render: (o) => <span className="text-violet-300 font-medium">{o.programName}</span>,
        },
        {
            label: t("country"),
            render: (o) =>
                o.country ? (
                    <span className="flex items-center gap-1.5 text-neutral-300">
                        <Globe className="w-3.5 h-3.5 text-neutral-500" />
                        {getCountryFlag(o.country)} {o.country}
                    </span>
                ) : (
                    <span className="text-neutral-600">—</span>
                ),
        },
        {
            label: t("deadline"),
            render: (o) => {
                if (!o.deadline) return <span className="text-neutral-600">{t("notSpecified")}</span>;
                const info = getDeadlineInfo(o.deadline, t);
                return (
                    <div>
                        <span className={`text-sm font-semibold ${info.colorClass}`}>{info.label}</span>
                        <span className="block text-xs text-neutral-500 mt-0.5">{format(new Date(o.deadline), "PPP")}</span>
                    </div>
                );
            },
        },
        {
            label: t("scholarshipLabel"),
            render: (o) =>
                o.isScholarship ? (
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <CheckIcon className="w-4 h-4" /> Yes
                    </span>
                ) : (
                    <span className="text-neutral-600">No</span>
                ),
        },
        {
            label: t("freeApplication"),
            render: (o) =>
                o.isFreeApp ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <CheckIcon className="w-4 h-4" /> Yes
                    </span>
                ) : (
                    <span className="text-neutral-600">No</span>
                ),
        },
        {
            label: t("aiFitScore"),
            render: (o) => {
                const result = evaluationResults[o.id];
                if (!result) return <span className="text-neutral-600 text-xs">{t("notEvaluated")}</span>;
                const color =
                    result.score >= 80
                        ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                        : result.score >= 50
                        ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
                        : "text-red-400 bg-red-400/10 border-red-400/20";
                return (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full border font-black text-lg ${color}`}>
                        {result.score}%
                    </span>
                );
            },
        },
        {
            label: t("overview"),
            render: (o) => (
                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-4">
                    {o.description || t("noDescription")}
                </p>
            ),
        },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                            <ScaleIcon className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-100">{t("sideBySideComparison")}</h2>
                            <p className="text-xs text-neutral-500">{t("comparing", { count: pinned.length, label: pinned.length > 1 ? t("opportunities") : t("opportunity") })}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-auto flex-1">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-neutral-800/60">
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-neutral-600 uppercase tracking-widest w-36 shrink-0">
                                    {t("fieldLabel")}
                                </th>
                                {pinned.map((opp) => (
                                    <th key={opp.id} className="px-5 py-3 text-left min-w-[220px]">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-bold text-neutral-200 line-clamp-1">{opp.university}</p>
                                                <p className="text-[10px] text-neutral-500 line-clamp-1">{opp.programName}</p>
                                            </div>
                                            <button
                                                onClick={() => onUnpin(opp.id)}
                                                className="text-neutral-700 hover:text-red-400 transition-colors shrink-0 mt-0.5"
                                                title={t("removeFromComparison")}
                                            >
                                                <XIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={row.label} className={`border-b border-neutral-800/40 ${i % 2 === 0 ? "bg-neutral-900/20" : ""}`}>
                                    <td className="px-5 py-4 text-[11px] font-bold text-neutral-500 uppercase tracking-widest align-top">
                                        {row.label}
                                    </td>
                                    {pinned.map((opp) => (
                                        <td key={opp.id} className="px-5 py-4 align-top text-sm">
                                            {row.render(opp)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer links */}
                <div className="flex items-center gap-3 px-6 py-4 border-t border-neutral-800 shrink-0">
                    {pinned.map((opp) => (
                        <a
                            key={opp.id}
                            href={opp.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 text-xs text-neutral-400 hover:text-white hover:border-neutral-500 transition-all"
                        >
                            <ExternalLink className="w-3 h-3" />
                            {opp.university}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Sticky Compare Bar ────────────────────────────────────────────────────────

function CompareStickyBar({
    pinned,
    onCompare,
    onUnpin,
    onClear,
}: {
    pinned: Opportunity[];
    onCompare: () => void;
    onUnpin: (id: string) => void;
    onClear: () => void;
}) {
    const t = useTranslations("Feed");

    if (pinned.length === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-neutral-700 bg-neutral-900/95 backdrop-blur-xl shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2">
                    <ScaleIcon className="w-4 h-4 text-violet-400 shrink-0" />
                    <span className="text-xs font-semibold text-neutral-300">
                        {t("pinnedCount", { count: pinned.length })}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {pinned.map((opp) => (
                        <div key={opp.id}
                            className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
                            <span className="max-w-[100px] truncate font-medium">{opp.university}</span>
                            <button onClick={() => onUnpin(opp.id)} className="text-violet-500 hover:text-red-400 transition-colors">
                                <XIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 ml-1">
                    <button onClick={onClear} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">
                        {t("clear")}
                    </button>
                    <Button
                        size="sm"
                        onClick={onCompare}
                        disabled={pinned.length < 2}
                        className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs h-8"
                    >
                        <ScaleIcon className="w-3.5 h-3.5" />
                        {pinned.length >= 2 ? t("compareNow") : t("minTwo")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── Filter Chip ───────────────────────────────────────────────────────────────

function FilterChip({
    active,
    onClick,
    activeClass,
    children,
}: {
    active: boolean;
    onClick: () => void;
    activeClass: string;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                active
                    ? activeClass
                    : "border-neutral-700 text-neutral-400 bg-transparent hover:border-neutral-600 hover:text-neutral-300"
            }`}
        >
            {children}
        </button>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function OpportunitiesFeed() {
    const t = useTranslations("Feed");
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
    const [evaluationResults, setEvaluationResults] = useState<Record<string, { score: number; strengths: string; missing: string }>>({});
    const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
    const [showCompare, setShowCompare] = useState(false);

    // Feature 1: Search + Filter
    const [search, setSearch] = useState("");
    const [filterScholarship, setFilterScholarship] = useState(false);
    const [filterFreeApp, setFilterFreeApp] = useState(false);
    const [filterCountry, setFilterCountry] = useState("");

    // Feature 2: Sort
    const [sortBy, setSortBy] = useState<"newest" | "deadline" | "fit">("newest");

    // Feature 4: Detail Drawer
    const [drawerOpp, setDrawerOpp] = useState<Opportunity | null>(null);

    // Feature 5: Bookmarks
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
    const [filterBookmarked, setFilterBookmarked] = useState(false);

    // Feature 6: Batch Evaluate
    const [isEvaluatingAll, setIsEvaluatingAll] = useState(false);
    const [evaluateAllProgress, setEvaluateAllProgress] = useState<{ current: number; total: number } | null>(null);

    // Feature 8: Read/Unread
    const [readIds, setReadIds] = useState<Set<string>>(new Set());
    const [filterUnread, setFilterUnread] = useState(false);

    // ── Load from localStorage on mount ──────────────────────────────────────

    useEffect(() => {
        try {
            const raw = localStorage.getItem("accepta-bookmarks");
            if (raw) setBookmarkedIds(new Set(JSON.parse(raw)));
        } catch {}
        try {
            const raw = localStorage.getItem("accepta-read");
            if (raw) setReadIds(new Set(JSON.parse(raw)));
        } catch {}
    }, []);

    // ── Persist bookmarks on change ───────────────────────────────────────────

    useEffect(() => {
        try {
            localStorage.setItem("accepta-bookmarks", JSON.stringify([...bookmarkedIds]));
        } catch {}
    }, [bookmarkedIds]);

    // ── Persist read IDs on change ────────────────────────────────────────────

    useEffect(() => {
        try {
            localStorage.setItem("accepta-read", JSON.stringify([...readIds]));
        } catch {}
    }, [readIds]);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchOpportunities = async () => {
        try {
            const response = await fetch("/api/opportunities");
            if (response.ok) setOpportunities(await response.json());
        } catch (error) {
            console.error("Failed to fetch opportunities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchOpportunities(); }, []);

    // ── Unique countries for dropdown ─────────────────────────────────────────

    const uniqueCountries = useMemo(() => {
        const countries = opportunities
            .map((o) => o.country)
            .filter((c): c is string => !!c);
        return [...new Set(countries)].sort();
    }, [opportunities]);

    // ── Filtered + sorted opportunities ──────────────────────────────────────

    const filteredOpportunities = useMemo(() => {
        let result = [...opportunities];

        // Text search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (o) =>
                    o.university.toLowerCase().includes(q) ||
                    o.programName.toLowerCase().includes(q)
            );
        }

        // Scholarship filter
        if (filterScholarship) result = result.filter((o) => o.isScholarship);

        // Free app filter
        if (filterFreeApp) result = result.filter((o) => o.isFreeApp);

        // Country filter
        if (filterCountry) result = result.filter((o) => o.country === filterCountry);

        // Bookmarked filter
        if (filterBookmarked) result = result.filter((o) => bookmarkedIds.has(o.id));

        // Unread filter
        if (filterUnread) result = result.filter((o) => !readIds.has(o.id));

        // Sort
        if (sortBy === "newest") {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (sortBy === "deadline") {
            result.sort((a, b) => {
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            });
        } else if (sortBy === "fit") {
            result.sort((a, b) => {
                const scoreA = evaluationResults[a.id]?.score ?? -1;
                const scoreB = evaluationResults[b.id]?.score ?? -1;
                return scoreB - scoreA;
            });
        }

        return result;
    }, [opportunities, search, filterScholarship, filterFreeApp, filterCountry, filterBookmarked, filterUnread, sortBy, bookmarkedIds, readIds, evaluationResults]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleSync = async () => {
        setIsSyncing(true);
        const toastId = toast.loading("Querying international scholarship databases...");
        try {
            const response = await fetch("/api/admin/sync-telegram");
            const data = await response.json();
            if (response.ok) {
                toast.success(`Sync complete! Added ${data.addedCount} new opportunities.`, { id: toastId });
                if (data.addedCount > 0) fetchOpportunities();
            } else {
                toast.error(data.error || "Failed to sync opportunities.", { id: toastId });
            }
        } catch {
            toast.error("An error occurred during sync.", { id: toastId });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSaveToTracker = async (opp: Opportunity) => {
        setSavingIds((prev) => new Set(prev).add(opp.id));
        try {
            const response = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    universityName: opp.university,
                    programName: opp.programName,
                    url: opp.link,
                    deadline: opp.deadline,
                }),
            });
            if (response.ok) {
                setSavedIds((prev) => new Set(prev).add(opp.id));
                toast.success(`${opp.university} saved to your Application Tracker!`);
            } else {
                toast.error("Failed to save to tracker.");
            }
        } catch {
            toast.error("Network error.");
        } finally {
            setSavingIds((prev) => { const next = new Set(prev); next.delete(opp.id); return next; });
        }
    };

    const handleEvaluate = async (opp: Opportunity) => {
        setEvaluatingId(opp.id);
        const toastId = toast.loading(`Evaluating your fit for ${opp.university}...`);
        try {
            const response = await fetch("/api/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    opportunityTitle: `${opp.university} - ${opp.programName}`,
                    opportunityDescription: opp.description,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success("Evaluation complete!", { id: toastId });
                setEvaluationResults((prev) => ({ ...prev, [opp.id]: data }));
            } else {
                toast.error(data.error || "Failed to evaluate fit.", { id: toastId });
            }
        } catch {
            toast.error("An error occurred during evaluation.", { id: toastId });
        } finally {
            setEvaluatingId(null);
        }
    };

    // Feature 6: Batch evaluate all visible unevaluated cards
    const handleEvaluateAll = async () => {
        const toEvaluate = filteredOpportunities.filter((o) => !evaluationResults[o.id]);
        if (toEvaluate.length === 0) {
            toast.info("All visible opportunities are already evaluated.");
            return;
        }
        setIsEvaluatingAll(true);
        setEvaluateAllProgress({ current: 0, total: toEvaluate.length });

        for (let i = 0; i < toEvaluate.length; i++) {
            const opp = toEvaluate[i];
            setEvaluateAllProgress({ current: i + 1, total: toEvaluate.length });
            toast.loading(`Evaluating ${i + 1} of ${toEvaluate.length}...`, { id: "evaluate-all" });
            try {
                const response = await fetch("/api/evaluate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        opportunityTitle: `${opp.university} - ${opp.programName}`,
                        opportunityDescription: opp.description,
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    setEvaluationResults((prev) => ({ ...prev, [opp.id]: data }));
                }
            } catch {
                // continue on error
            }
        }

        toast.success(`Evaluated all ${toEvaluate.length} opportunities!`, { id: "evaluate-all" });
        setIsEvaluatingAll(false);
        setEvaluateAllProgress(null);
    };

    const togglePin = (id: string) => {
        setPinnedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (next.size >= 3) {
                    toast.error("Maximum 3 programs can be compared at once.");
                    return prev;
                }
                next.add(id);
            }
            return next;
        });
    };

    // Feature 5: Toggle bookmark
    const toggleBookmark = (id: string) => {
        setBookmarkedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // Feature 8: Mark as read
    const markRead = (id: string) => {
        setReadIds((prev) => {
            if (prev.has(id)) return prev;
            return new Set(prev).add(id);
        });
    };

    const pinnedOpps = opportunities.filter((o) => pinnedIds.has(o.id));

    return (
        <div className="container mx-auto py-8 px-4 pb-28">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">{t("pageTitle")}</h1>
                    <p className="text-muted-foreground">
                        {t("pageSubtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Feature 6: Evaluate All button */}
                    <Button
                        variant="outline"
                        onClick={handleEvaluateAll}
                        disabled={isEvaluatingAll || loading}
                        className="w-full md:w-auto border-primary/30 text-primary hover:bg-primary/10"
                    >
                        <Zap className={`mr-2 h-4 w-4 ${isEvaluatingAll ? "animate-pulse" : ""}`} />
                        {isEvaluatingAll && evaluateAllProgress
                            ? t("evaluatingProgress", { current: evaluateAllProgress.current, total: evaluateAllProgress.total })
                            : t("evaluateAll")}
                    </Button>
                    <Button variant="outline" onClick={handleSync} disabled={isSyncing} className="w-full md:w-auto">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? t("syncing") : t("syncNow")}
                    </Button>
                </div>
            </div>

            {/* Feature 1 + 2: Filter bar */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 mb-6 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                        <Input
                            placeholder={t("searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 bg-neutral-900 border-neutral-700 text-neutral-200 placeholder:text-neutral-600 focus:border-neutral-500"
                        />
                    </div>

                    {/* Country dropdown */}
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                        <select
                            value={filterCountry}
                            onChange={(e) => setFilterCountry(e.target.value)}
                            className="pl-9 pr-4 h-10 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-200 text-sm focus:outline-none focus:border-neutral-500 appearance-none cursor-pointer min-w-[160px]"
                        >
                            <option value="">{t("allCountries")}</option>
                            {uniqueCountries.map((c) => (
                                <option key={c} value={c}>
                                    {getCountryFlag(c)} {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Sort dropdown */}
                    <div className="relative">
                        <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "newest" | "deadline" | "fit")}
                            className="pl-9 pr-4 h-10 rounded-md border border-neutral-700 bg-neutral-900 text-neutral-200 text-sm focus:outline-none focus:border-neutral-500 appearance-none cursor-pointer"
                        >
                            <option value="newest">{t("newestFirst")}</option>
                            <option value="deadline">{t("deadlineSoonest")}</option>
                            <option value="fit">{t("aiFitScore")}</option>
                        </select>
                    </div>
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    <FilterChip
                        active={filterScholarship}
                        onClick={() => setFilterScholarship((v) => !v)}
                        activeClass="bg-amber-500/15 border-amber-500/40 text-amber-400"
                    >
                        🏆 {t("scholarshipsOnly")}
                    </FilterChip>
                    <FilterChip
                        active={filterFreeApp}
                        onClick={() => setFilterFreeApp((v) => !v)}
                        activeClass="bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                    >
                        💸 {t("freeAppOnly")}
                    </FilterChip>
                    <FilterChip
                        active={filterBookmarked}
                        onClick={() => setFilterBookmarked((v) => !v)}
                        activeClass="bg-amber-500/15 border-amber-500/40 text-amber-400"
                    >
                        <BookmarkIcon className="inline w-3 h-3 mr-1 fill-current" />
                        {t("bookmarked")}
                    </FilterChip>
                    <FilterChip
                        active={filterUnread}
                        onClick={() => setFilterUnread((v) => !v)}
                        activeClass="bg-green-500/15 border-green-500/40 text-green-400"
                    >
                        <Eye className="inline w-3 h-3 mr-1" />
                        {t("unreadOnly")}
                    </FilterChip>

                    {/* Result count */}
                    <span className="ml-auto text-xs text-neutral-500">
                        {filteredOpportunities.length !== 1
                            ? t("resultsPlural", { count: filteredOpportunities.length })
                            : t("results", { count: filteredOpportunities.length })}
                    </span>
                </div>
            </div>

            {/* Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="overflow-hidden">
                            <CardHeader className="gap-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </CardHeader>
                            <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                            <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                        </Card>
                    ))}
                </div>
            ) : filteredOpportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-semibold">{t("noOpportunitiesFound")}</h2>
                    <p className="text-muted-foreground">
                        {opportunities.length === 0
                            ? t("syncToLoad")
                            : t("adjustFilters")}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOpportunities.map((opp) => {
                        const isPinned = pinnedIds.has(opp.id);
                        const isBookmarked = bookmarkedIds.has(opp.id);
                        const isRead = readIds.has(opp.id);
                        const deadlineInfo = getDeadlineInfo(opp.deadline, t);

                        return (
                            <Card
                                key={opp.id}
                                className={`group relative overflow-hidden border-2 transition-all hover:shadow-lg ${
                                    isPinned
                                        ? "border-violet-500/60 bg-violet-500/5"
                                        : "hover:border-primary/50 dark:hover:bg-accent/10"
                                } ${isRead ? "opacity-80" : ""}`}
                            >
                                {/* Feature 8: Unread green dot */}
                                {!isRead && (
                                    <span className="absolute top-3 left-3 z-10 w-2 h-2 rounded-full bg-green-500" />
                                )}

                                {/* Feature 3: Urgent pulsing red dot */}
                                {deadlineInfo.isUrgent && (
                                    <span className="absolute top-3 left-3 z-10 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                )}

                                {/* Action buttons top-right: bookmark + pin */}
                                <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                                    {/* Feature 5: Bookmark button */}
                                    <button
                                        onClick={() => toggleBookmark(opp.id)}
                                        title={isBookmarked ? t("removeBookmark") : t("bookmark")}
                                        className={`p-1.5 rounded-lg border transition-all ${
                                            isBookmarked
                                                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                                                : "bg-neutral-900/80 border-neutral-700 text-neutral-600 opacity-0 group-hover:opacity-100 hover:text-amber-400 hover:border-amber-500/40"
                                        }`}
                                    >
                                        <BookmarkIcon className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                                    </button>

                                    {/* Pin button */}
                                    <button
                                        onClick={() => togglePin(opp.id)}
                                        title={isPinned ? t("removeFromComparison") : t("pinToCompare")}
                                        className={`p-1.5 rounded-lg border transition-all ${
                                            isPinned
                                                ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                                                : "bg-neutral-900/80 border-neutral-700 text-neutral-600 opacity-0 group-hover:opacity-100 hover:text-violet-400 hover:border-violet-500/40"
                                        }`}
                                    >
                                        <PinIcon className={`w-3.5 h-3.5 ${isPinned ? "fill-current" : ""}`} />
                                    </button>
                                </div>

                                <CardHeader>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-wrap gap-2">
                                            {opp.isScholarship && (
                                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                                    <GraduationCap className="mr-1 h-3 w-3" /> 🏆 {t("scholarship")}
                                                </Badge>
                                            )}
                                            {opp.isFreeApp && (
                                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                                    <DollarSign className="mr-1 h-3 w-3" /> 💸 {t("freeRegistration")}
                                                </Badge>
                                            )}
                                            {isPinned && (
                                                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/30">
                                                    <PinIcon className="mr-1 h-3 w-3 fill-current" /> {t("pinned")}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl line-clamp-1 pr-16">{opp.university}</CardTitle>
                                    <CardDescription className="text-primary font-medium line-clamp-1">
                                        {opp.programName}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <p className="text-sm text-muted-foreground line-clamp-3 min-h-[4.5rem]">
                                        {opp.description || "Explore this exciting opportunity."}
                                    </p>
                                    <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                                        {/* Feature 7: Country flag */}
                                        {opp.country && (
                                            <div className="flex items-center gap-1.5">
                                                <Globe className="h-3.5 w-3.5 shrink-0" />
                                                <CountryLabel country={opp.country} />
                                            </div>
                                        )}
                                        {/* Feature 3: Deadline countdown */}
                                        {opp.deadline && (
                                            <div className="flex items-start gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className={`font-semibold ${deadlineInfo.colorClass}`}>
                                                        {deadlineInfo.label}
                                                        {deadlineInfo.isUrgent && (
                                                            <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse align-middle" />
                                                        )}
                                                    </span>
                                                    <span className="block text-neutral-500 text-[10px]">
                                                        {format(new Date(opp.deadline), "PPP")}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>

                                <CardFooter className="flex flex-col gap-3 w-full">
                                    <div className="flex w-full gap-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            asChild
                                        >
                                            <a
                                                href={opp.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={() => markRead(opp.id)}
                                            >
                                                {t("view")} <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                        {/* Feature 4: Details button */}
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setDrawerOpp(opp)}
                                        >
                                            {t("details")} <Eye className="ml-2 h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            onClick={() => handleSaveToTracker(opp)}
                                            disabled={savingIds.has(opp.id) || savedIds.has(opp.id)}
                                        >
                                            {savingIds.has(opp.id) ? (
                                                <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                                            ) : savedIds.has(opp.id) ? t("savedCheck") : t("save")}
                                        </Button>
                                    </div>

                                    {evaluationResults[opp.id] ? (
                                        <div className="w-full relative mt-1 p-4 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden shadow-inner flex flex-col gap-3 text-left">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-primary" /> {t("aiFitAnalysis")}
                                                </span>
                                                <div className={`px-3 py-1 rounded-full border text-lg font-bold ${
                                                    evaluationResults[opp.id].score >= 80 ? "text-green-400 bg-green-400/10 border-green-400/20" :
                                                    evaluationResults[opp.id].score >= 50 ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" :
                                                    "text-red-400 bg-red-400/10 border-red-400/20"
                                                }`}>
                                                    {evaluationResults[opp.id].score}%
                                                </div>
                                            </div>
                                            <div className="space-y-2.5 text-sm mt-1">
                                                <div className="flex gap-2 items-start">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                                    <p className="text-muted-foreground leading-snug">
                                                        <strong className="text-foreground font-semibold">{t("strengths")}</strong> {evaluationResults[opp.id].strengths}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 items-start">
                                                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                                    <p className="text-muted-foreground leading-snug">
                                                        <strong className="text-foreground font-semibold">{t("missing")}</strong> {evaluationResults[opp.id].missing}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="secondary"
                                            className="w-full relative overflow-hidden group border border-primary/20 hover:border-primary/50 transition-colors bg-secondary/50 hover:bg-secondary"
                                            onClick={() => handleEvaluate(opp)}
                                            disabled={evaluatingId === opp.id || isEvaluatingAll}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            {evaluatingId === opp.id ? (
                                                <><RefreshCw className="mr-2 h-4 w-4 animate-spin text-primary" /><span className="font-medium">{t("analyzing")}</span></>
                                            ) : (
                                                <><Sparkles className="mr-2 h-4 w-4 text-primary group-hover:animate-pulse" /><span className="font-semibold text-primary">{t("evaluateFit")}</span></>
                                            )}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Feature 4: Detail Drawer */}
            <DetailDrawer
                opp={drawerOpp}
                evaluationResult={drawerOpp ? evaluationResults[drawerOpp.id] : undefined}
                isSaved={drawerOpp ? savedIds.has(drawerOpp.id) : false}
                isSaving={drawerOpp ? savingIds.has(drawerOpp.id) : false}
                onClose={() => setDrawerOpp(null)}
                onSave={handleSaveToTracker}
                onMarkRead={markRead}
            />

            {/* Sticky compare bar */}
            <CompareStickyBar
                pinned={pinnedOpps}
                onCompare={() => setShowCompare(true)}
                onUnpin={(id) => setPinnedIds((prev) => { const n = new Set(prev); n.delete(id); return n; })}
                onClear={() => setPinnedIds(new Set())}
            />

            {/* Compare modal */}
            {showCompare && pinnedOpps.length >= 2 && (
                <CompareModal
                    pinned={pinnedOpps}
                    evaluationResults={evaluationResults}
                    onClose={() => setShowCompare(false)}
                    onUnpin={(id) => {
                        setPinnedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
                        if (pinnedOpps.length <= 2) setShowCompare(false);
                    }}
                />
            )}
        </div>
    );
}
