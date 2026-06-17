"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Download,
    GraduationCap,
    Users,
    FileText,
    Clock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendarEvent {
    id: string;
    name: string;
    date: string; // ISO date string
    type: "deadline" | "recommendation" | "expiry";
    link: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
    // 0=Sun, we want Mon=0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function isSameDay(d1: Date, d2: Date): boolean {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

function formatDateForICS(dateStr: string): string {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
}

function escapeICS(text: string): string {
    return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
    const t = useTranslations("Calendar");

    const today = useMemo(() => new Date(), []);
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    // ── Fetch events ──────────────────────────────────────────────────────────

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        const allEvents: CalendarEvent[] = [];

        try {
            const [appsRes, recsRes, expiryRes] = await Promise.allSettled([
                fetch("/api/applications"),
                fetch("/api/recommendations"),
                fetch("/api/expiry-alerts"),
            ]);

            if (appsRes.status === "fulfilled" && appsRes.value.ok) {
                const apps = await appsRes.value.json();
                const list = Array.isArray(apps) ? apps : apps.applications ?? [];
                for (const app of list) {
                    if (app.deadline) {
                        allEvents.push({
                            id: `app-${app.id}`,
                            name: app.universityName || app.university || "Application",
                            date: app.deadline,
                            type: "deadline",
                            link: "/applications",
                        });
                    }
                }
            }

            if (recsRes.status === "fulfilled" && recsRes.value.ok) {
                const recs = await recsRes.value.json();
                const list = Array.isArray(recs) ? recs : recs.recommendations ?? [];
                for (const rec of list) {
                    if (rec.dueDate) {
                        allEvents.push({
                            id: `rec-${rec.id}`,
                            name: rec.recommenderName || "Recommendation",
                            date: rec.dueDate,
                            type: "recommendation",
                            link: "/recommendations",
                        });
                    }
                }
            }

            if (expiryRes.status === "fulfilled" && expiryRes.value.ok) {
                const expiry = await expiryRes.value.json();
                const list = Array.isArray(expiry) ? expiry : expiry.alerts ?? [];
                for (const item of list) {
                    if (item.expiryDate) {
                        allEvents.push({
                            id: `exp-${item.id}`,
                            name: item.name || item.label || "Document/Test",
                            date: item.expiryDate,
                            type: "expiry",
                            link: "/profile",
                        });
                    }
                }
            }
        } catch {
            // silently fail — calendar will be empty
        }

        setEvents(allEvents);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // ── Navigation ────────────────────────────────────────────────────────────

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((y) => y - 1);
        } else {
            setCurrentMonth((m) => m - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((y) => y + 1);
        } else {
            setCurrentMonth((m) => m + 1);
        }
    };

    // ── Calendar grid data ────────────────────────────────────────────────────

    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const prevMonthDays = currentMonth === 0
        ? getDaysInMonth(currentYear - 1, 11)
        : getDaysInMonth(currentYear, currentMonth - 1);

    const calendarCells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
        const pMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const pYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        calendarCells.push({ day: prevMonthDays - i, month: pMonth, year: pYear, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        calendarCells.push({ day: d, month: currentMonth, year: currentYear, isCurrentMonth: true });
    }

    // Next month leading days
    const remaining = 42 - calendarCells.length;
    for (let d = 1; d <= remaining; d++) {
        const nMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        calendarCells.push({ day: d, month: nMonth, year: nYear, isCurrentMonth: false });
    }

    // ── Events for a given cell ───────────────────────────────────────────────

    const getEventsForDate = useCallback(
        (year: number, month: number, day: number): CalendarEvent[] => {
            return events.filter((e) => {
                const d = new Date(e.date);
                return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
            });
        },
        [events]
    );

    // ── Selected day events ───────────────────────────────────────────────────

    const selectedDayEvents = useMemo(() => {
        if (!selectedDate) return [];
        return getEventsForDate(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
        );
    }, [selectedDate, getEventsForDate]);

    // ── Export .ics ───────────────────────────────────────────────────────────

    const exportICS = () => {
        const lines: string[] = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Accepta//Calendar//EN",
            "CALSCALE:GREGORIAN",
        ];

        for (const event of events) {
            const dtStart = formatDateForICS(event.date);
            const dtEnd = dtStart;
            const typeLabel =
                event.type === "deadline"
                    ? "Application Deadline"
                    : event.type === "recommendation"
                      ? "Recommendation Due"
                      : "Expiry Date";

            lines.push("BEGIN:VEVENT");
            lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
            lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
            lines.push(`SUMMARY:${escapeICS(event.name)} - ${escapeICS(typeLabel)}`);
            lines.push(`DESCRIPTION:${escapeICS(typeLabel)}: ${escapeICS(event.name)}`);
            lines.push(`UID:${event.id}@accepta`);
            lines.push("END:VEVENT");
        }

        lines.push("END:VCALENDAR");

        const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "accepta-calendar.ics";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ── Event color helpers ───────────────────────────────────────────────────

    const eventPillClass = (type: CalendarEvent["type"]): string => {
        switch (type) {
            case "deadline":
                return "bg-violet-500/20 text-violet-300";
            case "recommendation":
                return "bg-blue-500/20 text-blue-300";
            case "expiry":
                return "bg-amber-500/20 text-amber-300";
        }
    };

    const eventDotClass = (type: CalendarEvent["type"]): string => {
        switch (type) {
            case "deadline":
                return "bg-violet-400";
            case "recommendation":
                return "bg-blue-400";
            case "expiry":
                return "bg-amber-400";
        }
    };

    const eventIcon = (type: CalendarEvent["type"]) => {
        switch (type) {
            case "deadline":
                return <GraduationCap className="h-4 w-4 text-violet-400" />;
            case "recommendation":
                return <Users className="h-4 w-4 text-blue-400" />;
            case "expiry":
                return <Clock className="h-4 w-4 text-amber-400" />;
        }
    };

    const eventTypeBadge = (type: CalendarEvent["type"]): { label: string; className: string } => {
        switch (type) {
            case "deadline":
                return { label: t("applicationDeadline"), className: "bg-violet-500/20 text-violet-300 border-violet-500/30" };
            case "recommendation":
                return { label: t("recommendationDue"), className: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
            case "expiry":
                return { label: t("expiryDate"), className: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
        }
    };

    // ── Month name ────────────────────────────────────────────────────────────

    const monthName = new Date(currentYear, currentMonth).toLocaleString("default", { month: "long" });

    const weekDays = [
        t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat"), t("sun"),
    ];

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-neutral-950 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                                <CalendarDays className="h-6 w-6 text-violet-400" />
                                {t("pageTitle")}
                            </h1>
                            <p className="mt-1 text-sm text-neutral-400">{t("pageSubtitle")}</p>
                        </div>
                        <button
                            onClick={exportICS}
                            className="inline-flex items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-700 border border-neutral-700"
                        >
                            <Download className="h-4 w-4" />
                            {t("exportIcs")}
                        </button>
                    </div>
                </div>

                {/* Month navigation */}
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={goToPrevMonth}
                        className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-semibold text-white">
                        {monthName} {currentYear}
                    </h2>
                    <button
                        onClick={goToNextMonth}
                        className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {/* Legend */}
                <div className="mb-4 flex flex-wrap gap-4 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-violet-400" />
                        {t("applicationDeadline")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                        {t("recommendationDue")}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                        {t("expiryDate")}
                    </span>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-px mb-px">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="py-2 text-center text-xs font-bold uppercase text-neutral-500"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-neutral-500">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-600 border-t-violet-400" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-px rounded-xl border border-neutral-800 bg-neutral-800 overflow-hidden">
                        {calendarCells.map((cell, idx) => {
                            const cellDate = new Date(cell.year, cell.month, cell.day);
                            const isToday = isSameDay(cellDate, today);
                            const isSelected = selectedDate ? isSameDay(cellDate, selectedDate) : false;
                            const cellEvents = getEventsForDate(cell.year, cell.month, cell.day);
                            const maxVisible = 3;
                            const overflow = cellEvents.length > maxVisible ? cellEvents.length - maxVisible : 0;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(cellDate)}
                                    className={`
                                        min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 text-left transition-colors
                                        bg-neutral-900/50 hover:bg-neutral-800/70 relative flex flex-col
                                        ${!cell.isCurrentMonth ? "opacity-40" : ""}
                                        ${isToday ? "ring-2 ring-violet-500/50 bg-violet-500/5 z-10" : ""}
                                        ${isSelected ? "ring-2 ring-white/30 z-10" : ""}
                                    `}
                                >
                                    <span
                                        className={`text-xs sm:text-sm font-medium ${
                                            isToday
                                                ? "text-violet-300 font-bold"
                                                : cell.isCurrentMonth
                                                  ? "text-neutral-300"
                                                  : "text-neutral-600"
                                        }`}
                                    >
                                        {cell.day}
                                        {isToday && (
                                            <span className="ml-1 text-[9px] text-violet-400 hidden sm:inline">
                                                {t("today")}
                                            </span>
                                        )}
                                    </span>

                                    {/* Desktop: event pills */}
                                    <div className="mt-1 hidden sm:flex flex-col gap-0.5 overflow-hidden">
                                        {cellEvents.slice(0, maxVisible).map((ev) => (
                                            <span
                                                key={ev.id}
                                                className={`px-2 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 ${eventPillClass(ev.type)}`}
                                            >
                                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${eventDotClass(ev.type)}`} />
                                                {ev.name}
                                            </span>
                                        ))}
                                        {overflow > 0 && (
                                            <span className="text-[10px] text-neutral-500 pl-1">
                                                {t("moreEvents", { count: overflow })}
                                            </span>
                                        )}
                                    </div>

                                    {/* Mobile: just dots */}
                                    <div className="mt-1 flex sm:hidden gap-0.5 flex-wrap">
                                        {cellEvents.slice(0, 5).map((ev) => (
                                            <span
                                                key={ev.id}
                                                className={`h-1.5 w-1.5 rounded-full ${eventDotClass(ev.type)}`}
                                            />
                                        ))}
                                        {cellEvents.length > 5 && (
                                            <span className="text-[8px] text-neutral-500">+</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Detail panel */}
                {selectedDate && (
                    <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 sm:p-6">
                        <h3 className="mb-4 text-sm font-semibold text-neutral-300">
                            {selectedDate.toLocaleDateString("default", {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </h3>

                        {selectedDayEvents.length === 0 ? (
                            <p className="text-sm text-neutral-500 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {t("noEvents")}
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {selectedDayEvents.map((ev) => {
                                    const badge = eventTypeBadge(ev.type);
                                    return (
                                        <a
                                            key={ev.id}
                                            href={ev.link}
                                            className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900 p-3 transition hover:border-neutral-700 hover:bg-neutral-800/60"
                                        >
                                            <span className="shrink-0">{eventIcon(ev.type)}</span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-neutral-200 truncate">
                                                    {ev.name}
                                                </p>
                                                <p className="text-xs text-neutral-500">
                                                    {new Date(ev.date).toLocaleDateString("default", {
                                                        year: "numeric",
                                                        month: "long",
                                                        day: "numeric",
                                                    })}
                                                </p>
                                            </div>
                                            <span
                                                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                                            >
                                                {badge.label}
                                            </span>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
