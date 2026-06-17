"use client";

import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    SparklesIcon, FileTextIcon, BuildingIcon, Loader2, DownloadIcon,
    MailIcon, BriefcaseIcon, AwardIcon,
} from "lucide-react";

const LETTER_TYPES = [
    { value: "motivation", label: "Motivation Letter", icon: SparklesIcon, desc: "For university program applications" },
    { value: "scholarship", label: "Scholarship Letter", icon: AwardIcon, desc: "For funding and scholarship programs" },
    { value: "cover", label: "Cover Letter", icon: BriefcaseIcon, desc: "For internships and research positions" },
];

export default function CoverLetterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [letterType, setLetterType] = useState("motivation");
    const [targetOrg, setTargetOrg] = useState("");
    const [programOrRole, setProgramOrRole] = useState("");
    const [wordLimit, setWordLimit] = useState("");
    const [keyPoints, setKeyPoints] = useState("");
    const [generatedLetter, setGeneratedLetter] = useState("");

    const printRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Cover_Letter_${targetOrg.split(" ")[0] || "Letter"}`,
    });

    async function handleGenerate() {
        if (!targetOrg.trim() || !programOrRole.trim()) {
            toast.error("Missing fields", {
                description: "Please enter the target organization and program / role.",
            });
            return;
        }

        setIsLoading(true);
        setGeneratedLetter("");

        try {
            const res = await fetch("/api/cover-letter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetOrg: targetOrg.trim(),
                    programOrRole: programOrRole.trim(),
                    letterType,
                    wordLimit: wordLimit.trim() || null,
                    keyPoints: keyPoints.trim() || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setGeneratedLetter(data.letter);
            toast.success("Letter generated successfully!");
        } catch (error: any) {
            toast.error("Generation Failed", {
                description: error.message || "There was a problem generating the letter.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const selectedType = LETTER_TYPES.find((t) => t.value === letterType)!;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-orange-200 to-violet-400">
                    AI Cover Letter
                </h2>
                <p className="text-neutral-400 text-lg">
                    Generate a personalized motivation, scholarship, or cover letter from your profile.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Input ── */}
                <Card className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50" />
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                            <MailIcon className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl text-neutral-200">Letter Parameters</CardTitle>
                            <CardDescription className="text-neutral-400">
                                Customize your letter — the AI fills in your profile details.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Letter Type Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">Letter Type</label>
                            <div className="grid grid-cols-3 gap-2">
                                {LETTER_TYPES.map((t) => {
                                    const Icon = t.icon;
                                    const active = letterType === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            onClick={() => setLetterType(t.value)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                                                active
                                                    ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                                                    : "border-neutral-800 bg-neutral-950/30 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                            }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {t.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-neutral-500">{selectedType.desc}</p>
                        </div>

                        {/* Target Organization */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                                <BuildingIcon className="w-4 h-4 text-neutral-500" />
                                Target University / Organization
                            </label>
                            <Input
                                placeholder="e.g. University of Bologna"
                                className="bg-neutral-950/50 border-neutral-800 text-neutral-200"
                                value={targetOrg}
                                onChange={(e) => setTargetOrg(e.target.value)}
                            />
                        </div>

                        {/* Program or Role */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                                Program / Scholarship / Role
                            </label>
                            <Input
                                placeholder="e.g. MSc Computer Science, Erasmus+ Scholarship"
                                className="bg-neutral-950/50 border-neutral-800 text-neutral-200"
                                value={programOrRole}
                                onChange={(e) => setProgramOrRole(e.target.value)}
                            />
                        </div>

                        {/* Word Limit */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-300">
                                Word Limit{" "}
                                <span className="text-neutral-500 font-normal">(optional)</span>
                            </label>
                            <Input
                                type="number"
                                placeholder="e.g. 500"
                                className="bg-neutral-950/50 border-neutral-800 text-neutral-200"
                                value={wordLimit}
                                onChange={(e) => setWordLimit(e.target.value)}
                            />
                        </div>

                        {/* Key Points */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-orange-300 flex justify-between">
                                <span>Key Points to Emphasize</span>
                                <SparklesIcon className="w-4 h-4" />
                            </label>
                            <Textarea
                                placeholder="e.g. Highlight my research experience in AI, passion for sustainable development..."
                                className="bg-neutral-950/50 border-orange-900/50 text-neutral-200 min-h-[90px] resize-none"
                                value={keyPoints}
                                onChange={(e) => setKeyPoints(e.target.value)}
                            />
                            <p className="text-xs text-neutral-500">
                                The AI will strongly weave these points into your profile context.
                            </p>
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20 h-12 text-md transition-all"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Writing your letter...
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="mr-2 h-5 w-5" />
                                    Generate {selectedType.label}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* ── Output ── */}
                <Card className="bg-neutral-900/20 border-border/30 backdrop-blur-sm flex flex-col relative overflow-hidden min-h-[500px]">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <MailIcon className="w-48 h-48" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-xl text-neutral-200">Generated Letter</CardTitle>
                            <CardDescription className="text-neutral-400">
                                Your personalized letter will appear here.
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="border-orange-500/30 text-orange-300 hover:bg-orange-500/10 hover:text-orange-200 relative z-10"
                            onClick={handleDownloadPDF}
                            disabled={!generatedLetter || isLoading}
                        >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col relative z-10">
                        {generatedLetter ? (
                            <Textarea
                                readOnly
                                value={generatedLetter}
                                className="flex-1 bg-neutral-950/30 border-neutral-800/50 text-neutral-200 p-6 leading-relaxed focus-visible:ring-0 min-h-[400px] resize-none text-sm"
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-950/20">
                                <div className="flex flex-col items-center gap-4 text-neutral-500">
                                    <MailIcon className="w-12 h-12 opacity-20" />
                                    <p>Ready to write your letter.</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hidden printable */}
                <div ref={printRef} className="hidden print:block">
                    <div className="p-12 bg-white text-black min-h-[297mm] w-[210mm] mx-auto font-serif">
                        <div className="space-y-4 text-justify leading-relaxed text-[12pt]">
                            {generatedLetter.split("\n").map((para, i) =>
                                para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
