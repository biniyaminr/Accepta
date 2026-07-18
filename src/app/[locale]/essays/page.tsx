"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SparklesIcon, FileTextIcon, BuildingIcon, Loader2, DownloadIcon } from "lucide-react";

export default function EssaysPage() {
    const t = useTranslations("Essays");
    const [isLoading, setIsLoading] = useState(false);
    const [targetUniversity, setTargetUniversity] = useState("");
    const [essayPrompt, setEssayPrompt] = useState("");
    const [keyNarrative, setKeyNarrative] = useState("");
    const [generatedDraft, setGeneratedDraft] = useState("");

    const printRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Statement_of_Purpose_${targetUniversity.split(" ")[0] || "University"}`,
    });

    async function handleGenerate() {
        if (!targetUniversity.trim() || !essayPrompt.trim()) {
            toast.error("Missing fields", {
                description: "Please enter both the target university and the essay prompt.",
            });
            return;
        }

        setIsLoading(true);
        setGeneratedDraft("");

        try {
            const finalNarrative = keyNarrative.trim() === "" ? undefined : keyNarrative.trim();

            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUniversity, essayPrompt, keyNarrative: finalNarrative }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to generate draft");
            }

            setGeneratedDraft(data.draft);
            toast.success("Draft generated successfully!");
        } catch (error: any) {
            console.error("Generation error:", error);
            toast.error("Generation Failed", {
                description: error.message || "There was a problem generating the essay.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">{t("pageTitle")}</h2>
                <p className="text-neutral-400 text-lg">{t("pageSubtitle")}</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Input Column */}
                <div className="space-y-6">
                    <Card className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl relative overflow-hidden h-full">
                        <div className="absolute top-0 left-0 w-1 h-full bg-violet-500/50" />
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="p-3 bg-violet-500/10 rounded-xl">
                                <FileTextIcon className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-neutral-200">{t("essayParameters")}</CardTitle>
                                <CardDescription className="text-neutral-400">{t("essayParametersDesc")}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                                    <BuildingIcon className="w-4 h-4 text-neutral-500" />
                                    {t("targetUniversityProgram")}
                                </label>
                                <Input
                                    placeholder="e.g. University of Cassino (Economics)"
                                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-violet-500/20"
                                    value={targetUniversity}
                                    onChange={(e) => setTargetUniversity(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">{t("statementOfPurpose")}</label>
                                <Textarea
                                    placeholder="e.g. Write a 500-word Statement of Purpose for this economics program."
                                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 focus:ring-violet-500/20 min-h-[100px] resize-none"
                                    value={essayPrompt}
                                    onChange={(e) => setEssayPrompt(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-violet-300 flex justify-between">
                                    <span>{t("keyNarrativeAngle")}</span>
                                    <SparklesIcon className="w-4 h-4" />
                                </label>
                                <Textarea
                                    placeholder="e.g. Emphasize how my experience at Teleperformance and Majorel gave me an 'operational risk' perspective..."
                                    className="bg-neutral-950/50 border-violet-900/50 text-neutral-200 focus:ring-violet-500/50 min-h-[100px] resize-none"
                                    value={keyNarrative}
                                    onChange={(e) => setKeyNarrative(e.target.value)}
                                />
                                <p className="text-xs text-neutral-500">{t("keyNarrativeHint")}</p>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-900/20 transition-all h-12 text-md"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {t("generating")}
                                    </>
                                ) : (
                                    <>
                                        <SparklesIcon className="mr-2 h-5 w-5" />
                                        {t("generateDraft")}
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Output Column */}
                <div className="space-y-6">
                    <Card className="bg-neutral-900/20 border-border/30 backdrop-blur-sm h-full flex flex-col relative overflow-hidden min-h-[500px]">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <SparklesIcon className="w-48 h-48" />
                        </div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-xl text-neutral-200">{t("generatedDraft")}</CardTitle>
                                <CardDescription className="text-neutral-400">{t("generatedDraftDesc")}</CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="relative z-10 border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 cursor-pointer"
                                onClick={handleDownloadPDF}
                                disabled={!generatedDraft || isLoading}
                            >
                                <DownloadIcon className="w-4 h-4 mr-2 pointer-events-none" />
                                {t("exportPdf")}
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col relative z-10">
                            {generatedDraft ? (
                                <Textarea
                                    readOnly
                                    value={generatedDraft}
                                    className="flex-1 bg-neutral-950/30 border-neutral-800/50 text-neutral-200 p-6 leading-relaxed focus-visible:ring-0 min-h-[400px] resize-none text-md"
                                />
                            ) : (
                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-950/20">
                                    <div className="flex flex-col items-center gap-4 text-neutral-500">
                                        <FileTextIcon className="w-12 h-12 opacity-20" />
                                        <p>{t("readyToGenerate")}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Hidden Printable A4 Container */}
                    <div ref={printRef} className="hidden print:block">
                        <div className="p-12 bg-white text-black min-h-[297mm] w-[210mm] mx-auto font-serif">
                            <h1 className="text-2xl font-bold mb-6 text-center border-b pb-4">Statement of Purpose</h1>
                            <div className="space-y-4 text-justify leading-relaxed text-[12pt]">
                                {generatedDraft.split('\n').map((paragraph, index) => (
                                    paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
