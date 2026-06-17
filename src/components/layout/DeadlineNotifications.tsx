"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { BellIcon, GraduationCapIcon, XIcon } from "lucide-react";
import Link from "next/link";

type Application = {
    id: string;
    universityName: string;
    programName?: string;
    deadline?: string;
    status: string;
};

type DeadlineItem = Application & { daysLeft: number };

function urgencyConfig(daysLeft: number) {
    if (daysLeft <= 7) return { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", badge: "bg-red-500", label: "Urgent" };
    if (daysLeft <= 14) return { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", badge: "bg-amber-500", label: "Soon" };
    return { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", badge: "bg-blue-500", label: "Upcoming" };
}

export function DeadlineNotifications() {
    const t = useTranslations("Notifications");
    const [open, setOpen] = useState(false);
    const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/applications");
                if (!res.ok) return;
                const apps: Application[] = await res.json();
                const now = new Date();
                const upcoming = apps
                    .filter((a) => a.deadline && a.status !== "SUBMITTED")
                    .map((a) => ({
                        ...a,
                        daysLeft: Math.ceil(
                            (new Date(a.deadline!).getTime() - now.getTime()) / (1000 * 3600 * 24)
                        ),
                    }))
                    .filter((a) => a.daysLeft >= 0 && a.daysLeft <= 30)
                    .sort((a, b) => a.daysLeft - b.daysLeft);
                setDeadlines(upcoming);
            } catch {
                // silently fail
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    // Close on outside click
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const urgentCount = deadlines.filter((d) => d.daysLeft <= 7).length;
    const badgeCount = deadlines.length;

    return (
        <div className="relative" ref={ref}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 transition-all"
                aria-label="Deadline notifications"
            >
                <BellIcon className={`w-5 h-5 ${urgentCount > 0 ? "text-red-400" : ""}`} />
                {badgeCount > 0 && (
                    <span className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${urgentCount > 0 ? "bg-red-500" : "bg-blue-500"}`}>
                        {badgeCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-12 w-80 rounded-2xl border border-neutral-800/80 bg-neutral-950/95 backdrop-blur-xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/60">
                        <div className="flex items-center gap-2">
                            <BellIcon className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-semibold text-neutral-200">{t("upcomingDeadlines")}</span>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-neutral-600 hover:text-neutral-300 transition-colors"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="max-h-80 overflow-y-auto">
                        {isLoading ? (
                            <div className="px-4 py-6 text-center text-neutral-500 text-sm">
                                {t("loading")}
                            </div>
                        ) : deadlines.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <GraduationCapIcon className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                                <p className="text-neutral-500 text-sm">{t("noDeadlines")}</p>
                            </div>
                        ) : (
                            <div className="p-2 space-y-1">
                                {deadlines.map((item) => {
                                    const cfg = urgencyConfig(item.daysLeft);
                                    return (
                                        <Link
                                            key={item.id}
                                            href="/applications"
                                            onClick={() => setOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${cfg.bg} hover:opacity-80 transition-opacity group`}
                                        >
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.badge}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-neutral-100 truncate">
                                                    {item.universityName}
                                                </p>
                                                {item.programName && (
                                                    <p className="text-[10px] text-neutral-500 truncate">
                                                        {item.programName}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={`text-xs font-black ${cfg.color}`}>
                                                    {item.daysLeft === 0 ? t("today") : t("daysLeft", { count: item.daysLeft })}
                                                </p>
                                                <p className={`text-[9px] uppercase font-bold ${cfg.color} opacity-70`}>
                                                    {cfg.label}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {deadlines.length > 0 && (
                        <div className="border-t border-neutral-800/60 px-4 py-2.5">
                            <Link
                                href="/applications"
                                onClick={() => setOpen(false)}
                                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
                            >
                                {t("viewAllApplications")}
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
