"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    UserIcon,
    GraduationCapIcon,
    BriefcaseIcon,
    CloudIcon,
    CheckCircle2Icon,
    ArrowRightIcon,
    ArrowLeftIcon,
    Loader2,
    PencilIcon,
    XIcon,
    CheckIcon,
    CalendarIcon,
    MapPinIcon,
    FileTextIcon,
    BookOpenIcon,
    PlusIcon,
    TrashIcon,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { SuggestionInput } from "@/components/ui/SuggestionInput";
import { Link } from "@/i18n/routing";
import { capture, getStashedUtmParams } from "@/lib/analytics";

// ─── Schemas ────────────────────────────────────────────────────────────────

const step1Schema = z.object({
    fullName: z.string().min(2, "Name required"),
    dob: z.string().min(1, "DOB required"),
    citizenship: z.string().min(1, "Nationality required"),
});

const step2Schema = z.object({
    institutionName: z.string().min(2, "Institution required"),
    major: z.string().min(2, "Major required"),
    gpa: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    startDate: z.string().optional(),
    gradDate: z.string().optional(),
});

const step3Schema = z.object({
    experiences: z.array(z.object({
        role: z.string().min(2, "Role required"),
        organization: z.string().min(2, "Org required"),
        description: z.string().optional(),
        techStack: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    })).min(1, "At least one experience required"),
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSkillsForRole(role: string) {
    const r = role.toLowerCase();
    if (r.includes("software") || r.includes("developer") || r.includes("engineer")) {
        return ['React', 'Node.js', 'Python', 'AWS', 'Docker', 'TypeScript', 'Git', 'SQL'];
    }
    if (r.includes("design") || r.includes("ui") || r.includes("ux") || r.includes("creative")) {
        return ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Prototyping', 'Tailwind CSS'];
    }
    if (r.includes("data") || r.includes("analyst") || r.includes("science")) {
        return ['Python', 'SQL', 'Tableau', 'Power BI', 'R', 'Machine Learning', 'Statistics'];
    }
    if (r.includes("manager") || r.includes("lead") || r.includes("coordinator")) {
        return ['Project Management', 'Agile', 'Scrum', 'Jira', 'Strategic Planning', 'Leadership'];
    }
    if (r.includes("marketing") || r.includes("sales") || r.includes("content")) {
        return ['SEO', 'Google Analytics', 'Social Media', 'Content Strategy', 'Copywriting', 'CRM'];
    }
    return ['Communication', 'Teamwork', 'Problem Solving', 'Leadership', 'Microsoft Office', 'Public Speaking'];
}

function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return "—";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    } catch {
        return dateStr;
    }
}

const DOC_CONFIG: Record<string, { label: string; colorClass: string; dotClass: string }> = {
    PASSPORT: {
        label: "Passport / ID",
        colorClass: "bg-violet-500/10 border-violet-500/20 text-violet-300",
        dotClass: "bg-violet-400",
    },
    RESUME: {
        label: "CV / Resume",
        colorClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
        dotClass: "bg-indigo-400",
    },
    TRANSCRIPT: {
        label: "Transcript",
        colorClass: "bg-orange-500/10 border-orange-500/20 text-orange-300",
        dotClass: "bg-orange-400",
    },
    ENGLISH_PROFICIENCY: {
        label: "English Proficiency",
        colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
        dotClass: "bg-emerald-400",
    },
    RECOMMENDATION: {
        label: "Recommendation",
        colorClass: "bg-pink-500/10 border-pink-500/20 text-pink-300",
        dotClass: "bg-pink-400",
    },
    ESSAY: {
        label: "Essay",
        colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-300",
        dotClass: "bg-blue-400",
    },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type EducationRecord = {
    id: string;
    institutionName: string;
    major?: string;
    city?: string;
    country?: string;
    gpa?: number;
    startDate?: string;
    gradDate?: string;
};
type ExtracurricularRecord = {
    id: string;
    role: string;
    organization: string;
    description?: string;
    startDate?: string;
    endDate?: string;
};
type DocumentRecord = { id: string; name: string; type: string; fileUrl: string };
type TestScoreRecord = { id: string; testType: string; score: string; dateTaken?: string };

type FullProfile = {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    dob?: string;
    citizenship?: string;
    address?: string;
    isOnboardingComplete: boolean;
    educations: EducationRecord[];
    extracurriculars: ExtracurricularRecord[];
    testScores: TestScoreRecord[];
    documents: DocumentRecord[];
};

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({
    title,
    icon: Icon,
    isEditing,
    onEdit,
    onCancel,
    onSave,
    isSaving,
    children,
    editForm,
}: {
    title: string;
    icon: React.ElementType;
    isEditing: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
    isSaving?: boolean;
    children: React.ReactNode;
    editForm?: React.ReactNode;
}) {
    return (
        <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 via-transparent to-orange-500/3 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-semibold text-neutral-200 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-violet-400" />
                    {title}
                </CardTitle>
                {!isEditing ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEdit}
                        className="text-neutral-500 hover:text-violet-400 hover:bg-violet-500/10 gap-1.5 text-xs"
                    >
                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            disabled={isSaving}
                            className="text-neutral-500 hover:text-neutral-200 gap-1.5 text-xs"
                        >
                            <XIcon className="w-3.5 h-3.5" /> Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={onSave}
                            disabled={isSaving}
                            className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs"
                        >
                            {isSaving ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <CheckIcon className="w-3.5 h-3.5" />
                            )}
                            Save
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent>{isEditing ? editForm : children}</CardContent>
        </Card>
    );
}

// ─── Education Section (multi-entry) ─────────────────────────────────────────

const MAJOR_SUGGESTIONS = [
    "Software Engineering", "Computer Science", "Business Administration",
    "Data Science", "Nursing", "Mechanical Engineering", "Finance",
    "Public Health", "Information Technology", "Architecture", "Economics", "Law",
];

type EducationFormData = {
    institutionName: string;
    major: string;
    gpa: string;
    city: string;
    country: string;
    startDate: string;
    gradDate: string;
};

const emptyEduForm: EducationFormData = {
    institutionName: "", major: "", gpa: "", city: "", country: "", startDate: "", gradDate: "",
};

function EducationEntryForm({
    initial,
    onSave,
    onCancel,
    isSaving,
}: {
    initial: EducationFormData;
    onSave: (data: EducationFormData) => void;
    onCancel: () => void;
    isSaving: boolean;
}) {
    const [data, setData] = useState<EducationFormData>(initial);
    const set = (k: keyof EducationFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setData((p) => ({ ...p, [k]: e.target.value }));

    return (
        <div className="space-y-4 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
            <div className="space-y-1.5">
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Institution *</label>
                <Input value={data.institutionName} onChange={set("institutionName")}
                    placeholder="e.g. Addis Ababa University"
                    className="bg-neutral-950/50 border-neutral-800" />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Major / Field</label>
                    <SuggestionInput value={data.major} onChange={(v) => setData((p) => ({ ...p, major: v }))}
                        suggestions={MAJOR_SUGGESTIONS} placeholder="e.g. Computer Science" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">GPA</label>
                    <Input type="number" step="0.01" value={data.gpa} onChange={set("gpa")}
                        placeholder="e.g. 3.8" className="bg-neutral-950/50 border-neutral-800" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">City</label>
                    <Input value={data.city} onChange={set("city")} className="bg-neutral-950/50 border-neutral-800" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Country</label>
                    <Input value={data.country} onChange={set("country")} className="bg-neutral-950/50 border-neutral-800" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Start Date</label>
                    <Input type="date" value={data.startDate} onChange={set("startDate")}
                        className="bg-neutral-950/50 border-neutral-800 [color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Graduation Date</label>
                    <Input type="date" value={data.gradDate} onChange={set("gradDate")}
                        className="bg-neutral-950/50 border-neutral-800 [color-scheme:dark]" />
                </div>
            </div>
            <div className="flex gap-2 pt-1">
                <Button size="sm" disabled={isSaving || !data.institutionName.trim()}
                    onClick={() => onSave(data)}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs">
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckIcon className="w-3.5 h-3.5" />}
                    Save
                </Button>
                <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}
                    className="text-neutral-500 hover:text-neutral-200 text-xs">
                    Cancel
                </Button>
            </div>
        </div>
    );
}

function EducationSection({
    educations,
    onRefresh,
}: {
    educations: EducationRecord[];
    onRefresh: () => void;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAdd = async (data: EducationFormData) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/educations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Education entry added.");
            setIsAdding(false);
            onRefresh();
        } catch {
            toast.error("Failed to add education.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (id: string, data: EducationFormData) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/educations/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success("Education updated.");
            setEditingId(null);
            onRefresh();
        } catch {
            toast.error("Failed to update education.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/educations/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            toast.success("Education entry removed.");
            onRefresh();
        } catch {
            toast.error("Failed to delete education.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 via-transparent to-orange-500/3 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-semibold text-neutral-200 flex items-center gap-2">
                    <GraduationCapIcon className="w-4 h-4 text-violet-400" />
                    Education
                </CardTitle>
                {!isAdding && (
                    <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}
                        className="text-neutral-500 hover:text-violet-400 hover:bg-violet-500/10 gap-1.5 text-xs">
                        <PlusIcon className="w-3.5 h-3.5" /> Add
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add form */}
                {isAdding && (
                    <EducationEntryForm
                        initial={emptyEduForm}
                        onSave={handleAdd}
                        onCancel={() => setIsAdding(false)}
                        isSaving={isSaving}
                    />
                )}

                {/* Existing entries */}
                {educations.length > 0 ? (
                    <div className="space-y-3">
                        {educations.map((edu, i) => (
                            <div key={edu.id}>
                                {editingId === edu.id ? (
                                    <EducationEntryForm
                                        initial={{
                                            institutionName: edu.institutionName,
                                            major: edu.major || "",
                                            gpa: edu.gpa ? String(edu.gpa) : "",
                                            city: edu.city || "",
                                            country: edu.country || "",
                                            startDate: edu.startDate ? new Date(edu.startDate).toISOString().split("T")[0] : "",
                                            gradDate: edu.gradDate ? new Date(edu.gradDate).toISOString().split("T")[0] : "",
                                        }}
                                        onSave={(data) => handleUpdate(edu.id, data)}
                                        onCancel={() => setEditingId(null)}
                                        isSaving={isSaving}
                                    />
                                ) : (
                                    <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border border-neutral-800/50 bg-neutral-950/20 group ${i > 0 ? "mt-2" : ""}`}>
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <h3 className="font-bold text-neutral-100 text-sm">{edu.institutionName}</h3>
                                            <p className="text-violet-400 text-xs font-medium">{edu.major || "—"}</p>
                                            {(edu.city || edu.country) && (
                                                <p className="text-neutral-500 text-xs flex items-center gap-1">
                                                    <MapPinIcon className="w-3 h-3" />
                                                    {[edu.city, edu.country].filter(Boolean).join(", ")}
                                                </p>
                                            )}
                                            <p className="text-neutral-600 text-xs">
                                                {formatDate(edu.startDate)} — {formatDate(edu.gradDate)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            {edu.gpa && (
                                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                                                    GPA {edu.gpa}
                                                </Badge>
                                            )}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingId(edu.id)}
                                                    className="p-1.5 rounded-lg text-neutral-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors">
                                                    <PencilIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => handleDelete(edu.id)} disabled={deletingId === edu.id}
                                                    className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                    {deletingId === edu.id
                                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        : <TrashIcon className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : !isAdding ? (
                    <div className="text-center py-6">
                        <GraduationCapIcon className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm mb-1">No education added yet.</p>
                        <p className="text-neutral-600 text-xs">Add your degrees, diplomas, or certificates.</p>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

// ─── Test Scores ─────────────────────────────────────────────────────────────

const TEST_TYPES = ["SAT", "ACT", "IELTS", "TOEFL", "Duolingo", "GRE", "GMAT", "Other"];

const TEST_COLORS: Record<string, string> = {
    SAT: "bg-blue-500/10 border-blue-500/20 text-blue-300",
    ACT: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300",
    IELTS: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
    TOEFL: "bg-teal-500/10 border-teal-500/20 text-teal-300",
    Duolingo: "bg-green-500/10 border-green-500/20 text-green-300",
    GRE: "bg-violet-500/10 border-violet-500/20 text-violet-300",
    GMAT: "bg-orange-500/10 border-orange-500/20 text-orange-300",
    Other: "bg-neutral-800/60 border-neutral-700 text-neutral-400",
};

function TestScoresSection({
    scores,
    onRefresh,
}: {
    scores: TestScoreRecord[];
    onRefresh: () => void;
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [testType, setTestType] = useState("IELTS");
    const [score, setScore] = useState("");
    const [dateTaken, setDateTaken] = useState("");

    const handleAdd = async () => {
        if (!score.trim()) { toast.error("Please enter a score."); return; }
        setIsSaving(true);
        try {
            const res = await fetch("/api/test-scores", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ testType, score, dateTaken: dateTaken || null }),
            });
            if (!res.ok) throw new Error("Failed");
            toast.success(`${testType} score added.`);
            setScore("");
            setDateTaken("");
            setIsAdding(false);
            onRefresh();
        } catch {
            toast.error("Failed to add score.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            const res = await fetch(`/api/test-scores/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed");
            toast.success("Score removed.");
            onRefresh();
        } catch {
            toast.error("Failed to delete score.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 via-transparent to-orange-500/3 pointer-events-none" />
            <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-semibold text-neutral-200 flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4 text-violet-400" />
                    Test Scores
                </CardTitle>
                {!isAdding && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        className="text-neutral-500 hover:text-violet-400 hover:bg-violet-500/10 gap-1.5 text-xs"
                    >
                        <PlusIcon className="w-3.5 h-3.5" /> Add Score
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Form */}
                {isAdding && (
                    <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-3">
                        <p className="text-xs font-semibold text-violet-300 uppercase tracking-widest">New Test Score</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Test Type</label>
                                <select
                                    value={testType}
                                    onChange={(e) => setTestType(e.target.value)}
                                    className="w-full rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-violet-500/50"
                                >
                                    {TEST_TYPES.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Score</label>
                                <Input
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    placeholder={testType === "IELTS" ? "e.g. 7.5" : testType === "SAT" ? "e.g. 1480" : "Score"}
                                    className="bg-neutral-950/50 border-neutral-800"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Date Taken</label>
                                <Input
                                    type="date"
                                    value={dateTaken}
                                    onChange={(e) => setDateTaken(e.target.value)}
                                    className="bg-neutral-950/50 border-neutral-800 [color-scheme:dark]"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                            <Button
                                size="sm"
                                onClick={handleAdd}
                                disabled={isSaving}
                                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 text-xs"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckIcon className="w-3.5 h-3.5" />}
                                Save Score
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setIsAdding(false); setScore(""); setDateTaken(""); }}
                                disabled={isSaving}
                                className="text-neutral-500 hover:text-neutral-200 text-xs"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Scores List */}
                {scores.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {scores.map((ts) => {
                            const colorClass = TEST_COLORS[ts.testType] || TEST_COLORS.Other;
                            return (
                                <div
                                    key={ts.id}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colorClass} group relative`}
                                >
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider">{ts.testType}</p>
                                        <p className="text-xl font-black leading-tight">{ts.score}</p>
                                        {ts.dateTaken && (
                                            <p className="text-[10px] opacity-60 mt-0.5">
                                                {formatDate(ts.dateTaken)}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(ts.id)}
                                        disabled={deletingId === ts.id}
                                        className="ml-2 opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 transition-all"
                                    >
                                        {deletingId === ts.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <TrashIcon className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : !isAdding ? (
                    <div className="text-center py-6">
                        <BookOpenIcon className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm mb-1">No test scores added yet.</p>
                        <p className="text-neutral-600 text-xs">Add your SAT, IELTS, TOEFL, or other scores — they power your AI essay drafts.</p>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfileView({ profile, onRefresh }: { profile: FullProfile; onRefresh: () => void }) {
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const { user: clerkUser } = useUser();

    const identityForm = useForm<z.infer<typeof step1Schema>>({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            fullName: profile.fullName || "",
            dob: profile.dob ? new Date(profile.dob).toISOString().split("T")[0] : "",
            citizenship: profile.citizenship || "",
        },
    });

    const experienceForm = useForm<z.infer<typeof step3Schema>>({
        resolver: zodResolver(step3Schema),
        defaultValues: {
            experiences:
                profile.extracurriculars.length > 0
                    ? profile.extracurriculars.map((e) => ({
                          role: e.role,
                          organization: e.organization,
                          description: e.description || "",
                          techStack: "",
                          startDate: e.startDate
                              ? new Date(e.startDate).toISOString().split("T")[0]
                              : "",
                          endDate: e.endDate
                              ? new Date(e.endDate).toISOString().split("T")[0]
                              : "",
                      }))
                    : [
                          {
                              role: "",
                              organization: "",
                              description: "",
                              techStack: "",
                              startDate: "",
                              endDate: "",
                          },
                      ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: experienceForm.control,
        name: "experiences",
    });

    const saveSection = async (step: number, data: object) => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/onboarding/step", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step, data }),
            });
            if (!res.ok) throw new Error("Save failed");
            toast.success("Profile updated successfully.");
            setEditingSection(null);
            onRefresh();
        } catch {
            toast.error("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveIdentity = identityForm.handleSubmit((data) => saveSection(1, data));
    const handleSaveExperience = experienceForm.handleSubmit((data) => saveSection(3, data));

    const initials =
        profile.fullName
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── Profile Header ── */}
            <div className="relative rounded-2xl border border-neutral-800/50 bg-neutral-900/40 backdrop-blur-xl overflow-hidden p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-orange-500/10 pointer-events-none" />
                <div className="relative flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white text-2xl font-black shadow-xl shrink-0 overflow-hidden">
                        {clerkUser?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={clerkUser.imageUrl}
                                alt="Avatar"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            initials
                        )}
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                        <h1 className="text-3xl font-black text-neutral-100 truncate">
                            {profile.fullName}
                        </h1>
                        <p className="text-neutral-400 text-sm">{profile.email}</p>
                        <div className="flex items-center gap-3 pt-1 flex-wrap">
                            {profile.citizenship && (
                                <Badge className="bg-violet-500/10 text-violet-300 border-violet-500/20 text-xs">
                                    {profile.citizenship}
                                </Badge>
                            )}
                            {profile.dob && (
                                <span className="text-neutral-500 text-xs flex items-center gap-1">
                                    <CalendarIcon className="w-3 h-3" />
                                    {formatDate(profile.dob)}
                                </span>
                            )}
                        </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0 self-start">
                        <CheckCircle2Icon className="w-3 h-3 mr-1" /> Complete
                    </Badge>
                </div>
            </div>

            {/* ── Identity ── */}
            <SectionCard
                title="Personal Identity"
                icon={UserIcon}
                isEditing={editingSection === "identity"}
                onEdit={() => setEditingSection("identity")}
                onCancel={() => {
                    setEditingSection(null);
                    identityForm.reset();
                }}
                onSave={handleSaveIdentity}
                isSaving={isSaving}
                editForm={
                    <Form {...identityForm}>
                        <form className="space-y-4">
                            <FormField
                                control={identityForm.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-neutral-400 text-xs">
                                            Full Name
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className="bg-neutral-950/50 border-neutral-800"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={identityForm.control}
                                    name="dob"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-400 text-xs">
                                                Date of Birth
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    className="bg-neutral-950/50 border-neutral-800 [color-scheme:dark]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={identityForm.control}
                                    name="citizenship"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-neutral-400 text-xs">
                                                Nationality
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="bg-neutral-950/50 border-neutral-800"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </form>
                    </Form>
                }
            >
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1.5 tracking-widest">
                            Full Name
                        </p>
                        <p className="text-neutral-200 text-sm font-medium">
                            {profile.fullName || "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1.5 tracking-widest">
                            Date of Birth
                        </p>
                        <p className="text-neutral-200 text-sm font-medium">
                            {formatDate(profile.dob)}
                        </p>
                    </div>
                    <div>
                        <p className="text-[10px] text-neutral-500 uppercase font-bold mb-1.5 tracking-widest">
                            Nationality
                        </p>
                        <p className="text-neutral-200 text-sm font-medium">
                            {profile.citizenship || "—"}
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* ── Education ── */}
            <EducationSection educations={profile.educations} onRefresh={onRefresh} />

            {/* ── Experience ── */}
            <SectionCard
                title="Professional Experience"
                icon={BriefcaseIcon}
                isEditing={editingSection === "experience"}
                onEdit={() => setEditingSection("experience")}
                onCancel={() => {
                    setEditingSection(null);
                    experienceForm.reset();
                }}
                onSave={handleSaveExperience}
                isSaving={isSaving}
                editForm={
                    <Form {...experienceForm}>
                        <form className="space-y-4">
                            {fields.map((field, i) => (
                                <div
                                    key={field.id}
                                    className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/20 space-y-3 relative"
                                >
                                    {fields.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => remove(i)}
                                            className="absolute top-3 right-3 text-neutral-600 hover:text-red-400 transition-colors"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <FormField
                                            control={experienceForm.control}
                                            name={`experiences.${i}.role`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-400 text-xs">
                                                        Role
                                                    </FormLabel>
                                                    <FormControl>
                                                        <SuggestionInput
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            suggestions={[
                                                                "Software Engineering Intern",
                                                                "Research Assistant",
                                                                "Teaching Assistant",
                                                                "Lab Technician",
                                                                "Marketing Coordinator",
                                                                "Data Analyst Intern",
                                                                "Community Volunteer",
                                                                "Student Representative",
                                                                "Project Manager Intern",
                                                                "Healthcare Assistant",
                                                            ]}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={experienceForm.control}
                                            name={`experiences.${i}.organization`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-400 text-xs">
                                                        Organization
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            className="bg-neutral-950/50 border-neutral-800"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={experienceForm.control}
                                            name={`experiences.${i}.startDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-400 text-xs">
                                                        Start Date
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            className="bg-neutral-950/50 border-neutral-800 [color-scheme:dark]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={experienceForm.control}
                                            name={`experiences.${i}.endDate`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-neutral-400 text-xs">
                                                        End Date
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="date"
                                                            className="bg-neutral-950/50 border-neutral-800 [color-scheme:dark]"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <FormField
                                        control={experienceForm.control}
                                        name={`experiences.${i}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-400 text-xs">
                                                    Description
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        className="bg-neutral-950/50 border-neutral-800"
                                                        {...field}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={experienceForm.control}
                                        name={`experiences.${i}.techStack`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-neutral-400 text-xs">
                                                    Skills
                                                </FormLabel>
                                                <FormControl>
                                                    <SuggestionInput
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        isMulti
                                                        suggestions={getSkillsForRole(
                                                            experienceForm.watch(
                                                                `experiences.${i}.role`
                                                            ) || ""
                                                        )}
                                                        placeholder="e.g. React, Python..."
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    append({
                                        role: "",
                                        organization: "",
                                        description: "",
                                        techStack: "",
                                        startDate: "",
                                        endDate: "",
                                    })
                                }
                            >
                                + Add Role
                            </Button>
                        </form>
                    </Form>
                }
            >
                {profile.extracurriculars.length > 0 ? (
                    <div className="space-y-5">
                        {profile.extracurriculars.map((exp, i) => (
                            <div
                                key={exp.id}
                                className={`pl-4 border-l-2 border-violet-500/30 space-y-1 ${
                                    i > 0 ? "pt-5 border-t border-t-neutral-800/50" : ""
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-0.5">
                                        <p className="font-bold text-neutral-100 text-sm">
                                            {exp.role}
                                        </p>
                                        <p className="text-violet-400 text-xs font-medium">
                                            {exp.organization}
                                        </p>
                                        {exp.description && (
                                            <p className="text-neutral-400 text-xs mt-1">
                                                {exp.description}
                                            </p>
                                        )}
                                    </div>
                                    {(exp.startDate || exp.endDate) && (
                                        <p className="text-neutral-500 text-xs shrink-0">
                                            {formatDate(exp.startDate)} —{" "}
                                            {exp.endDate ? formatDate(exp.endDate) : "Present"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-neutral-500 text-sm">No experience added yet.</p>
                )}
            </SectionCard>

            {/* ── Test Scores ── */}
            <TestScoresSection scores={profile.testScores} onRefresh={onRefresh} />

            {/* ── Cloud Vault ── */}
            <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/3 via-transparent to-orange-500/3 pointer-events-none" />
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-base font-semibold text-neutral-200 flex items-center gap-2">
                        <CloudIcon className="w-4 h-4 text-violet-400" /> Cloud Vault
                    </CardTitle>
                    <Link href="/documents">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-500 hover:text-violet-400 hover:bg-violet-500/10 text-xs"
                        >
                            Manage
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {profile.documents.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {profile.documents.map((doc) => {
                                const config = DOC_CONFIG[doc.type] || {
                                    label: doc.type,
                                    colorClass:
                                        "bg-neutral-800/60 border-neutral-700 text-neutral-400",
                                    dotClass: "bg-neutral-500",
                                };
                                return (
                                    <a
                                        key={doc.id}
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all hover:scale-[1.02] hover:shadow-md ${config.colorClass}`}
                                    >
                                        <FileTextIcon className="w-3.5 h-3.5 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="font-bold leading-none">
                                                {config.label}
                                            </p>
                                            <p className="text-[10px] opacity-60 truncate max-w-[130px] mt-0.5">
                                                {doc.name}
                                            </p>
                                        </div>
                                        <CheckCircle2Icon className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                    </a>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <CloudIcon className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                            <p className="text-neutral-500 text-sm mb-3">
                                Your vault is empty.
                            </p>
                            <Link href="/documents">
                                <Button
                                    size="sm"
                                    className="bg-violet-600 hover:bg-violet-700 text-white"
                                >
                                    Upload Documents
                                </Button>
                            </Link>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ─── Onboarding Wizard ───────────────────────────────────────────────────────

function OnboardingWizard() {
    const [vaultDocuments, setVaultDocuments] = useState<{ type: string; fileUrl: string; name: string | null }[]>([]);

    const t = useTranslations("OnboardingWizard");
    const { user, isLoaded: isUserLoaded } = useUser();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [passportUrl, setPassportUrl] = useState<string | null>(null);
    const [passportName, setPassportName] = useState<string | null>(null);
    const [cvUrl, setCvUrl] = useState<string | null>(null);
    const [cvName, setCvName] = useState<string | null>(null);
    const [transcriptUrl, setTranscriptUrl] = useState<string | null>(null);
    const [transcriptName, setTranscriptName] = useState<string | null>(null);

    const [isPassportUploading, setIsPassportUploading] = useState(false);
    const [isCvUploading, setIsCvUploading] = useState(false);
    const [isTranscriptUploading, setIsTranscriptUploading] = useState(false);
    const [referralSource, setReferralSource] = useState("");

    const form1 = useForm<z.infer<typeof step1Schema>>({
        resolver: zodResolver(step1Schema),
        defaultValues: { fullName: "", dob: "", citizenship: "" }
    });

    const form2 = useForm<z.infer<typeof step2Schema>>({
        resolver: zodResolver(step2Schema),
        defaultValues: { institutionName: "", major: "", gpa: "", city: "", country: "", startDate: "", gradDate: "" }
    });

    const form3 = useForm<z.infer<typeof step3Schema>>({
        resolver: zodResolver(step3Schema),
        defaultValues: { experiences: [{ role: "", organization: "", description: "", techStack: "", startDate: "", endDate: "" }] }
    });

    useEffect(() => {
        if (!isUserLoaded) return;

        async function loadStepData() {
            setIsLoading(true);
            try {
                const res1 = await fetch("/api/onboarding/step?step=1");
                if (res1.ok) { const data = await res1.json(); form1.reset(data); }
                const res2 = await fetch("/api/onboarding/step?step=2");
                if (res2.ok) { const data = await res2.json(); form2.reset(data); }
                const res3 = await fetch("/api/onboarding/step?step=3");
                if (res3.ok) { const data = await res3.json(); if (data.experiences?.length > 0) { form3.reset(data); } }
                const res4 = await fetch("/api/onboarding/step?step=4");
                if (res4.ok) {
                    const data = await res4.json();
                    const docs: { type: string, fileUrl: string, name: string }[] = data.documents || [];
                    setVaultDocuments(docs);
                    const savedPassport = docs.find(d => d.type === 'PASSPORT');
                    const savedCv = docs.find(d => d.type === 'RESUME');
                    const savedTranscript = docs.find(d => d.type === 'TRANSCRIPT');
                    if (savedPassport) { setPassportUrl(savedPassport.fileUrl); setPassportName(savedPassport.name); }
                    if (savedCv) { setCvUrl(savedCv.fileUrl); setCvName(savedCv.name); }
                    if (savedTranscript) { setTranscriptUrl(savedTranscript.fileUrl); setTranscriptName(savedTranscript.name); }
                }
            } catch (err) {
                console.error("Load error:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadStepData();
    }, [isUserLoaded, form1, form2, form3]);

    useEffect(() => {
        const docs = [];
        if (passportUrl) docs.push({ type: 'PASSPORT', fileUrl: passportUrl, name: passportName });
        if (cvUrl) docs.push({ type: 'RESUME', fileUrl: cvUrl, name: cvName });
        if (transcriptUrl) docs.push({ type: 'TRANSCRIPT', fileUrl: transcriptUrl, name: transcriptName });
        setVaultDocuments(docs);
    }, [passportUrl, cvUrl, transcriptUrl, passportName, cvName, transcriptName]);

    const handleNext = async () => {
        let isValid = false;
        let data = {};

        if (currentStep === 1) { isValid = await form1.trigger(); data = form1.getValues(); }
        else if (currentStep === 2) { isValid = await form2.trigger(); data = form2.getValues(); }
        else if (currentStep === 3) { isValid = await form3.trigger(); data = form3.getValues(); }
        else if (currentStep === 4) {
            if (!passportUrl || !cvUrl || !transcriptUrl) {
                toast.error("Missing Documents", { description: "Please upload Passport/ID, CV, and Transcript to your vault." });
                return;
            }
            isValid = true;
            data = { documents: [
                { type: 'PASSPORT', url: passportUrl, name: passportName || 'passport' },
                { type: 'RESUME', url: cvUrl, name: cvName || 'cv' },
                ...(transcriptUrl ? [{ type: 'TRANSCRIPT', url: transcriptUrl, name: transcriptName || 'transcript' }] : [])
            ]};
        }

        if (isValid) {
            setIsSaving(true);
            try {
                const res = await fetch("/api/onboarding/step", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ step: currentStep, data })
                });
                if (res.ok) { setCurrentStep(prev => prev + 1); }
                else { throw new Error("Save failed"); }
            } catch (err) {
                toast.error("Error", { description: "Failed to save progress." });
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleComplete = async () => {
        if (!referralSource) {
            toast.error(t("referralRequired"));
            return;
        }
        setIsSaving(true);
        try {
            const utm = getStashedUtmParams();
            const res = await fetch("/api/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    referralSource,
                    utmSource: utm.utm_source ?? null,
                    utmMedium: utm.utm_medium ?? null,
                    utmCampaign: utm.utm_campaign ?? null,
                }),
            });
            if (res.ok) {
                capture("signup_completed", { referral_source: referralSource });
                toast.success("Welcome aboard!", { description: "Onboarding complete. Entering Mission Control..." });
                router.push("/dashboard");
            } else { throw new Error("Completion failed"); }
        } catch (err) {
            toast.error("Error", { description: "Failed to finalize onboarding." });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const steps = [
        { id: 1, title: t("step1"), icon: UserIcon },
        { id: 2, title: t("step2"), icon: GraduationCapIcon },
        { id: 3, title: t("step3"), icon: BriefcaseIcon },
        { id: 4, title: t("step4"), icon: CloudIcon },
        { id: 5, title: t("summary"), icon: CheckCircle2Icon },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-orange-400">
                        {t("title")}
                    </h1>
                    <p className="text-neutral-400 text-lg">{t("description")}</p>
                </div>
                <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                        className="absolute h-full bg-gradient-to-r from-violet-600 via-violet-400 to-orange-400 transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                </div>
                <div className="grid grid-cols-5 gap-2 pt-2">
                    {steps.map((s) => (
                        <div key={s.id} className={`flex flex-col items-center gap-2 transition-colors duration-300 ${currentStep >= s.id ? 'text-violet-400' : 'text-neutral-600'}`}>
                            <div className={`p-2 rounded-lg border ${currentStep >= s.id ? 'border-violet-500/50 bg-violet-500/10' : 'border-neutral-800 bg-neutral-900/50'}`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest hidden md:block">{s.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                <CardHeader>
                    <CardTitle className="text-2xl text-neutral-100 flex items-center gap-3">
                        {steps[currentStep - 1].title}
                    </CardTitle>
                    <p className="text-neutral-400 text-sm">{t(`step${currentStep}Desc` as any || "summaryDesc")}</p>
                </CardHeader>
                <CardContent className="min-h-[300px]">
                    {currentStep === 1 && (
                        <Form {...form1}>
                            <form className="space-y-6">
                                <FormField control={form1.control} name="fullName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("fullName")}</FormLabel>
                                        <FormControl><Input className="bg-neutral-950/50 border-neutral-800" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField control={form1.control} name="dob" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("dob")}</FormLabel>
                                            <FormControl><Input type="date" className="bg-neutral-950/50 border-neutral-800 [color-scheme:dark]" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form1.control} name="citizenship" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("nationality")}</FormLabel>
                                            <FormControl><Input placeholder="e.g. Ethiopian" className="bg-neutral-950/50 border-neutral-800" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </form>
                        </Form>
                    )}
                    {currentStep === 2 && (
                        <Form {...form2}>
                            <form className="space-y-6">
                                <FormField control={form2.control} name="institutionName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{t("institution")}</FormLabel>
                                        <FormControl><Input className="bg-neutral-950/50 border-neutral-800" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <div className="grid md:grid-cols-2 gap-6">
                                    <FormField control={form2.control} name="major" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("major")}</FormLabel>
                                            <FormControl>
                                                <SuggestionInput value={field.value} onChange={field.onChange} placeholder="e.g. Software Engineering"
                                                    suggestions={['Software Engineering','Computer Science','Business Administration','Data Science','Nursing','Mechanical Engineering','Finance','Public Health','Information Technology','Architecture','Economics','Law']} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form2.control} name="gpa" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t("gpa")}</FormLabel>
                                            <FormControl><Input type="number" step="0.01" className="bg-neutral-950/50 border-neutral-800" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            </form>
                        </Form>
                    )}
                    {currentStep === 3 && (
                        <Form {...form3}>
                            <form className="space-y-6">
                                {form3.getValues("experiences").map((_, i) => (
                                    <div key={i} className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/20 space-y-4">
                                        <FormField control={form3.control} name={`experiences.${i}.role`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("pastRoles")}</FormLabel>
                                                <FormControl>
                                                    <SuggestionInput value={field.value} onChange={field.onChange} placeholder="e.g. Research Assistant"
                                                        suggestions={['Software Engineering Intern','Research Assistant','Teaching Assistant','Lab Technician','Marketing Coordinator','Data Analyst Intern','Community Volunteer','Student Representative','Project Manager Intern','Healthcare Assistant']} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form3.control} name={`experiences.${i}.organization`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Organization</FormLabel>
                                                <FormControl><Input className="bg-neutral-950/50 border-neutral-800" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form3.control} name={`experiences.${i}.description`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("roleDesc")}</FormLabel>
                                                <FormControl><Input className="bg-neutral-950/50 border-neutral-800" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form3.control} name={`experiences.${i}.techStack`} render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t("techStack")}</FormLabel>
                                                <FormControl>
                                                    <SuggestionInput value={field.value || ""} onChange={field.onChange} isMulti={true} placeholder="e.g. React, Python, AWS..."
                                                        suggestions={getSkillsForRole(form3.watch(`experiences.${i}.role`) || "")} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm"
                                    onClick={() => form3.setValue("experiences", [...form3.getValues("experiences"), { role: "", organization: "", description: "", techStack: "" }])}>
                                    + Add Role
                                </Button>
                            </form>
                        </Form>
                    )}
                    {currentStep === 4 && (
                        <div className="space-y-8">
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className={`space-y-4 p-5 rounded-2xl border-2 border-dashed transition-colors ${passportUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-violet-500/30 bg-violet-500/5'} text-center`}>
                                    {passportUrl ? <CheckCircle2Icon className="w-8 h-8 text-emerald-400 mx-auto" /> : isPassportUploading ? <Loader2 className="w-8 h-8 text-violet-400 mx-auto animate-spin" /> : <CloudIcon className="w-8 h-8 text-violet-400 mx-auto" />}
                                    <div className="text-sm"><h3 className="font-bold text-neutral-200">{t("passport")}</h3></div>
                                    {passportUrl ? (
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-neutral-600 truncate px-2">{passportName}</p>
                                            <button className="text-[10px] text-violet-400 hover:underline" onClick={() => { setPassportUrl(null); setPassportName(null); }}>Replace</button>
                                        </div>
                                    ) : (
                                        <UploadButton endpoint="documentUploader" onUploadBegin={() => setIsPassportUploading(true)}
                                            onClientUploadComplete={(res: any[]) => { setIsPassportUploading(false); if (res?.[0]?.ufsUrl) { setPassportUrl(res[0].ufsUrl); setPassportName(res[0].name); toast.success("Document securely vaulted.", { description: "Passport / ID uploaded." }); } }}
                                            onUploadError={() => { setIsPassportUploading(false); toast.error("Upload failed."); }}
                                            className="ut-button:bg-violet-600 ut-button:scale-75 ut-label:hidden" />
                                    )}
                                </div>
                                <div className={`space-y-4 p-5 rounded-2xl border-2 border-dashed transition-colors ${cvUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-indigo-500/30 bg-indigo-500/5'} text-center`}>
                                    {cvUrl ? <CheckCircle2Icon className="w-8 h-8 text-emerald-400 mx-auto" /> : isCvUploading ? <Loader2 className="w-8 h-8 text-indigo-400 mx-auto animate-spin" /> : <CloudIcon className="w-8 h-8 text-indigo-400 mx-auto" />}
                                    <div className="text-sm"><h3 className="font-bold text-neutral-200">{t("cv")}</h3></div>
                                    {cvUrl ? (
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-neutral-600 truncate px-2">{cvName}</p>
                                            <button className="text-[10px] text-indigo-400 hover:underline" onClick={() => { setCvUrl(null); setCvName(null); }}>Replace</button>
                                        </div>
                                    ) : (
                                        <UploadButton endpoint="documentUploader" onUploadBegin={() => setIsCvUploading(true)}
                                            onClientUploadComplete={(res: any[]) => { setIsCvUploading(false); if (res?.[0]?.ufsUrl) { setCvUrl(res[0].ufsUrl); setCvName(res[0].name); toast.success("CV securely vaulted."); } }}
                                            onUploadError={() => { setIsCvUploading(false); toast.error("Upload failed."); }}
                                            className="ut-button:bg-indigo-600 ut-button:scale-75 ut-label:hidden" />
                                    )}
                                </div>
                                <div className={`space-y-4 p-5 rounded-2xl border-2 border-dashed transition-colors ${transcriptUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-orange-500/30 bg-orange-500/5'} text-center`}>
                                    {transcriptUrl ? <CheckCircle2Icon className="w-8 h-8 text-emerald-400 mx-auto" /> : isTranscriptUploading ? <Loader2 className="w-8 h-8 text-orange-400 mx-auto animate-spin" /> : <CloudIcon className="w-8 h-8 text-orange-400 mx-auto" />}
                                    <div className="text-sm"><h3 className="font-bold text-neutral-200">Transcript</h3></div>
                                    {transcriptUrl ? (
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-neutral-600 truncate px-2">{transcriptName}</p>
                                            <button className="text-[10px] text-orange-400 hover:underline" onClick={() => { setTranscriptUrl(null); setTranscriptName(null); }}>Replace</button>
                                        </div>
                                    ) : (
                                        <UploadButton endpoint="documentUploader" onUploadBegin={() => setIsTranscriptUploading(true)}
                                            onClientUploadComplete={(res: any[]) => { setIsTranscriptUploading(false); if (res?.[0]?.ufsUrl) { setTranscriptUrl(res[0].ufsUrl); setTranscriptName(res[0].name); toast.success("Transcript securely vaulted."); } }}
                                            onUploadError={() => { setIsTranscriptUploading(false); toast.error("Upload failed."); }}
                                            className="ut-button:bg-orange-600 ut-button:scale-75 ut-label:hidden" />
                                    )}
                                </div>
                            </div>
                            {(!passportUrl || !cvUrl || !transcriptUrl) && (
                                <p className="text-center text-xs text-neutral-500">
                                    All documents are required to proceed. Your files are encrypted and stored securely.
                                </p>
                            )}
                        </div>
                    )}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1"><p className="text-xs text-neutral-500 uppercase font-bold">{t("fullName")}</p><p className="text-neutral-200">{form1.getValues("fullName")}</p></div>
                                <div className="space-y-1"><p className="text-xs text-neutral-500 uppercase font-bold">{t("nationality")}</p><p className="text-neutral-200">{form1.getValues("citizenship")}</p></div>
                                <div className="space-y-1"><p className="text-xs text-neutral-500 uppercase font-bold">{t("institution")}</p><p className="text-neutral-200">{form2.getValues("institutionName")}</p></div>
                                <div className="space-y-1"><p className="text-xs text-neutral-500 uppercase font-bold">{t("major")}</p><p className="text-neutral-200">{form2.getValues("major")}</p></div>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-neutral-800">
                                <p className="text-xs text-neutral-500 uppercase font-bold mb-2">Professional Experience</p>
                                {form3.getValues("experiences").map((exp, idx) => (
                                    <div key={idx} className="space-y-1 pl-4 border-l border-violet-500/30">
                                        <p className="text-sm font-bold text-neutral-200">{exp.role} @ {exp.organization}</p>
                                        {exp.techStack && <p className="text-xs text-violet-400 font-medium italic">Skills: {exp.techStack}</p>}
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-neutral-800">
                                <p className="text-xs text-neutral-500 uppercase font-bold mb-3">Attached Documents</p>
                                <div className="flex flex-wrap gap-2">
                                    {passportName ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs text-violet-300"><CheckCircle2Icon className="w-3 h-3" />PASSPORT: {passportName}</div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-full bg-neutral-800/60 text-xs text-neutral-500 border border-neutral-700 border-dashed">No Passport / ID uploaded</div>
                                    )}
                                    {cvName ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300"><CheckCircle2Icon className="w-3 h-3" />CV: {cvName}</div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-full bg-neutral-800/60 text-xs text-neutral-500 border border-neutral-700 border-dashed">No CV uploaded</div>
                                    )}
                                    {transcriptName ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300"><CheckCircle2Icon className="w-3 h-3" />TRANSCRIPT: {transcriptName}</div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-full bg-neutral-800/60 text-xs text-neutral-500 border border-neutral-700 border-dashed">No Transcript uploaded</div>
                                    )}
                                </div>
                            </div>
                            <div className="pt-4 border-t border-neutral-800 space-y-2">
                                <label htmlFor="referral-source" className="text-xs text-neutral-500 uppercase font-bold">
                                    {t("referralQuestion")} <span className="text-orange-400">*</span>
                                </label>
                                <select
                                    id="referral-source"
                                    value={referralSource}
                                    onChange={(e) => setReferralSource(e.target.value)}
                                    className="w-full rounded-md border border-neutral-800 bg-neutral-950/50 px-3 py-2.5 text-sm text-neutral-200 focus:border-violet-500 focus:outline-none"
                                >
                                    <option value="" disabled>{t("referralPlaceholder")}</option>
                                    <option value="telegram_group">{t("referralTelegram")}</option>
                                    <option value="whatsapp_group">{t("referralWhatsapp")}</option>
                                    <option value="facebook_group">{t("referralFacebook")}</option>
                                    <option value="reddit">{t("referralReddit")}</option>
                                    <option value="tiktok_reels">{t("referralTiktok")}</option>
                                    <option value="friend">{t("referralFriend")}</option>
                                    <option value="other">{t("referralOther")}</option>
                                </select>
                            </div>
                        </div>
                    )}
                </CardContent>
                <div className="p-6 border-t border-neutral-800/50 flex justify-between gap-4">
                    <Button variant="ghost" onClick={() => setCurrentStep(prev => prev - 1)} disabled={currentStep === 1 || isSaving} className="text-neutral-400 hover:text-white">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />{t("prev")}
                    </Button>
                    {currentStep < 5 ? (
                        <Button onClick={handleNext}
                            disabled={isSaving || (currentStep === 4 && (!passportUrl || !cvUrl || isPassportUploading || isCvUploading))}
                            className="bg-violet-600 hover:bg-violet-700 text-white min-w-[120px] disabled:opacity-40 disabled:cursor-not-allowed">
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : (
                                <>{currentStep === 4 && (isPassportUploading || isCvUploading) ? "Uploading to Vault..." : t("next")}<ArrowRightIcon className="ml-2 h-4 w-4" /></>
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleComplete} disabled={isSaving || !referralSource} className="bg-gradient-to-r from-violet-600 to-violet-400 text-white px-8 hover:scale-[1.02] transition-all disabled:opacity-40">
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : t("complete")}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const [profileData, setProfileData] = useState<FullProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isLoaded } = useUser();

    const loadProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setProfileData(data);
            }
        } catch (err) {
            console.error("Failed to load profile:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoaded) return;
        loadProfile();
    }, [isLoaded]);

    if (!isLoaded || isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
        );
    }

    if (profileData?.isOnboardingComplete) {
        return <ProfileView profile={profileData} onRefresh={loadProfile} />;
    }

    return <OnboardingWizard />;
}
