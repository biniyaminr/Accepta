"use client";

import { useState, useEffect } from "react";
import { Building2, GraduationCap, Calendar, ListChecks, Search, Loader2, Sparkles, Clock, ArrowRight, BookmarkIcon, BookmarkCheckIcon } from "lucide-react";
import { EnglishTestPromo } from "@/components/landing/EnglishTestPromo";

import { useAppStore } from "@/store/useAppStore";
import { useHasHydrated } from "@/hooks/useHasHydrated";

export default function DiscoverPage() {
    const {
        url, setUrl,
        programData, setProgramData,
        searchHistory, setSearchHistory,
        fitData, setFitData,
        resetDiscover
    } = useAppStore();

    const hasHydrated = useHasHydrated();
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Rate-limit countdown state
    const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

    // Auto-retry countdown timer
    useEffect(() => {
        if (retryCountdown === null) return;
        if (retryCountdown === 0) {
            setRetryCountdown(null);
            // Auto-resubmit — create a synthetic form event
            handleScan({ preventDefault: () => { } } as React.FormEvent);
            return;
        }
        const timer = setInterval(() => {
            setRetryCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
        }, 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retryCountdown]);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;

        setIsLoading(true);
        setError(null);
        setProgramData(null);
        setFitData(null); // Reset fit evaluation

        try {
            const res = await fetch("/api/discover/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();

            // Intercept rate-limit before generic error
            if (res.status === 429) {
                setRetryCountdown(60);
                return;
            }

            if (!res.ok) {
                throw new Error(data.error || "Failed to scan URL.");
            }

            setProgramData(data.data);
            setIsSaved(false); // Reset saved status on new scan

            // Update History (Zustand persists this automatically)
            const newHistoryItem = { url, data: data.data };
            const updatedHistory = [newHistoryItem, ...searchHistory.filter((item) => item.url !== url)].slice(0, 10);
            setSearchHistory(updatedHistory);

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred while scanning.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadFromHistory = (item: { url: string; data: Record<string, unknown> }) => {
        setUrl(item.url);
        setProgramData(item.data);
        setFitData(null);
        setError(null);
    };

    const handleEvaluateFit = async () => {
        if (!programData) return;

        setIsEvaluating(true);
        setError(null);

        try {
            // Fetch real user profile from database
            const profileRes = await fetch("/api/profile");
            const dbData = await profileRes.json();

            let userProfile = null;

            if (profileRes.ok && dbData && !dbData.message && !dbData.error) {
                const edu = dbData.educations && dbData.educations.length > 0 ? dbData.educations[0] : {};
                userProfile = {
                    name: dbData.fullName,
                    major: edu.major || "Unknown / Undeclared",
                    gpa: edu.gpa ? edu.gpa.toString() : "Unknown",
                    citizenship: dbData.citizenship || "Unknown",
                    institutionName: edu.institutionName || "Unknown",
                    languages: "See uploaded documents (feature pending)"
                };
            }

            if (!userProfile) {
                console.warn("No user profile found. Using fallback mock data.");
                userProfile = {
                    name: "Fallback Profile",
                    major: "Telecommunications Engineering",
                    gpa: "3.8",
                    skills: "Networking, Programming, Hardware design",
                    languages: "English (C1), Italian (B2), Amharic (Native)"
                };
            }

            const res = await fetch("/api/discover/evaluate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ programData, userProfile }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to evaluate fit.");
            }

            setFitData(data.data);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unexpected error occurred during evaluation.");
            }
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleSaveApplication = async () => {
        if (!programData) return;

        setIsSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    universityName: programData.universityName,
                    programName: programData.programName,
                    url: url,
                    deadline: programData.deadline,
                    matchScore: fitData?.matchScore || null
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to save application");
            }

            setIsSaved(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred while saving.";
            setError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (!hasHydrated) {
        return (
            <div className="flex-1 flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8 lg:flex-row">

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 w-full">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight text-neutral-100">Discover Programs</h2>
                </div>

                {/* Search Bar Section */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm">
                    <h3 className="mb-4 text-lg font-medium text-neutral-200">AI Program Scraper</h3>
                    <p className="mb-6 text-sm text-neutral-400">
                        Paste a link to any university program page. AssistedApp will scan the page and instantly extract the key admission requirements.
                    </p>

                    <form onSubmit={handleScan} className="flex flex-col gap-4 sm:flex-row">
                        <div className="relative flex-grow">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Search className="h-5 w-5 text-neutral-500" />
                            </div>
                            <input
                                type="url"
                                placeholder="https://www.example-university.edu/admissions/cs-masters..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={retryCountdown !== null}
                                className="block w-full rounded-lg border border-neutral-700 bg-neutral-800 p-4 pl-12 text-sm text-white placeholder-neutral-500 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !url || retryCountdown !== null}
                            className="flex h-14 min-w-[160px] items-center justify-center rounded-lg bg-green-600 px-6 py-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Analyzing...
                                </>
                            ) : (
                                "Scan with AI"
                            )}
                        </button>
                    </form>

                    {retryCountdown !== null ? (
                        <div className="mt-4 flex items-center gap-3 rounded-lg border border-amber-700/50 bg-amber-900/20 p-4 text-sm">
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-amber-400" />
                            <p className="text-amber-200">
                                ⏳ AI cooling down to prevent overload.{" "}
                                <span className="font-semibold text-amber-100">
                                    Auto-retrying in {retryCountdown}s...
                                </span>
                            </p>
                        </div>
                    ) : error ? (
                        <div className="mt-4 rounded-md bg-red-900/30 p-4 text-sm text-red-200 border border-red-800/50">
                            {error}
                        </div>
                    ) : null}
                </div>

                {/* Results Section */}
                {programData && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
                        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl">

                            {/* Header Details */}
                            <div className="border-b border-neutral-800 bg-neutral-800/30 p-8">
                                <div className="flex flex-col gap-4">
                                    {/* Row 1: Titles */}
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3 text-green-400">
                                            <Building2 className="h-6 w-6 shrink-0" />
                                            <h3 className="text-xl font-bold uppercase tracking-wider leading-snug">{String(programData.universityName || 'Unknown University')}</h3>
                                        </div>
                                        <h4 className="flex items-start gap-3 text-3xl font-bold text-white">
                                            <GraduationCap className="h-8 w-8 shrink-0 text-neutral-500 mt-1" />
                                            <span className="leading-tight">{String(programData.programName || 'Unknown Program')}</span>
                                        </h4>
                                    </div>

                                    {/* Row 2: Actions & Meta */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
                                        <div className="flex items-center justify-center gap-2 rounded-full border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-300 max-w-full">
                                            <Calendar className="h-4 w-4 shrink-0 text-blue-400" />
                                            <span className="shrink-0">Deadline:</span>
                                            <span className="text-white truncate whitespace-normal text-left">{String(programData.deadline || 'Unknown')}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={handleSaveApplication}
                                                disabled={isSaving || isSaved}
                                                className={`shrink-0 flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)] disabled:opacity-50
                                                    ${isSaved
                                                        ? 'border-emerald-500/50 bg-emerald-900/20 text-emerald-400 cursor-not-allowed'
                                                        : 'border-neutral-500/50 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'
                                                    }`}
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : isSaved ? (
                                                    <BookmarkCheckIcon className="h-4 w-4" />
                                                ) : (
                                                    <BookmarkIcon className="h-4 w-4" />
                                                )}
                                                {isSaved ? "Saved to Tracker" : "Save to Tracker"}
                                            </button>

                                            <button
                                                onClick={handleEvaluateFit}
                                                disabled={isEvaluating}
                                                className="shrink-0 flex items-center justify-center gap-2 rounded-full border border-blue-500/50 bg-blue-900/20 px-5 py-2 text-sm font-medium text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all hover:bg-blue-900/40 hover:text-blue-300 disabled:opacity-50"
                                            >
                                                {isEvaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                                Evaluate My Fit
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <p className="max-w-3xl text-lg text-neutral-400 leading-relaxed mt-6">
                                    {String(programData.summary || 'No summary available.')}
                                </p>
                            </div>

                            {/* Evaluation Score Display */}
                            {fitData && (
                                <div className={`border-b border-neutral-800 p-6 ${fitData.matchScore >= 80 ? 'bg-green-950/20' :
                                    fitData.matchScore >= 50 ? 'bg-yellow-950/20' : 'bg-red-950/20'
                                    }`}>
                                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                                        <div className="flex flex-col items-center justify-center rounded-2xl bg-neutral-900 p-6 shadow-inner ring-1 ring-white/5">
                                            <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1">Match Score</span>
                                            <span className={`text-5xl font-black tracking-tighter ${fitData.matchScore >= 80 ? 'text-green-500' :
                                                fitData.matchScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                                                }`}>
                                                {fitData.matchScore}%
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h5 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                                                <Sparkles className="h-5 w-5 text-blue-400" /> AI Advisor Verdict
                                            </h5>
                                            <p className="text-neutral-300 leading-relaxed">
                                                {fitData.reasoning}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Requirements Checklist */}
                            <div className="p-8">
                                <h5 className="mb-6 flex items-center gap-2 text-lg font-semibold text-white">
                                    <ListChecks className="h-5 w-5 text-green-500" />
                                    Admission Requirements
                                </h5>

                                {programData.requirements && Array.isArray(programData.requirements) && programData.requirements.length > 0 ? (
                                    <ul className="grid gap-4 sm:grid-cols-2">
                                        {programData.requirements.map((req: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 rounded-lg border border-neutral-800/50 bg-neutral-800/20 p-4">
                                                <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-900/40 text-green-500">
                                                    ✓
                                                </div>
                                                <span className="text-neutral-300">{req}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-neutral-500 italic">No specific requirements could be extracted.</p>
                                )}
                            </div>

                        </div>
                    </div>
                )}

                {/* English Proficiency Resources - Moved to bottom */}
                <div className="mt-12 border-t border-neutral-800/50 pt-12">
                    <EnglishTestPromo />
                </div>
            </div>

            {/* Sidebar History Area */}
            {searchHistory.length > 0 && (
                <div className="w-full lg:w-80 shrink-0 mt-14">
                    <div className="sticky top-6 rounded-xl border border-neutral-800 bg-neutral-900/30 p-5">
                        <div className="mb-4 flex items-center gap-2 text-neutral-300">
                            <Clock className="h-5 w-5 text-blue-400" />
                            <h3 className="font-semibold tracking-wide">Recent Scans</h3>
                        </div>

                        <div className="flex flex-col gap-3">
                            {searchHistory.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => loadFromHistory(item)}
                                    className="group flex flex-col items-start gap-1 rounded-lg border border-neutral-800/50 bg-neutral-800/30 p-3 text-left transition-all hover:bg-neutral-800 hover:border-neutral-700"
                                >
                                    <span className="w-full truncate font-medium text-neutral-200 group-hover:text-white">
                                        {String(item.data?.programName || 'Unknown Program')}
                                    </span>
                                    <span className="flex w-full items-center justify-between text-xs text-neutral-500">
                                        <span className="truncate pr-2">{String(item.data?.universityName || 'Unknown Univ')}</span>
                                        <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 text-green-500" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
