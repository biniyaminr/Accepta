"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Wand2, GraduationCap, Building, UploadCloud, Sparkles } from "lucide-react";
import { useReactToPrint } from "react-to-print";

import { useAppStore } from "@/store/useAppStore";

export default function ResumeBuilder() {
    const {
        targetProgram, setTargetProgram,
        targetUniversity, setTargetUniversity,
        tailoredSummary, setTailoredSummary,
        tailoredExperience, setTailoredExperience,
        tailoredSkills, setTailoredSkills,
        uploadedFileName, setUploadedFileName,
        resetCVMaker
    } = useAppStore();

    const [resumeData, setResumeData] = useState<any>(null);
    const [educationList, setEducationList] = useState<any[]>([]);

    const [isTailoring, setIsTailoring] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cvRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch base profile data on load
        fetch("/api/resume-data")
            .then(res => {
                if (!res.ok && res.status !== 404) throw new Error("Failed to fetch");
                return res.json();
            })
            .then(data => {
                if (data.id) {
                    setResumeData(data);
                    setEducationList(data.educations || []);
                } else {
                    // Handle null profiles gracefully
                    setResumeData({
                        fullName: "Your Name",
                        email: "email@example.com",
                        phone: "Phone",
                        address: "Address",
                        city: "City",
                        country: "Country",
                        extracurriculars: []
                    });
                    setEducationList([]);
                }
            })
            .catch(err => {
                console.error("Error fetching resume data", err);
                // Fallback to empty state on error so it doesn't spin forever
                setResumeData({
                    fullName: "Your Name",
                    email: "email@example.com",
                    extracurriculars: []
                });
            });
    }, []);

    const handleTailor = async () => {
        if (!targetProgram || !targetUniversity) {
            alert("Please fill in both Target Program and Target University.");
            return;
        }

        if (!selectedFile) {
            alert("Please upload a CV PDF to use the new Model Chaining pipeline.");
            return;
        }

        setIsTailoring(true);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("targetProgram", targetProgram);
            formData.append("targetUniversity", targetUniversity);

            const res = await fetch("/api/tailor-resume", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const dataText = await res.text();
                try {
                    const parsedData = JSON.parse(dataText);
                    console.log("Parsed AI Data:", parsedData);

                    if (parsedData.fullName || parsedData.email) {
                        setResumeData({
                            ...resumeData,
                            fullName: parsedData.fullName || resumeData?.fullName,
                            email: parsedData.email || resumeData?.email,
                            phone: parsedData.phone || resumeData?.phone,
                            address: parsedData.location || resumeData?.address,
                            extracurriculars: parsedData.experience || []
                        });
                    }

                    setTailoredSummary(parsedData.professionalSummary || parsedData.summary || "");
                    
                    if (parsedData.education && Array.isArray(parsedData.education) && parsedData.education.length > 0) {
                        setEducationList(parsedData.education);
                    } else if (parsedData.educations && Array.isArray(parsedData.educations) && parsedData.educations.length > 0) {
                        setEducationList(parsedData.educations);
                    }

                    setTailoredExperience(parsedData.experience || parsedData.extracurriculars || []);
                    setTailoredSkills(parsedData.skills || []);
                } catch (e) {
                    console.error("Failed to parse JSON API response:", e, dataText);
                    alert("The AI returned improperly formatted data. Please try again.");
                }
            } else {
                const errText = await res.text();
                console.error("Tailor API Error:", errText);
                alert(`Tailoring failed: ${errText}`);
            }
        } catch (error: any) {
            console.error("Tailoring failed", error);
            alert(`Network error: ${error.message}`);
        } finally {
            setIsTailoring(false);
        }
    };

    const handleDownloadPdf = useReactToPrint({
        contentRef: cvRef,
        documentTitle: `${resumeData?.fullName ? resumeData.fullName.replace(/\\s+/g, '_') : 'Tailored'}_Resume`,
        pageStyle: `
          @page { size: letter portrait; margin: 0.5in; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `,
    }) as unknown as () => void;

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") {
            alert("Please upload a valid PDF file.");
            return;
        }
        setUploadedFileName(file.name);
        setSelectedFile(file);
    };

    if (!resumeData) {
        return (
            <div className="flex-1 flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="flex-1 p-4 sm:p-8 flex flex-col lg:flex-row gap-8 print:p-0 print:m-0 print:bg-white print:text-black min-h-screen">
            <style dangerouslySetInnerHTML={{ __html: `@media print { @page { margin: 0 !important; } body { -webkit-print-color-adjust: exact; padding: 1cm !important; } }` }} />

            {/* Left Panel: Controls */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col gap-6 print:hidden">
                <Card className="bg-neutral-900/50 backdrop-blur-xl border-neutral-800 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-neutral-100 to-neutral-400">
                            AI CV Maker
                        </CardTitle>
                        <CardDescription className="text-neutral-400">
                            Dynamically tailor your resume content to align perfectly with your target university program.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300 ml-1">Target Program</label>
                                    <div className="relative">
                                        <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                                        <input
                                            placeholder="e.g. Computer Science"
                                            value={targetProgram}
                                            onChange={(e) => setTargetProgram(e.target.value)}
                                            className="w-full pl-10 pr-3 h-12 rounded-md bg-zinc-900 border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-300 ml-1">Target University</label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                                        <input
                                            placeholder="e.g. Stanford"
                                            value={targetUniversity}
                                            onChange={(e) => setTargetUniversity(e.target.value)}
                                            className="w-full pl-10 pr-3 h-12 rounded-md bg-zinc-900 border border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-300 ml-1">Upload Existing CV (Optional)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed transition-all cursor-pointer ${uploadedFileName
                                        ? "border-emerald-500/50 bg-emerald-500/5"
                                        : "border-zinc-700 hover:border-violet-500 hover:bg-zinc-800/50"
                                        }`}
                                >
                                    <UploadCloud className={`w-7 h-7 ${uploadedFileName ? "text-emerald-400" : "text-neutral-500"}`} />
                                    {uploadedFileName ? (
                                        <span className="text-sm font-medium text-emerald-400 px-2 text-center break-all">{uploadedFileName}</span>
                                    ) : (
                                        <>
                                            <span className="text-sm font-medium text-neutral-300">Click to upload your existing CV</span>
                                            <span className="text-xs text-neutral-500">PDF (Max 5MB)</span>
                                        </>
                                    )}
                                </button>
                                {selectedFile && <p className="text-sm text-green-500 mt-2">✓ File attached: {selectedFile.name}</p>}
                            </div>
                        </div>

                        <Button
                            onClick={handleTailor}
                            disabled={isTailoring || !targetProgram || !targetUniversity}
                            className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTailoring ? (
                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Tailoring with AI...</>
                            ) : (
                                <><Sparkles className="mr-2 h-5 w-5" /> Tailor with AI</>
                            )}
                        </Button>

                        <div className="pt-4 border-t border-neutral-800">
                            <Button
                                onClick={() => handleDownloadPdf()}
                                disabled={isExporting}
                                variant="outline"
                                className="w-full h-12 border-neutral-700 hover:bg-neutral-800 text-neutral-100 transition-all"
                            >
                                {isExporting ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating PDF...</>
                                ) : (
                                    <><Download className="mr-2 h-4 w-4" /> Download PDF</>
                                )}
                            </Button>
                            
                            <Button
                                onClick={() => {
                                    if (confirm("Are you sure you want to clear this CV session? This will reset all tailored content.")) {
                                        resetCVMaker();
                                        window.location.reload();
                                    }
                                }}
                                variant="ghost"
                                size="sm"
                                className="w-full text-neutral-500 hover:text-red-400 hover:bg-red-400/5 transition-all text-xs"
                            >
                                Reset CV Session
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Panel: A4 Live Preview */}
            <div className="w-full lg:w-2/3 xl:w-3/4 flex justify-center py-6 lg:py-10 overflow-x-auto relative print:p-0 print:m-0 print:block">
                {/* The A4 Paper using native CSS Zoom */}
                <div ref={cvRef} className="w-[800px] min-h-[1130px] bg-white shadow-2xl p-10 lg:p-12 mx-auto max-sm:[zoom:0.43] sm:[zoom:0.8] lg:[zoom:1] print:[zoom:1] text-black font-sans box-border print:p-0">

                    {/* Header */}
                    <div className="border-b-2 border-neutral-800 pb-4 lg:pb-6 mb-6">
                        <h1 contentEditable={true} suppressContentEditableWarning={true} className="text-4xl lg:text-5xl font-bold uppercase tracking-wider text-neutral-900 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">{resumeData.fullName}</h1>
                        <div className="flex gap-4 text-sm text-neutral-600 mt-3 font-medium">
                            <span contentEditable={true} suppressContentEditableWarning={true} className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">{resumeData.email}</span>
                            {resumeData.phone && <span contentEditable={true} suppressContentEditableWarning={true} className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">• {resumeData.phone}</span>}
                            {resumeData.address && <span contentEditable={true} suppressContentEditableWarning={true} className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">• {resumeData.address}, {resumeData.city}, {resumeData.country}</span>}
                        </div>
                    </div>

                    {/* Summary */}
                    {tailoredSummary && (
                        <div className="mb-6">
                            <h2 className="text-lg font-bold uppercase tracking-widest text-neutral-800 mb-2 border-b border-neutral-300 pb-1">Professional Summary</h2>
                            <p contentEditable={true} suppressContentEditableWarning={true} className="text-sm text-neutral-700 leading-relaxed hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-1 -ml-1">{tailoredSummary}</p>
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
                                            <span contentEditable={true} suppressContentEditableWarning={true} className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">
                                                {edu.institutionName || edu.institution}
                                            </span>
                                            <span contentEditable={true} suppressContentEditableWarning={true} className="text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">
                                                {edu.date ? edu.date : edu.startDate
                                                    ? `${new Date(edu.startDate).getFullYear()} - ${edu.gradDate ? new Date(edu.gradDate).getFullYear() : 'Present'}`
                                                    : ''}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-baseline text-sm mt-1">
                                            <span contentEditable={true} suppressContentEditableWarning={true} className="italic text-neutral-700 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">
                                                {edu.degree}{edu.location ? `, ${edu.location}` : edu.city ? `, ${edu.city}` : ''}{edu.country && !edu.location ? `, ${edu.country}` : ''}
                                            </span>
                                            {edu.gpa && <span contentEditable={true} suppressContentEditableWarning={true} className="font-semibold text-neutral-800 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">GPA: {edu.gpa}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Extracurriculars / Experience */}
                    {(tailoredExperience.length > 0 || resumeData.extracurriculars?.length > 0) && (
                        <div className="mb-8">
                            <h2 className="text-lg font-bold uppercase tracking-widest text-neutral-800 mb-4 border-b border-neutral-300 pb-1">Experience & Activities</h2>
                            <div className="space-y-6">
                                {(tailoredExperience.length > 0 ? tailoredExperience : resumeData.extracurriculars).map((ex: any, i: number) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-baseline font-bold text-neutral-900">
                                            <span contentEditable={true} suppressContentEditableWarning={true} className="hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1 -ml-1">{ex.role} <span className="font-normal text-neutral-500">at</span> {ex.organization || ex.company}</span>
                                            <span contentEditable={true} suppressContentEditableWarning={true} className="text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 px-1">
                                                {ex.startDate
                                                    ? `${new Date(ex.startDate).getFullYear()} - ${ex.endDate ? new Date(ex.endDate).getFullYear() : 'Present'}`
                                                    : ex.date?.toString() || ''}
                                            </span>
                                        </div>

                                        {/* AI Tailored specific output rendering */}
                                        <ul className="list-disc list-outside ml-4 mt-2 text-sm text-neutral-700 space-y-1">
                                            {ex.bullets ? ex.bullets.map((point: string, idx: number) => (
                                                <li key={idx} contentEditable={true} suppressContentEditableWarning={true} className="leading-relaxed pl-1 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-0.5 -ml-1">{point}</li>
                                            )) : (ex.description || '').split('\n').filter((p: string) => p.trim() !== '').map((point: string, idx: number) => (
                                                <li key={idx} contentEditable={true} suppressContentEditableWarning={true} className="leading-relaxed pl-1 hover:bg-neutral-100 transition-colors rounded outline-none focus:ring-1 focus:ring-blue-500/50 p-0.5 -ml-1">{point.replace(/^[-•]\s*/, '')}</li>
                                            ))}
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
                                    <span key={i} contentEditable={true} suppressContentEditableWarning={true} className="text-sm font-medium text-neutral-700 bg-neutral-100/80 px-3 py-1.5 rounded-sm border border-neutral-200 hover:bg-neutral-200 transition-colors outline-none focus:ring-1 focus:ring-blue-500/50">{skill}</span>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
