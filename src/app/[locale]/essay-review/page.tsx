"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
    FileSearch,
    CheckCircle2,
    AlertCircle,
    Lightbulb,
    Copy,
    Loader2,
    Sparkles,
    BarChart3,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

interface ReviewResult {
    overallScore: number;
    grammar: { score: number; issues: string[] };
    structure: { score: number; feedback: string };
    tone: { score: number; feedback: string };
    content: { score: number; feedback: string };
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    revisedVersion?: string;
}

function getScoreColor(score: number) {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
}

function getBarColor(score: number) {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
}

function getRingColor(score: number) {
    if (score >= 80) return "stroke-green-500";
    if (score >= 50) return "stroke-amber-500";
    return "stroke-red-500";
}

export default function EssayReviewPage() {
    const t = useTranslations("EssayReview");

    const [essay, setEssay] = useState("");
    const [essayType, setEssayType] = useState("");
    const [targetProgram, setTargetProgram] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [review, setReview] = useState<ReviewResult | null>(null);
    const [showRevised, setShowRevised] = useState(false);

    const wordCount = essay.trim() === "" ? 0 : essay.trim().split(/\s+/).length;

    async function handleReview() {
        if (!essay.trim()) {
            toast.error(t("noEssay"));
            return;
        }
        if (wordCount < 50) {
            toast.error(t("tooShort"));
            return;
        }

        setIsLoading(true);
        setReview(null);
        setShowRevised(false);

        try {
            const res = await fetch("/api/essay-review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    essay,
                    essayType: essayType || undefined,
                    targetProgram: targetProgram || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to review essay");
            }

            setReview(data.review);
        } catch (error: any) {
            console.error("Review error:", error);
            toast.error(error.message || "Failed to review essay. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleCopy(text: string) {
        navigator.clipboard.writeText(text);
        toast.success(t("copied"));
    }

    const categories = review
        ? [
              { label: t("grammar"), score: review.grammar.score },
              { label: t("structure"), score: review.structure.score },
              { label: t("tone"), score: review.tone.score },
              { label: t("content"), score: review.content.score },
          ]
        : [];

    // SVG circle score ring
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const scoreOffset = review
        ? circumference - (review.overallScore / 100) * circumference
        : circumference;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-indigo-400">
                    {t("pageTitle")}
                </h2>
                <p className="text-neutral-400 text-lg">{t("pageSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Input */}
                <div className="space-y-6">
                    <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6 space-y-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/50" />

                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-violet-500/10 rounded-xl">
                                <FileSearch className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-neutral-200">
                                    {t("pageTitle")}
                                </h3>
                                <p className="text-sm text-neutral-400">{t("pageSubtitle")}</p>
                            </div>
                        </div>

                        {/* Essay textarea */}
                        <div className="space-y-2">
                            <textarea
                                rows={12}
                                placeholder={t("essayPlaceholder")}
                                value={essay}
                                onChange={(e) => setEssay(e.target.value)}
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30 resize-none min-h-[250px]"
                            />
                            <p className="text-xs text-neutral-500">
                                {t("wordCount", { count: wordCount })}
                            </p>
                        </div>

                        {/* Essay type dropdown */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                                {t("essayType")}
                            </label>
                            <select
                                value={essayType}
                                onChange={(e) => setEssayType(e.target.value)}
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            >
                                <option value="">--</option>
                                <option value="Motivation Letter">{t("motivationLetter")}</option>
                                <option value="Personal Statement">{t("personalStatement")}</option>
                                <option value="Statement of Purpose">{t("statementOfPurpose")}</option>
                                <option value="Scholarship Essay">{t("scholarshipEssay")}</option>
                            </select>
                        </div>

                        {/* Target program */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                                {t("targetProgram")}
                            </label>
                            <input
                                type="text"
                                value={targetProgram}
                                onChange={(e) => setTargetProgram(e.target.value)}
                                placeholder="e.g. MSc Computer Science at ETH Zurich"
                                className="w-full bg-neutral-950/50 border border-neutral-800 rounded-lg p-3 text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                            />
                        </div>

                        {/* CTA Button */}
                        <button
                            onClick={handleReview}
                            disabled={isLoading}
                            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-900/20"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {t("reviewing")}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" />
                                    {t("reviewEssay")}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Column - Results */}
                <div className="space-y-6">
                    {!review && !isLoading && (
                        <div className="bg-neutral-900/20 border border-neutral-800 rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px]">
                            <BarChart3 className="w-16 h-16 text-neutral-700 mb-4" />
                            <p className="text-neutral-500 text-center">
                                {t("pageSubtitle")}
                            </p>
                        </div>
                    )}

                    {isLoading && (
                        <div className="bg-neutral-900/20 border border-neutral-800 rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px]">
                            <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-4" />
                            <p className="text-neutral-400">{t("reviewing")}</p>
                        </div>
                    )}

                    {review && (
                        <div className="space-y-5">
                            {/* Overall Score */}
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 flex items-center gap-6">
                                <div className="relative w-32 h-32 shrink-0">
                                    <svg
                                        className="w-32 h-32 -rotate-90"
                                        viewBox="0 0 120 120"
                                    >
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r={radius}
                                            fill="none"
                                            stroke="#262626"
                                            strokeWidth="8"
                                        />
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r={radius}
                                            fill="none"
                                            className={getRingColor(review.overallScore)}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={scoreOffset}
                                            style={{ transition: "stroke-dashoffset 1s ease-out" }}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span
                                            className={`text-2xl font-bold ${getScoreColor(review.overallScore)}`}
                                        >
                                            {review.overallScore}
                                        </span>
                                        <span className="text-xs text-neutral-500">/100</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-neutral-200">
                                        {t("overallScore")}
                                    </h3>
                                    <p className="text-sm text-neutral-400 mt-1">
                                        {review.content.feedback}
                                    </p>
                                </div>
                            </div>

                            {/* Category Scores */}
                            <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 space-y-4">
                                {categories.map((cat) => (
                                    <div key={cat.label} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-neutral-300">
                                                {cat.label}
                                            </span>
                                            <span
                                                className={`text-sm font-semibold ${getScoreColor(cat.score)}`}
                                            >
                                                {cat.score}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-neutral-800">
                                            <div
                                                className={`h-2 rounded-full ${getBarColor(cat.score)}`}
                                                style={{
                                                    width: `${cat.score}%`,
                                                    transition: "width 1s ease-out",
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Strengths */}
                            {review.strengths.length > 0 && (
                                <div className="bg-neutral-900/50 border border-green-900/30 rounded-xl p-4">
                                    <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2 mb-3">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {t("strengths")}
                                    </h4>
                                    <ul className="space-y-2">
                                        {review.strengths.map((s, i) => (
                                            <li
                                                key={i}
                                                className="text-sm text-neutral-300 flex items-start gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4 text-green-500/60 shrink-0 mt-0.5" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Weaknesses */}
                            {review.weaknesses.length > 0 && (
                                <div className="bg-neutral-900/50 border border-amber-900/30 rounded-xl p-4">
                                    <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3">
                                        <AlertCircle className="w-4 h-4" />
                                        {t("weaknesses")}
                                    </h4>
                                    <ul className="space-y-2">
                                        {review.weaknesses.map((w, i) => (
                                            <li
                                                key={i}
                                                className="text-sm text-neutral-300 flex items-start gap-2"
                                            >
                                                <AlertCircle className="w-4 h-4 text-amber-500/60 shrink-0 mt-0.5" />
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggestions */}
                            {review.suggestions.length > 0 && (
                                <div className="bg-neutral-900/50 border border-blue-900/30 rounded-xl p-4">
                                    <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-3">
                                        <Lightbulb className="w-4 h-4" />
                                        {t("suggestions")}
                                    </h4>
                                    <ul className="space-y-2">
                                        {review.suggestions.map((s, i) => (
                                            <li
                                                key={i}
                                                className="text-sm text-neutral-300 flex items-start gap-2"
                                            >
                                                <Lightbulb className="w-4 h-4 text-blue-500/60 shrink-0 mt-0.5" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Grammar Issues */}
                            {review.grammar.issues.length > 0 && (
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                                    <h4 className="text-sm font-semibold text-neutral-300 mb-3">
                                        {t("grammarIssues")}
                                    </h4>
                                    <ul className="space-y-2">
                                        {review.grammar.issues.map((issue, i) => (
                                            <li
                                                key={i}
                                                className="text-sm text-neutral-400 flex items-start gap-2"
                                            >
                                                <span className="text-red-400 shrink-0">-</span>
                                                {issue}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Revised Version */}
                            {review.revisedVersion && (
                                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setShowRevised(!showRevised)}
                                        className="w-full flex items-center justify-between p-4 text-sm font-semibold text-neutral-300 hover:bg-neutral-800/30 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-violet-400" />
                                            {showRevised
                                                ? t("hideRevised")
                                                : t("showRevised")}
                                        </span>
                                        {showRevised ? (
                                            <ChevronUp className="w-4 h-4" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4" />
                                        )}
                                    </button>
                                    {showRevised && (
                                        <div className="px-4 pb-4 space-y-3">
                                            <div className="bg-neutral-950/50 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                                                {review.revisedVersion}
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleCopy(review.revisedVersion || "")
                                                }
                                                className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                                            >
                                                <Copy className="w-4 h-4" />
                                                {t("copy")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
