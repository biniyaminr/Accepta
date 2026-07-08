"use client";

import React from "react";

export interface ResumeTemplateProps {
    resumeData: any;
    tailoredSummary: string;
    educationList: any[];
    tailoredExperience: any[];
    tailoredSkills: string[];
}

// Helper to render education date
function eduDate(edu: any): string {
    if (edu.date) return edu.date;
    if (edu.startDate) {
        const start = new Date(edu.startDate).getFullYear();
        const end = edu.gradDate ? new Date(edu.gradDate).getFullYear() : "Present";
        return `${start} - ${end}`;
    }
    return "";
}

// Helper to render experience date
function expDate(ex: any): string {
    if (ex.startDate) {
        const start = new Date(ex.startDate).getFullYear();
        const end = ex.endDate ? new Date(ex.endDate).getFullYear() : "Present";
        return `${start} - ${end}`;
    }
    return ex.date?.toString() || "";
}

// Helper to render experience bullets
function renderBullets(ex: any) {
    if (ex.bullets) {
        return ex.bullets.map((point: string, idx: number) => (
            <li key={idx} contentEditable suppressContentEditableWarning className="leading-relaxed pl-1 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-0.5 -ml-1">{point}</li>
        ));
    }
    return (ex.description || "").split("\n").filter((p: string) => p.trim() !== "").map((point: string, idx: number) => (
        <li key={idx} contentEditable suppressContentEditableWarning className="leading-relaxed pl-1 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-0.5 -ml-1">{point.replace(/^[-\u2022]\s*/, "")}</li>
    ));
}

function eduLocation(edu: any): string {
    const loc = edu.location || edu.city || "";
    const country = edu.country && !edu.location ? `, ${edu.country}` : "";
    return loc ? `, ${loc}${country}` : country;
}

// ─── TEMPLATE 1: CLASSIC ───────────────────────────────────────────────────────
export function ClassicTemplate({ resumeData, tailoredSummary, educationList, tailoredExperience, tailoredSkills }: ResumeTemplateProps) {
    return (
        <div className="font-sans text-black">
            {/* Header */}
            <div className="border-b-2 border-neutral-800 pb-4 lg:pb-6 mb-6">
                <h1 contentEditable suppressContentEditableWarning className="text-4xl lg:text-5xl font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">{resumeData.fullName}</h1>
                <div className="flex gap-4 text-sm text-neutral-600 mt-3 font-medium">
                    <span contentEditable suppressContentEditableWarning className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">{resumeData.email}</span>
                    {resumeData.phone && <span contentEditable suppressContentEditableWarning className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">&bull; {resumeData.phone}</span>}
                    {resumeData.address && <span contentEditable suppressContentEditableWarning className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">&bull; {resumeData.address}, {resumeData.city}, {resumeData.country}</span>}
                </div>
            </div>

            {/* Summary */}
            {tailoredSummary && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold uppercase tracking-widest text-neutral-800 mb-2 border-b border-neutral-300 pb-1">Professional Summary</h2>
                    <p contentEditable suppressContentEditableWarning className="text-sm text-neutral-700 leading-relaxed hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-1 -ml-1">{tailoredSummary}</p>
                </div>
            )}

            {/* Education */}
            {educationList.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold uppercase tracking-widest text-neutral-800 mb-4 border-b border-neutral-300 pb-1">Education</h2>
                    <div className="space-y-4">
                        {educationList.map((edu: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline font-bold text-neutral-900">
                                    <span contentEditable suppressContentEditableWarning className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">
                                        {edu.institutionName || edu.institution}
                                    </span>
                                    <span contentEditable suppressContentEditableWarning className="text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">
                                        {eduDate(edu)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline text-sm mt-1">
                                    <span contentEditable suppressContentEditableWarning className="italic text-neutral-700 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">
                                        {edu.degree}{eduLocation(edu)}
                                    </span>
                                    {edu.gpa && <span contentEditable suppressContentEditableWarning className="font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">GPA: {edu.gpa}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Experience */}
            {(tailoredExperience.length > 0 || resumeData.extracurriculars?.length > 0) && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold uppercase tracking-widest text-neutral-800 mb-4 border-b border-neutral-300 pb-1">Experience & Activities</h2>
                    <div className="space-y-6">
                        {(tailoredExperience.length > 0 ? tailoredExperience : resumeData.extracurriculars).map((ex: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline font-bold text-neutral-900">
                                    <span contentEditable suppressContentEditableWarning className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">{ex.role} <span className="font-normal text-neutral-500">at</span> {ex.organization || ex.company}</span>
                                    <span contentEditable suppressContentEditableWarning className="text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">
                                        {expDate(ex)}
                                    </span>
                                </div>
                                <ul className="list-disc list-outside ml-4 mt-2 text-sm text-neutral-700 space-y-1">
                                    {renderBullets(ex)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills */}
            {tailoredSkills.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-bold uppercase tracking-widest text-neutral-800 mb-4 border-b border-neutral-300 pb-1">Skills</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {tailoredSkills.map((skill, i) => (
                            <span key={i} contentEditable suppressContentEditableWarning className="text-sm font-medium text-neutral-700 bg-neutral-100/80 px-3 py-1.5 rounded-sm border border-neutral-200 hover:bg-neutral-200 transition-colors outline-none focus:ring-1 focus:ring-blue-500/50">{skill}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── TEMPLATE 2: ACADEMIC ──────────────────────────────────────────────────────
export function AcademicTemplate({ resumeData, tailoredSummary, educationList, tailoredExperience, tailoredSkills }: ResumeTemplateProps) {
    return (
        <div className="font-serif text-neutral-900">
            {/* Header */}
            <div className="flex justify-between items-start pb-5 mb-5 border-b-2 border-neutral-700">
                <div>
                    <h1 contentEditable suppressContentEditableWarning className="text-4xl font-bold text-neutral-900 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">{resumeData.fullName}</h1>
                </div>
                <div className="text-right text-sm text-neutral-600 space-y-0.5">
                    <div contentEditable suppressContentEditableWarning className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">{resumeData.email}</div>
                    {resumeData.phone && <div contentEditable suppressContentEditableWarning className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">{resumeData.phone}</div>}
                    {resumeData.address && <div contentEditable suppressContentEditableWarning className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">{resumeData.address}, {resumeData.city}, {resumeData.country}</div>}
                </div>
            </div>

            {/* Education (first and emphasized) */}
            {educationList.length > 0 && (
                <div className="mb-6 pb-5 border-b border-neutral-300">
                    <h2 className="text-base font-bold uppercase tracking-wider text-neutral-800 mb-4">Education</h2>
                    <div className="space-y-5">
                        {educationList.map((edu: any, i: number) => (
                            <div key={i} className="pl-4 border-l-2 border-neutral-400">
                                <div className="font-bold text-neutral-900 text-base" contentEditable suppressContentEditableWarning>
                                    {edu.institutionName || edu.institution}
                                </div>
                                <div className="text-sm text-neutral-700 mt-0.5" contentEditable suppressContentEditableWarning>
                                    {edu.degree}{eduLocation(edu)}
                                </div>
                                <div className="flex justify-between text-sm text-neutral-600 mt-1">
                                    <span contentEditable suppressContentEditableWarning>{eduDate(edu)}</span>
                                    {edu.gpa && <span contentEditable suppressContentEditableWarning className="font-semibold">GPA: {edu.gpa}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Research & Publications (mapped from experience) */}
            {(tailoredExperience.length > 0 || resumeData.extracurriculars?.length > 0) && (
                <div className="mb-6 pb-5 border-b border-neutral-300">
                    <h2 className="text-base font-bold uppercase tracking-wider text-neutral-800 mb-4">Research & Publications</h2>
                    <div className="space-y-5">
                        {(tailoredExperience.length > 0 ? tailoredExperience : resumeData.extracurriculars).map((ex: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <span className="font-bold text-neutral-900" contentEditable suppressContentEditableWarning>{ex.role} <span className="font-normal text-neutral-500">&mdash;</span> {ex.organization || ex.company}</span>
                                    <span className="text-sm text-neutral-600" contentEditable suppressContentEditableWarning>{expDate(ex)}</span>
                                </div>
                                <ul className="list-disc list-outside ml-5 mt-2 text-sm text-neutral-700 space-y-1">
                                    {renderBullets(ex)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills */}
            {tailoredSkills.length > 0 && (
                <div className="mb-6 pb-5 border-b border-neutral-300">
                    <h2 className="text-base font-bold uppercase tracking-wider text-neutral-800 mb-3">Skills</h2>
                    <p contentEditable suppressContentEditableWarning className="text-sm text-neutral-700 leading-relaxed hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-1 -ml-1">
                        {tailoredSkills.join(" \u2022 ")}
                    </p>
                </div>
            )}

            {/* Summary at bottom */}
            {tailoredSummary && (
                <div className="mb-6">
                    <h2 className="text-base font-bold uppercase tracking-wider text-neutral-800 mb-3">Summary</h2>
                    <p contentEditable suppressContentEditableWarning className="text-sm text-neutral-700 leading-relaxed italic hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-1 -ml-1">{tailoredSummary}</p>
                </div>
            )}
        </div>
    );
}

// ─── TEMPLATE 3: MODERN ────────────────────────────────────────────────────────
export function ModernTemplate({ resumeData, tailoredSummary, educationList, tailoredExperience, tailoredSkills }: ResumeTemplateProps) {
    return (
        <div className="font-sans text-neutral-900 flex min-h-full">
            {/* Left Sidebar */}
            <div className="w-[30%] bg-neutral-800 text-white p-6 flex flex-col gap-6 print:bg-neutral-800 print:text-white" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                <div>
                    <h1 contentEditable suppressContentEditableWarning className="text-2xl font-bold leading-tight hover:bg-neutral-700 transition-colors rounded outline-none focus:ring-1 focus:ring-violet-400/50 px-1 -ml-1">{resumeData.fullName}</h1>
                    <div className="mt-3 space-y-1 text-xs text-neutral-300">
                        <div contentEditable suppressContentEditableWarning className="hover:bg-neutral-700 rounded px-1 -ml-1">{resumeData.email}</div>
                        {resumeData.phone && <div contentEditable suppressContentEditableWarning className="hover:bg-neutral-700 rounded px-1 -ml-1">{resumeData.phone}</div>}
                        {resumeData.address && <div contentEditable suppressContentEditableWarning className="hover:bg-neutral-700 rounded px-1 -ml-1">{resumeData.address}, {resumeData.city}, {resumeData.country}</div>}
                    </div>
                </div>

                {/* Skills with progress bars */}
                {tailoredSkills.length > 0 && (
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3">Skills</h2>
                        <div className="space-y-2.5">
                            {tailoredSkills.map((skill, i) => (
                                <div key={i}>
                                    <div className="text-xs text-neutral-200 mb-1" contentEditable suppressContentEditableWarning>{skill}</div>
                                    <div className="w-full bg-neutral-600 rounded-full h-1.5">
                                        <div className="bg-violet-400 h-1.5 rounded-full" style={{ width: `${Math.max(60, 100 - i * 8)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary */}
                {tailoredSummary && (
                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">Summary</h2>
                        <p contentEditable suppressContentEditableWarning className="text-xs text-neutral-300 leading-relaxed hover:bg-neutral-700 transition-colors rounded outline-none focus:ring-1 focus:ring-violet-400/50 p-1 -ml-1">{tailoredSummary}</p>
                    </div>
                )}
            </div>

            {/* Right Content */}
            <div className="w-[70%] bg-white p-6 flex flex-col gap-6">
                {/* Education with timeline */}
                {educationList.length > 0 && (
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-800 mb-4 pb-1 border-b-2 border-violet-500">Education</h2>
                        <div className="space-y-4 relative">
                            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-neutral-300" />
                            {educationList.map((edu: any, i: number) => (
                                <div key={i} className="pl-6 relative">
                                    <div className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full bg-violet-500 border-2 border-white" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold text-sm text-neutral-900" contentEditable suppressContentEditableWarning>{edu.institutionName || edu.institution}</span>
                                        <span className="text-xs text-neutral-500" contentEditable suppressContentEditableWarning>{eduDate(edu)}</span>
                                    </div>
                                    <div className="text-xs text-neutral-600 mt-0.5" contentEditable suppressContentEditableWarning>
                                        {edu.degree}{eduLocation(edu)}
                                    </div>
                                    {edu.gpa && <div className="text-xs text-neutral-500 mt-0.5" contentEditable suppressContentEditableWarning>GPA: {edu.gpa}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Experience with timeline */}
                {(tailoredExperience.length > 0 || resumeData.extracurriculars?.length > 0) && (
                    <div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-800 mb-4 pb-1 border-b-2 border-violet-500">Experience</h2>
                        <div className="space-y-5 relative">
                            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-neutral-300" />
                            {(tailoredExperience.length > 0 ? tailoredExperience : resumeData.extracurriculars).map((ex: any, i: number) => (
                                <div key={i} className="pl-6 relative">
                                    <div className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full bg-violet-500 border-2 border-white" />
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-bold text-sm text-neutral-900" contentEditable suppressContentEditableWarning>{ex.role} <span className="font-normal text-neutral-400">at</span> {ex.organization || ex.company}</span>
                                        <span className="text-xs text-neutral-500" contentEditable suppressContentEditableWarning>{expDate(ex)}</span>
                                    </div>
                                    <ul className="list-disc list-outside ml-4 mt-1.5 text-xs text-neutral-700 space-y-0.5">
                                        {renderBullets(ex)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── TEMPLATE 4: MINIMAL ───────────────────────────────────────────────────────
export function MinimalTemplate({ resumeData, tailoredSummary, educationList, tailoredExperience, tailoredSkills }: ResumeTemplateProps) {
    return (
        <div className="font-sans text-neutral-900">
            {/* Header */}
            <div className="mb-6">
                <h1 contentEditable suppressContentEditableWarning className="text-3xl font-light tracking-wide text-neutral-900 hover:bg-neutral-50 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">{resumeData.fullName}</h1>
                <hr className="border-neutral-300 mt-2 mb-2" />
                <div className="text-xs text-neutral-500 flex items-center gap-2 flex-wrap">
                    <span contentEditable suppressContentEditableWarning className="hover:bg-neutral-50 rounded px-1 -ml-1">{resumeData.email}</span>
                    {resumeData.phone && <><span className="text-neutral-300">|</span><span contentEditable suppressContentEditableWarning className="hover:bg-neutral-50 rounded px-1">{resumeData.phone}</span></>}
                    {resumeData.address && <><span className="text-neutral-300">|</span><span contentEditable suppressContentEditableWarning className="hover:bg-neutral-50 rounded px-1">{resumeData.address}, {resumeData.city}, {resumeData.country}</span></>}
                </div>
            </div>

            {/* Summary */}
            {tailoredSummary && (
                <div className="mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800 mb-2">Summary</h2>
                    <p contentEditable suppressContentEditableWarning className="text-sm text-neutral-600 leading-relaxed hover:bg-neutral-50 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-1 -ml-1">{tailoredSummary}</p>
                </div>
            )}

            {/* Experience */}
            {(tailoredExperience.length > 0 || resumeData.extracurriculars?.length > 0) && (
                <div className="mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800 mb-3">Experience</h2>
                    <div className="space-y-5">
                        {(tailoredExperience.length > 0 ? tailoredExperience : resumeData.extracurriculars).map((ex: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-neutral-900" contentEditable suppressContentEditableWarning>{ex.role} <span className="font-normal text-neutral-400">at</span> {ex.organization || ex.company}</span>
                                    <span className="text-xs text-neutral-400" contentEditable suppressContentEditableWarning>{expDate(ex)}</span>
                                </div>
                                <ul className="list-disc list-outside ml-4 mt-1 text-sm text-neutral-600 space-y-0.5">
                                    {renderBullets(ex)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {educationList.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800 mb-3">Education</h2>
                    <div className="space-y-3">
                        {educationList.map((edu: any, i: number) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-sm font-medium text-neutral-900" contentEditable suppressContentEditableWarning>{edu.institutionName || edu.institution}</span>
                                    <span className="text-xs text-neutral-400" contentEditable suppressContentEditableWarning>{eduDate(edu)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-neutral-500 mt-0.5">
                                    <span contentEditable suppressContentEditableWarning>{edu.degree}{eduLocation(edu)}</span>
                                    {edu.gpa && <span contentEditable suppressContentEditableWarning>GPA: {edu.gpa}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills as inline pills */}
            {tailoredSkills.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-800 mb-3">Skills</h2>
                    <div className="flex flex-wrap gap-1.5">
                        {tailoredSkills.map((skill, i) => (
                            <span key={i} contentEditable suppressContentEditableWarning className="text-xs text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full hover:bg-neutral-200 transition-colors outline-none focus:ring-1 focus:ring-blue-500/50">{skill}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── TEMPLATE SELECTOR ─────────────────────────────────────────────────────────

interface TemplateSelectorProps {
    selected: string;
    onSelect: (id: string) => void;
    translations: {
        chooseTemplate: string;
        classic: string;
        academic: string;
        modern: string;
        minimal: string;
    };
}

const TEMPLATES = [
    { id: "classic", color: "bg-violet-500" },
    { id: "academic", color: "bg-amber-600" },
    { id: "modern", color: "bg-cyan-500" },
    { id: "minimal", color: "bg-neutral-400" },
] as const;

function MiniPreviewClassic() {
    return (
        <div className="w-full h-full p-2 flex flex-col gap-1">
            <div className="w-10 h-2 bg-neutral-700 rounded-sm mx-auto" />
            <div className="w-14 h-1 bg-neutral-400 rounded-sm mx-auto" />
            <div className="border-b border-neutral-300 mt-0.5 mb-1" />
            <div className="w-full h-1 bg-neutral-300 rounded-sm" />
            <div className="w-3/4 h-1 bg-neutral-300 rounded-sm" />
            <div className="mt-1 w-8 h-1.5 bg-neutral-600 rounded-sm" />
            <div className="w-full h-1 bg-neutral-200 rounded-sm" />
            <div className="w-full h-1 bg-neutral-200 rounded-sm" />
            <div className="mt-1 w-8 h-1.5 bg-neutral-600 rounded-sm" />
            <div className="w-full h-1 bg-neutral-200 rounded-sm" />
            <div className="w-2/3 h-1 bg-neutral-200 rounded-sm" />
            <div className="mt-1 flex gap-1">
                <div className="w-4 h-1.5 bg-neutral-300 rounded-sm" />
                <div className="w-4 h-1.5 bg-neutral-300 rounded-sm" />
                <div className="w-4 h-1.5 bg-neutral-300 rounded-sm" />
            </div>
        </div>
    );
}

function MiniPreviewAcademic() {
    return (
        <div className="w-full h-full p-2 flex flex-col gap-1">
            <div className="flex justify-between items-start mb-1">
                <div className="w-10 h-2 bg-neutral-700 rounded-sm" />
                <div className="flex flex-col items-end gap-0.5">
                    <div className="w-6 h-0.5 bg-neutral-400 rounded-sm" />
                    <div className="w-5 h-0.5 bg-neutral-400 rounded-sm" />
                </div>
            </div>
            <div className="border-b-2 border-neutral-400 mb-1" />
            <div className="w-6 h-1 bg-amber-600 rounded-sm" />
            <div className="border-l-2 border-neutral-300 pl-1 ml-0.5">
                <div className="w-full h-0.5 bg-neutral-300 rounded-sm" />
                <div className="w-3/4 h-0.5 bg-neutral-200 rounded-sm mt-0.5" />
            </div>
            <div className="w-8 h-1 bg-amber-600 rounded-sm mt-1" />
            <div className="w-full h-0.5 bg-neutral-200 rounded-sm" />
            <div className="w-full h-0.5 bg-neutral-200 rounded-sm" />
            <div className="w-4 h-1 bg-amber-600 rounded-sm mt-1" />
            <div className="w-full h-0.5 bg-neutral-200 rounded-sm" />
        </div>
    );
}

function MiniPreviewModern() {
    return (
        <div className="w-full h-full flex">
            <div className="w-[30%] bg-neutral-700 p-1.5 flex flex-col gap-1 rounded-l-sm">
                <div className="w-full h-1.5 bg-neutral-400 rounded-sm" />
                <div className="w-3/4 h-0.5 bg-neutral-500 rounded-sm" />
                <div className="mt-1 w-full h-0.5 bg-cyan-400 rounded-sm" />
                <div className="w-full bg-neutral-600 rounded-full h-0.5"><div className="bg-cyan-400 h-0.5 rounded-full w-4/5" /></div>
                <div className="w-full bg-neutral-600 rounded-full h-0.5"><div className="bg-cyan-400 h-0.5 rounded-full w-3/5" /></div>
                <div className="w-full bg-neutral-600 rounded-full h-0.5"><div className="bg-cyan-400 h-0.5 rounded-full w-4/5" /></div>
            </div>
            <div className="w-[70%] p-1.5 flex flex-col gap-1">
                <div className="w-6 h-1 bg-neutral-600 rounded-sm border-b border-cyan-400" />
                <div className="flex gap-1 items-start">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-0.5">
                        <div className="w-full h-0.5 bg-neutral-300 rounded-sm" />
                        <div className="w-3/4 h-0.5 bg-neutral-200 rounded-sm" />
                    </div>
                </div>
                <div className="w-6 h-1 bg-neutral-600 rounded-sm border-b border-cyan-400 mt-1" />
                <div className="flex gap-1 items-start">
                    <div className="w-1 h-1 rounded-full bg-cyan-500 mt-0.5 shrink-0" />
                    <div className="flex-1 space-y-0.5">
                        <div className="w-full h-0.5 bg-neutral-300 rounded-sm" />
                        <div className="w-2/3 h-0.5 bg-neutral-200 rounded-sm" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function MiniPreviewMinimal() {
    return (
        <div className="w-full h-full p-2 flex flex-col gap-1">
            <div className="w-12 h-1.5 bg-neutral-400 rounded-sm" />
            <div className="border-b border-neutral-200 mb-0.5" />
            <div className="w-16 h-0.5 bg-neutral-300 rounded-sm" />
            <div className="mt-1.5 w-5 h-0.5 bg-neutral-500 rounded-sm" />
            <div className="w-full h-0.5 bg-neutral-200 rounded-sm" />
            <div className="w-3/4 h-0.5 bg-neutral-200 rounded-sm" />
            <div className="mt-1.5 w-6 h-0.5 bg-neutral-500 rounded-sm" />
            <div className="w-full h-0.5 bg-neutral-200 rounded-sm" />
            <div className="mt-1.5 w-5 h-0.5 bg-neutral-500 rounded-sm" />
            <div className="w-full h-0.5 bg-neutral-200 rounded-sm" />
            <div className="mt-1.5 flex gap-1">
                <div className="w-3 h-1 bg-neutral-200 rounded-full" />
                <div className="w-3 h-1 bg-neutral-200 rounded-full" />
                <div className="w-3 h-1 bg-neutral-200 rounded-full" />
            </div>
        </div>
    );
}

const MINI_PREVIEWS: Record<string, React.FC> = {
    classic: MiniPreviewClassic,
    academic: MiniPreviewAcademic,
    modern: MiniPreviewModern,
    minimal: MiniPreviewMinimal,
};

export function TemplateSelector({ selected, onSelect, translations }: TemplateSelectorProps) {
    const nameMap: Record<string, string> = {
        classic: translations.classic,
        academic: translations.academic,
        modern: translations.modern,
        minimal: translations.minimal,
    };

    return (
        <div className="mb-4">
            <h3 className="text-sm font-medium text-neutral-300 mb-3">{translations.chooseTemplate}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
                {TEMPLATES.map(({ id }) => {
                    const isSelected = selected === id;
                    const Preview = MINI_PREVIEWS[id];
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => onSelect(id)}
                            className={`shrink-0 w-[120px] rounded-lg overflow-hidden transition-all cursor-pointer ${
                                isSelected
                                    ? "ring-2 ring-violet-500 border-2 border-violet-500 shadow-lg shadow-violet-500/20"
                                    : "border-2 border-neutral-700 hover:border-neutral-500"
                            }`}
                        >
                            <div className="bg-white aspect-[210/297]">
                                <Preview />
                            </div>
                            <div className={`text-xs font-medium py-1.5 text-center ${isSelected ? "bg-violet-500/20 text-violet-300" : "bg-neutral-800 text-neutral-400"}`}>
                                {nameMap[id]}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// ─── TEMPLATE MAP ──────────────────────────────────────────────────────────────

export const TEMPLATE_COMPONENTS: Record<string, React.FC<ResumeTemplateProps>> = {
    classic: ClassicTemplate,
    academic: AcademicTemplate,
    modern: ModernTemplate,
    minimal: MinimalTemplate,
};
