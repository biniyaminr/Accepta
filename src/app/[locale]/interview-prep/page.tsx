"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    MessageSquare,
    Brain,
    Target,
    ChevronDown,
    ChevronUp,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RotateCw,
    Sparkles,
} from "lucide-react";

type QuestionCategory =
    | "motivation"
    | "academic"
    | "experience"
    | "situational"
    | "technical";

interface InterviewQuestion {
    id: number;
    question: string;
    category: QuestionCategory;
    tip: string;
}

interface EvaluationResult {
    score: number;
    feedback: string;
    improvedAnswer: string;
    strengths: string;
    weaknesses: string;
}

const categoryColors: Record<QuestionCategory, string> = {
    motivation:
        "bg-violet-500/20 text-violet-300 border-violet-500/30",
    academic:
        "bg-blue-500/20 text-blue-300 border-blue-500/30",
    experience:
        "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    situational:
        "bg-amber-500/20 text-amber-300 border-amber-500/30",
    technical:
        "bg-rose-500/20 text-rose-300 border-rose-500/30",
};

const scoreBgColor = (score: number) => {
    if (score >= 8) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/50";
    if (score >= 5) return "bg-amber-500/20 text-amber-300 border-amber-500/50";
    return "bg-rose-500/20 text-rose-300 border-rose-500/50";
};

export default function InterviewPrepPage() {
    const t = useTranslations("InterviewPrep");

    const [universityName, setUniversityName] = useState("");
    const [programName, setProgramName] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);

    const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [evaluations, setEvaluations] = useState<Record<number, EvaluationResult>>({});
    const [evaluatingId, setEvaluatingId] = useState<number | null>(null);
    const [expandedTips, setExpandedTips] = useState<Record<number, boolean>>({});

    async function handleGenerate() {
        if (!universityName.trim() || !programName.trim()) {
            toast.error(t("fillBothFields"));
            return;
        }

        setIsGenerating(true);
        setQuestions([]);
        setAnswers({});
        setEvaluations({});
        setActiveQuestionId(null);
        setExpandedTips({});

        try {
            const res = await fetch("/api/interview-prep", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    universityName: universityName.trim(),
                    programName: programName.trim(),
                    mode: "generate",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate questions");
            }

            setQuestions(data.questions);
            toast.success("Questions generated!");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to generate questions.";
            toast.error(message);
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleEvaluate(questionId: number) {
        const q = questions.find((q) => q.id === questionId);
        const userAnswer = answers[questionId];

        if (!q || !userAnswer?.trim()) {
            toast.error("Please write an answer before submitting.");
            return;
        }

        setEvaluatingId(questionId);

        try {
            const res = await fetch("/api/interview-prep", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    universityName: universityName.trim(),
                    programName: programName.trim(),
                    mode: "evaluate",
                    question: q.question,
                    answer: userAnswer.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to evaluate answer");
            }

            setEvaluations((prev) => ({ ...prev, [questionId]: data }));
            toast.success("Answer evaluated!");
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : "Failed to evaluate answer.";
            toast.error(message);
        } finally {
            setEvaluatingId(null);
        }
    }

    function handlePracticeAgain() {
        setQuestions([]);
        setAnswers({});
        setEvaluations({});
        setActiveQuestionId(null);
        setExpandedTips({});
    }

    const answeredCount = Object.keys(evaluations).length;
    const totalQuestions = questions.length;
    const averageScore =
        answeredCount > 0
            ? Math.round(
                  Object.values(evaluations).reduce((sum, e) => sum + e.score, 0) /
                      answeredCount
              )
            : 0;

    const categoryBreakdown = questions.reduce(
        (acc, q) => {
            acc[q.category] = (acc[q.category] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-200 to-indigo-400">
                    {t("pageTitle")}
                </h2>
                <p className="text-neutral-400 text-lg">{t("pageSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Panel: Setup */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/50" />
                        <CardHeader className="flex flex-row items-center gap-3 pb-3">
                            <div className="p-2.5 bg-violet-500/10 rounded-xl">
                                <Brain className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <CardTitle className="text-lg text-neutral-200">
                                    Setup
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">
                                    {t("universityName")}
                                </label>
                                <Input
                                    placeholder="e.g. MIT"
                                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-violet-500/20"
                                    value={universityName}
                                    onChange={(e) => setUniversityName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">
                                    {t("programName")}
                                </label>
                                <Input
                                    placeholder="e.g. Computer Science MSc"
                                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-violet-500/20"
                                    value={programName}
                                    onChange={(e) => setProgramName(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20 transition-all h-11"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {t("generating")}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        {t("generateQuestions")}
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Area: Interview Session */}
                <div className="lg:col-span-6 space-y-4">
                    {questions.length === 0 && !isGenerating ? (
                        <Card className="bg-neutral-900/20 border-border/30 backdrop-blur-sm min-h-[400px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4 text-neutral-500">
                                <MessageSquare className="w-12 h-12 opacity-20" />
                                <p className="text-center max-w-xs">
                                    {t("noQuestions")}
                                </p>
                            </div>
                        </Card>
                    ) : isGenerating ? (
                        <Card className="bg-neutral-900/20 border-border/30 backdrop-blur-sm min-h-[400px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-4 text-neutral-400">
                                <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                                <p>{t("generating")}</p>
                            </div>
                        </Card>
                    ) : (
                        <>
                            {/* Progress bar */}
                            <div className="flex items-center gap-3 px-1">
                                <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-sm text-neutral-400 whitespace-nowrap">
                                    {answeredCount}/{totalQuestions} {t("questionsAnswered").toLowerCase()}
                                </span>
                            </div>

                            {/* Question Cards */}
                            {questions.map((q) => {
                                const isActive = activeQuestionId === q.id;
                                const evaluation = evaluations[q.id];
                                const isEvaluating = evaluatingId === q.id;
                                const tipExpanded = expandedTips[q.id] || false;

                                return (
                                    <Card
                                        key={q.id}
                                        className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-lg relative overflow-hidden transition-all duration-200"
                                    >
                                        <CardHeader
                                            className="cursor-pointer"
                                            onClick={() =>
                                                setActiveQuestionId(
                                                    isActive ? null : q.id
                                                )
                                            }
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-neutral-800 text-neutral-300 text-sm font-semibold shrink-0 mt-0.5">
                                                    {q.id}
                                                </span>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                categoryColors[
                                                                    q.category
                                                                ]
                                                            }
                                                        >
                                                            {t(q.category)}
                                                        </Badge>
                                                        {evaluation && (
                                                            <Badge
                                                                variant="outline"
                                                                className={scoreBgColor(
                                                                    evaluation.score
                                                                )}
                                                            >
                                                                {t("score")}:{" "}
                                                                {evaluation.score}/10
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-neutral-200 font-medium leading-relaxed">
                                                        {q.question}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-neutral-500">
                                                    {isActive ? (
                                                        <ChevronUp className="w-5 h-5" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5" />
                                                    )}
                                                </div>
                                            </div>
                                        </CardHeader>

                                        {isActive && (
                                            <CardContent className="space-y-4 pt-0">
                                                {/* Collapsible Tip */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedTips((prev) => ({
                                                            ...prev,
                                                            [q.id]: !prev[q.id],
                                                        }));
                                                    }}
                                                    className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                                                >
                                                    <Target className="w-3.5 h-3.5" />
                                                    {t("tip")}
                                                    {tipExpanded ? (
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                                {tipExpanded && (
                                                    <p className="text-sm text-neutral-400 bg-violet-500/5 border border-violet-500/10 rounded-lg px-3 py-2">
                                                        {q.tip}
                                                    </p>
                                                )}

                                                {/* Answer Textarea */}
                                                <Textarea
                                                    placeholder={t("yourAnswer")}
                                                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-violet-500/20 min-h-[120px] resize-none"
                                                    value={answers[q.id] || ""}
                                                    onChange={(e) =>
                                                        setAnswers((prev) => ({
                                                            ...prev,
                                                            [q.id]: e.target.value,
                                                        }))
                                                    }
                                                />

                                                <Button
                                                    onClick={() => handleEvaluate(q.id)}
                                                    disabled={
                                                        isEvaluating ||
                                                        !answers[q.id]?.trim()
                                                    }
                                                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20"
                                                >
                                                    {isEvaluating ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            {t("evaluating")}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                            {t("submitAnswer")}
                                                        </>
                                                    )}
                                                </Button>

                                                {/* Evaluation Results */}
                                                {evaluation && (
                                                    <div className="space-y-3 pt-2">
                                                        {/* Score */}
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 font-bold text-lg ${scoreBgColor(evaluation.score)}`}
                                                            >
                                                                {evaluation.score}
                                                            </div>
                                                            <p className="text-neutral-300 text-sm flex-1">
                                                                {evaluation.feedback}
                                                            </p>
                                                        </div>

                                                        {/* Strengths */}
                                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-1">
                                                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                {t("strengths")}
                                                            </div>
                                                            <p className="text-neutral-300 text-sm">
                                                                {evaluation.strengths}
                                                            </p>
                                                        </div>

                                                        {/* Weaknesses */}
                                                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-1">
                                                            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                                                                <AlertCircle className="w-4 h-4" />
                                                                {t("weaknesses")}
                                                            </div>
                                                            <p className="text-neutral-300 text-sm">
                                                                {evaluation.weaknesses}
                                                            </p>
                                                        </div>

                                                        {/* Improved Answer */}
                                                        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 space-y-1">
                                                            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                                                                <Sparkles className="w-4 h-4" />
                                                                {t("improvedAnswer")}
                                                            </div>
                                                            <p className="text-neutral-300 text-sm leading-relaxed">
                                                                {evaluation.improvedAnswer}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        )}
                                    </Card>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* Right Panel: Session Stats */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg text-neutral-200">
                                {t("sessionStats")}
                            </CardTitle>
                            <CardDescription className="text-neutral-500">
                                {t("questionsAnswered")}: {answeredCount}/{totalQuestions}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Average Score */}
                            <div className="space-y-2">
                                <p className="text-sm text-neutral-400 font-medium">
                                    {t("averageScore")}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex items-center justify-center w-14 h-14 rounded-full border-2 font-bold text-xl ${
                                            answeredCount > 0
                                                ? scoreBgColor(averageScore)
                                                : "bg-neutral-800/50 text-neutral-500 border-neutral-700"
                                        }`}
                                    >
                                        {answeredCount > 0 ? averageScore : "-"}
                                    </div>
                                    <span className="text-neutral-400 text-sm">/ 10</span>
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            {questions.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm text-neutral-400 font-medium">
                                        {t("categoryBreakdown")}
                                    </p>
                                    <div className="space-y-2">
                                        {Object.entries(categoryBreakdown).map(
                                            ([cat, count]) => (
                                                <div
                                                    key={cat}
                                                    className="flex items-center justify-between"
                                                >
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            categoryColors[
                                                                cat as QuestionCategory
                                                            ]
                                                        }
                                                    >
                                                        {t(cat as QuestionCategory)}
                                                    </Badge>
                                                    <span className="text-neutral-400 text-sm">
                                                        {count}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Practice Again */}
                            {questions.length > 0 && (
                                <Button
                                    onClick={handlePracticeAgain}
                                    variant="outline"
                                    className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-800/50 hover:text-white"
                                >
                                    <RotateCw className="mr-2 h-4 w-4" />
                                    {t("practiceAgain")}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
