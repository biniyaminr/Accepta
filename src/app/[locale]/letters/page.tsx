"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useReactToPrint } from "react-to-print";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    SparklesIcon, BuildingIcon, Loader2, DownloadIcon,
    MailIcon, BriefcaseIcon, AwardIcon, UserIcon,
    GraduationCapIcon, BookOpenIcon, CheckCircle2Icon,
    AlertCircleIcon, ChevronDownIcon, ChevronUpIcon,
    DatabaseIcon, PencilIcon,
} from "lucide-react";
import Link from "next/link";

const LETTER_TYPES = [
    {
        value: "motivation",
        labelKey: "motivationLetter",
        icon: SparklesIcon,
        desc: "For university program applications",
        color: "violet",
        activeClass: "border-violet-500/50 bg-violet-500/10 text-violet-300",
        btnClass: "bg-violet-600 hover:bg-violet-700 shadow-violet-900/20",
        accentClass: "bg-violet-500/50",
    },
    {
        value: "scholarship",
        labelKey: "scholarshipLetter",
        icon: AwardIcon,
        desc: "For funding and scholarship programs",
        color: "orange",
        activeClass: "border-orange-500/50 bg-orange-500/10 text-orange-300",
        btnClass: "bg-orange-600 hover:bg-orange-700 shadow-orange-900/20",
        accentClass: "bg-orange-500/50",
    },
    {
        value: "cover",
        labelKey: "coverLetter",
        icon: BriefcaseIcon,
        desc: "For internships and research positions",
        color: "blue",
        activeClass: "border-blue-500/50 bg-blue-500/10 text-blue-300",
        btnClass: "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20",
        accentClass: "bg-blue-500/50",
    },
];

type Profile = {
    fullName: string;
    email: string;
    phone?: string;
    citizenship?: string;
    dob?: string;
    educations: { id: string; institutionName: string; major?: string; gpa?: number; gradDate?: string }[];
    extracurriculars: { id: string; role: string; organization: string; description?: string }[];
    testScores: { id: string; testType: string; score: string }[];
};

function ProfileContextPanel({ profile }: { profile: Profile | null; }) {
    const [expanded, setExpanded] = useState(false);

    if (!profile) return null;

    const hasEducation = profile.educations.length > 0;
    const hasExperience = profile.extracurriculars.length > 0;
    const hasScores = profile.testScores.length > 0;
    const completeParts = [true, hasEducation, hasExperience, hasScores].filter(Boolean).length;
    const totalParts = 4;

    return (
        <div className="rounded-xl border border-neutral-800/60 bg-neutral-950/30 overflow-hidden">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-800/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <UserIcon className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-semibold text-neutral-200">
                        AI Context — Your Profile Data
                    </span>
                    <Badge className={`text-[10px] px-2 py-0.5 ${completeParts === totalParts ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                        {completeParts}/{totalParts} sections
                    </Badge>
                </div>
                {expanded
                    ? <ChevronUpIcon className="w-4 h-4 text-neutral-500" />
                    : <ChevronDownIcon className="w-4 h-4 text-neutral-500" />
                }
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-neutral-800/40 pt-4">
                    {/* Identity */}
                    <div className="flex items-start gap-3">
                        <CheckCircle2Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-neutral-300">{profile.fullName}</p>
                            <p className="text-[11px] text-neutral-500">{profile.email}{profile.citizenship ? ` · ${profile.citizenship}` : ""}{profile.phone ? ` · ${profile.phone}` : ""}</p>
                        </div>
                    </div>

                    {/* Education */}
                    <div className="flex items-start gap-3">
                        {hasEducation
                            ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            : <AlertCircleIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        }
                        <div className="flex-1">
                            <p className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                                <GraduationCapIcon className="w-3 h-3" /> Education
                            </p>
                            {hasEducation ? (
                                profile.educations.map(e => (
                                    <p key={e.id} className="text-[11px] text-neutral-500">
                                        {e.institutionName}{e.major ? ` — ${e.major}` : ""}{e.gpa ? ` (GPA ${e.gpa})` : ""}
                                    </p>
                                ))
                            ) : (
                                <Link href="/profile" className="text-[11px] text-amber-400 hover:underline">
                                    Add education in your profile →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Experience */}
                    <div className="flex items-start gap-3">
                        {hasExperience
                            ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            : <AlertCircleIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        }
                        <div className="flex-1">
                            <p className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                                <BriefcaseIcon className="w-3 h-3" /> Experience
                            </p>
                            {hasExperience ? (
                                profile.extracurriculars.slice(0, 3).map(e => (
                                    <p key={e.id} className="text-[11px] text-neutral-500">
                                        {e.role} @ {e.organization}
                                    </p>
                                ))
                            ) : (
                                <Link href="/profile" className="text-[11px] text-amber-400 hover:underline">
                                    Add experience in your profile →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Test Scores */}
                    <div className="flex items-start gap-3">
                        {hasScores
                            ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                            : <AlertCircleIcon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        }
                        <div className="flex-1">
                            <p className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                                <BookOpenIcon className="w-3 h-3" /> Test Scores
                            </p>
                            {hasScores ? (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {profile.testScores.map(ts => (
                                        <span key={ts.id} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium">
                                            {ts.testType}: {ts.score}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <Link href="/profile" className="text-[11px] text-amber-400 hover:underline">
                                    Add test scores in your profile →
                                </Link>
                            )}
                        </div>
                    </div>

                    <p className="text-[10px] text-neutral-600 pt-1 border-t border-neutral-800/40">
                        The AI uses all sections above to write a personalized letter.
                        A richer profile = a better letter.
                    </p>
                </div>
            )}
        </div>
    );
}

type ManualContext = {
    name: string;
    nationality: string;
    email: string;
    education: string;
    experience: string;
    skills: string;
};

function ManualContextForm({
    value,
    onChange,
}: {
    value: ManualContext;
    onChange: (v: ManualContext) => void;
}) {
    const set = (k: keyof ManualContext) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange({ ...value, [k]: e.target.value });

    return (
        <div className="space-y-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest">
                Manual Profile Context
            </p>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Full Name *</label>
                    <Input
                        value={value.name}
                        onChange={set("name")}
                        placeholder="e.g. Biniyam Dereje"
                        className="bg-neutral-950/50 border-neutral-800 text-neutral-200 text-sm"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Nationality</label>
                    <Input
                        value={value.nationality}
                        onChange={set("nationality")}
                        placeholder="e.g. Ethiopian"
                        className="bg-neutral-950/50 border-neutral-800 text-neutral-200 text-sm"
                    />
                </div>
                <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Email</label>
                    <Input
                        type="email"
                        value={value.email}
                        onChange={set("email")}
                        placeholder="e.g. you@email.com"
                        className="bg-neutral-950/50 border-neutral-800 text-neutral-200 text-sm"
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Education</label>
                <Textarea
                    value={value.education}
                    onChange={set("education")}
                    placeholder="e.g. BSc Software Engineering, Addis Ababa University, GPA 3.8, 2020–2024"
                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 text-sm min-h-[70px] resize-none"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Experience</label>
                <Textarea
                    value={value.experience}
                    onChange={set("experience")}
                    placeholder="e.g. Software Engineering Intern at Ethio Telecom (2023). Research Assistant at AAU AI Lab (2022–2023)."
                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 text-sm min-h-[70px] resize-none"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Skills & Test Scores</label>
                <Textarea
                    value={value.skills}
                    onChange={set("skills")}
                    placeholder="e.g. IELTS: 7.5, Python, React, leadership. GRE: 320."
                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 text-sm min-h-[60px] resize-none"
                />
            </div>
            <p className="text-[10px] text-neutral-600">
                This information is sent directly to the AI — nothing is saved to your profile.
            </p>
        </div>
    );
}

export default function LetterStudioPage() {
    const t = useTranslations("Letters");
    const [isLoading, setIsLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [useProfileMode, setUseProfileMode] = useState(true);
    const [manualCtx, setManualCtx] = useState<ManualContext>({
        name: "", nationality: "", email: "", education: "", experience: "", skills: "",
    });
    const [letterType, setLetterType] = useState("motivation");
    const [targetOrg, setTargetOrg] = useState("");
    const [programOrRole, setProgramOrRole] = useState("");
    const [wordLimit, setWordLimit] = useState("");
    const [keyPoints, setKeyPoints] = useState("");
    const [generatedLetter, setGeneratedLetter] = useState("");

    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/profile")
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setProfile(data); })
            .catch(() => {})
            .finally(() => setProfileLoading(false));
    }, []);

    const handleDownloadPDF = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Letter_${targetOrg.split(" ")[0] || "Studio"}`,
    });

    const selectedType = LETTER_TYPES.find(lt => lt.value === letterType)!;

    async function handleGenerate() {
        if (!targetOrg.trim() || !programOrRole.trim()) {
            toast.error("Missing fields", { description: "Please enter the target organization and program / role." });
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
                    manualContext: useProfileMode ? null : manualCtx,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate");

            setGeneratedLetter(data.letter);
            toast.success("Letter generated!");
        } catch (error: any) {
            toast.error("Generation Failed", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-orange-500/20 border border-white/5">
                        <MailIcon className="w-6 h-6 text-violet-400" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-orange-300">
                        {t("pageTitle")}
                    </h2>
                </div>
                <p className="text-neutral-400 text-lg">
                    {t("pageSubtitle")}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Left: Controls ── */}
                <div className="space-y-5">
                    {/* Mode toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl border border-neutral-800/60 bg-neutral-950/30">
                        <div className="flex items-center gap-2.5">
                            {useProfileMode
                                ? <DatabaseIcon className="w-4 h-4 text-violet-400" />
                                : <PencilIcon className="w-4 h-4 text-blue-400" />
                            }
                            <div>
                                <p className="text-sm font-semibold text-neutral-200">
                                    {useProfileMode ? t("usingMasterProfile") : t("manualInput")}
                                </p>
                                <p className="text-[10px] text-neutral-500">
                                    {useProfileMode
                                        ? t("aiReadsProfile")
                                        : t("youProvideContext")
                                    }
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setUseProfileMode(v => !v)}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${useProfileMode ? "bg-violet-600" : "bg-neutral-700"}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${useProfileMode ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* Profile context panel — shown in profile mode */}
                    {useProfileMode && !profileLoading && <ProfileContextPanel profile={profile} />}

                    {/* Manual context form — shown in manual mode */}
                    {!useProfileMode && (
                        <ManualContextForm value={manualCtx} onChange={setManualCtx} />
                    )}

                    <Card className="bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1 h-full ${selectedType.accentClass}`} />
                        <CardHeader>
                            <CardTitle className="text-xl text-neutral-200">{t("letterParameters")}</CardTitle>
                            <CardDescription className="text-neutral-400">
                                {t("letterParametersDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">

                            {/* Letter Type */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">{t("letterType")}</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {LETTER_TYPES.map(lt => {
                                        const Icon = lt.icon;
                                        const active = letterType === lt.value;
                                        return (
                                            <button key={lt.value} onClick={() => setLetterType(lt.value)}
                                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${active ? lt.activeClass : "border-neutral-800 bg-neutral-950/30 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"}`}>
                                                <Icon className="w-4 h-4" />
                                                {t(lt.labelKey)}
                                            </button>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-neutral-500">{selectedType.desc}</p>
                            </div>

                            {/* Target Org */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                                    <BuildingIcon className="w-4 h-4 text-neutral-500" />
                                    {t("targetUniversityOrg")}
                                </label>
                                <Input placeholder="e.g. University of Bologna" className="bg-neutral-950/50 border-neutral-800 text-neutral-200"
                                    value={targetOrg} onChange={e => setTargetOrg(e.target.value)} />
                            </div>

                            {/* Program / Role */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">{t("programScholarshipRole")}</label>
                                <Input placeholder="e.g. MSc Computer Science, Erasmus+ Scholarship"
                                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200"
                                    value={programOrRole} onChange={e => setProgramOrRole(e.target.value)} />
                            </div>

                            {/* Word Limit */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300">
                                    {t("wordLimit")} <span className="text-neutral-500 font-normal">{t("wordLimitOptional")}</span>
                                </label>
                                <Input type="number" placeholder="e.g. 500" className="bg-neutral-950/50 border-neutral-800 text-neutral-200"
                                    value={wordLimit} onChange={e => setWordLimit(e.target.value)} />
                            </div>

                            {/* Key Points */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 flex justify-between items-center">
                                    <span>{t("keyPointsToEmphasize")}</span>
                                    <span className="text-[10px] text-neutral-500 font-normal">{t("keyPointsOptional")}</span>
                                </label>
                                <Textarea
                                    placeholder="e.g. Highlight my research in AI, passion for sustainable development, leadership in student organizations..."
                                    className="bg-neutral-950/50 border-neutral-800 text-neutral-200 min-h-[80px] resize-none"
                                    value={keyPoints} onChange={e => setKeyPoints(e.target.value)} />
                                <p className="text-xs text-neutral-500">
                                    {t("keyPointsHint")}
                                </p>
                            </div>

                            <Button onClick={handleGenerate} disabled={isLoading}
                                className={`w-full text-white shadow-lg h-12 text-md transition-all ${selectedType.btnClass}`}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t("writingLetter")}</>
                                ) : (
                                    <><SparklesIcon className="mr-2 h-5 w-5" />{t("generateLetter", { type: t(selectedType.labelKey) })}</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Right: Output ── */}
                <Card className="bg-neutral-900/20 border-border/30 backdrop-blur-sm flex flex-col relative overflow-hidden min-h-[600px]">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <MailIcon className="w-48 h-48" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-xl text-neutral-200">{t("generatedLetter")}</CardTitle>
                            <CardDescription className="text-neutral-400">
                                {generatedLetter ? t("generatedLetterEdit") : t("generatedLetterEmpty")}
                            </CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm"
                            className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 relative z-10"
                            onClick={handleDownloadPDF} disabled={!generatedLetter || isLoading}>
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            {t("exportPdf")}
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col relative z-10">
                        {generatedLetter ? (
                            <Textarea
                                value={generatedLetter}
                                onChange={e => setGeneratedLetter(e.target.value)}
                                className="flex-1 bg-neutral-950/30 border-neutral-800/50 text-neutral-200 p-6 leading-relaxed focus-visible:ring-1 focus-visible:ring-violet-500/30 min-h-[500px] resize-none text-sm"
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-neutral-800 rounded-xl bg-neutral-950/20">
                                <div className="flex flex-col items-center gap-4 text-neutral-500 text-center px-8">
                                    <MailIcon className="w-12 h-12 opacity-20" />
                                    <div>
                                        <p className="font-medium">{t("readyToWrite")}</p>
                                        <p className="text-xs text-neutral-600 mt-1">
                                            {t("fillParameters")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hidden printable A4 */}
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
