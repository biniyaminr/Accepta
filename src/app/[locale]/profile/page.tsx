"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
    UserIcon, 
    GraduationCapIcon, 
    BriefcaseIcon, 
    CloudIcon, 
    CheckCircle2Icon,
    ArrowRightIcon,
    ArrowLeftIcon,
    Loader2
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { SuggestionInput } from "@/components/ui/SuggestionInput";

// Form schemas for each step
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

import { useAppStore } from "@/store/useAppStore";
import { useHasHydrated } from "@/hooks/useHasHydrated";

export default function OnboardingWizard() {
    const {
        step1Draft, setStep1Draft,
        step2Draft, setStep2Draft,
        step3Draft, setStep3Draft,
        resetOnboarding,
    } = useAppStore();

    const hasHydrated = useHasHydrated();
    const t = useTranslations("OnboardingWizard");
    const { user, isLoaded: isUserLoaded } = useUser();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadedDocs, setUploadedDocs] = useState<{ type: string, url: string, name: string }[]>([]);

    // Strict upload state for Cloud Vault (Step 4)
    const [passportUrl, setPassportUrl] = useState<string | null>(null);
    const [passportName, setPassportName] = useState<string | null>(null);
    const [cvUrl, setCvUrl] = useState<string | null>(null);
    const [cvName, setCvName] = useState<string | null>(null);
    const [isPassportUploading, setIsPassportUploading] = useState(false);
    const [isCvUploading, setIsCvUploading] = useState(false);

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

    // Load existing data
    useEffect(() => {
        if (!isUserLoaded) return;
        
        async function loadStepData() {
            setIsLoading(true);
            try {
                // Fetch for each mapped step to pre-fill
                const res1 = await fetch("/api/onboarding/step?step=1");
                if (res1.ok) {
                    const data = await res1.json();
                    form1.reset(data);
                }
                const res2 = await fetch("/api/onboarding/step?step=2");
                if (res2.ok) {
                    const data = await res2.json();
                    form2.reset(data);
                }
                const res3 = await fetch("/api/onboarding/step?step=3");
                if (res3.ok) {
                    const data = await res3.json();
                    if (data.experiences?.length > 0) {
                        form3.reset(data);
                    }
                }
                const res4 = await fetch("/api/onboarding/step?step=4");
                if (res4.ok) {
                    const data = await res4.json();
                    const docs: { type: string, url: string, name: string }[] = data.documents || [];
                    setUploadedDocs(docs);
                    // Restore strict URL state from previously saved uploads
                    const savedPassport = docs.find(d => d.type === 'PASSPORT');
                    const savedCv = docs.find(d => d.type === 'RESUME');
                    if (savedPassport) { setPassportUrl(savedPassport.url); setPassportName(savedPassport.name); }
                    if (savedCv) { setCvUrl(savedCv.url); setCvName(savedCv.name); }
                }
            } catch (err) {
                console.error("Load error:", err);
            } finally {
                setIsLoading(false);
            }
        }
        loadStepData();
    }, [isUserLoaded, form1, form2, form3]);

    // --- DRAFT PERSISTENCE ---
    useEffect(() => {
        const sub1 = form1.watch((val) => setStep1Draft(val));
        const sub2 = form2.watch((val) => setStep2Draft(val));
        const sub3 = form3.watch((val) => setStep3Draft(val));
        return () => {
            sub1.unsubscribe();
            sub2.unsubscribe();
            sub3.unsubscribe();
        };
    }, [form1, form2, form3, setStep1Draft, setStep2Draft, setStep3Draft]);

    // Apply drafts on mount (merging with server data)
    useEffect(() => {
        if (hasHydrated) {
            if (step1Draft) form1.reset({ ...form1.getValues(), ...step1Draft });
            if (step2Draft) form2.reset({ ...form2.getValues(), ...step2Draft });
            if (step3Draft) form3.reset({ ...form3.getValues(), ...step3Draft });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasHydrated]);

    const handleNext = async () => {
        let isValid = false;
        let data = {};

        if (currentStep === 1) {
            isValid = await form1.trigger();
            data = form1.getValues();
        } else if (currentStep === 2) {
            isValid = await form2.trigger();
            data = form2.getValues();
        } else if (currentStep === 3) {
            isValid = await form3.trigger();
            data = form3.getValues();
        } else if (currentStep === 4) {
             if (!passportUrl || !cvUrl) {
                 toast.error("Missing Documents", { description: "Please upload both Passport/ID and CV to your vault." });
                 return;
             }
             isValid = true;
             // Build docs from strict URL state, not stale array
             data = { documents: [
                 { type: 'PASSPORT', fileUrl: passportUrl, name: passportName || 'passport' },
                 { type: 'RESUME',   fileUrl: cvUrl,       name: cvName   || 'cv'        },
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
                
                if (res.ok) {
                    setCurrentStep(prev => prev + 1);
                } else {
                    throw new Error("Save failed");
                }
            } catch (err) {
                toast.error("Error", { description: "Failed to save progress." });
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/onboarding/complete", { method: "POST" });
            if (res.ok) {
                resetOnboarding(); // Clear drafts
                toast.success("Welcome aboard!", { description: "Onboarding complete. Entering Mission Control..." });
                router.push("/dashboard");
            } else {
                throw new Error("Completion failed");
            }
        } catch (err) {
            toast.error("Error", { description: "Failed to finalize onboarding." });
        } finally {
            setIsSaving(false);
        }
    };

    if (!hasHydrated || isLoading) {
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
            {/* Header & Progress */}
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-orange-400">
                        {t("title")}
                    </h1>
                    <p className="text-neutral-400 text-lg">
                        {t("description")}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="relative h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                        className="absolute h-full bg-gradient-to-r from-violet-600 via-violet-400 to-orange-400 transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                </div>

                {/* Step Icons */}
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

            {/* Step Content */}
            <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                
                <CardHeader>
                    <CardTitle className="text-2xl text-neutral-100 flex items-center gap-3">
                        {steps[currentStep - 1].title}
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                        {t(`step${currentStep}Desc` || "summaryDesc")}
                    </CardDescription>
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
                                                <SuggestionInput
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder="e.g. Software Engineering"
                                                    suggestions={[
                                                        'Software Engineering',
                                                        'Computer Science',
                                                        'Business Administration',
                                                        'Data Science',
                                                        'Nursing',
                                                        'Mechanical Engineering',
                                                        'Finance',
                                                        'Public Health',
                                                        'Information Technology',
                                                        'Architecture',
                                                        'Economics',
                                                        'Law',
                                                    ]}
                                                />
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
                                                    <SuggestionInput
                                                        value={field.value}
                                                        onChange={field.onChange}
                                                        placeholder="e.g. Research Assistant"
                                                        suggestions={[
                                                            'Software Engineering Intern',
                                                            'Research Assistant',
                                                            'Teaching Assistant',
                                                            'Lab Technician',
                                                            'Marketing Coordinator',
                                                            'Data Analyst Intern',
                                                            'Community Volunteer',
                                                            'Student Representative',
                                                            'Project Manager Intern',
                                                            'Healthcare Assistant',
                                                        ]}
                                                    />
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
                                                    <SuggestionInput
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        isMulti={true}
                                                        placeholder="e.g. React, Python, AWS..."
                                                        suggestions={getSkillsForRole(form3.watch(`experiences.${i}.role`) || "")}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                ))}
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => form3.setValue("experiences", [...form3.getValues("experiences"), { role: "", organization: "", description: "", techStack: "" }])}
                                >
                                    + Add Role
                                </Button>
                            </form>
                        </Form>
                    )}

                    {currentStep === 4 && (
                        <div className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* --- Passport / ID Upload --- */}
                                <div className={`space-y-4 p-6 rounded-2xl border-2 border-dashed transition-colors ${
                                    passportUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-violet-500/30 bg-violet-500/5'
                                } text-center`}>
                                    {passportUrl ? (
                                        <CheckCircle2Icon className="w-10 h-10 text-emerald-400 mx-auto" />
                                    ) : isPassportUploading ? (
                                        <Loader2 className="w-10 h-10 text-violet-400 mx-auto animate-spin" />
                                    ) : (
                                        <CloudIcon className="w-10 h-10 text-violet-400 mx-auto" />
                                    )}
                                    <div>
                                        <h3 className="font-bold text-neutral-200">{t("passport")}</h3>
                                        <p className="text-xs text-neutral-500">JPG, PNG, or PDF. Max 8MB.</p>
                                    </div>
                                    {passportUrl ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold justify-center">
                                                <CheckCircle2Icon className="w-4 h-4" /> Vaulted Successfully
                                            </div>
                                            <p className="text-xs text-neutral-600 truncate">{passportName}</p>
                                            <button
                                                className="text-xs text-violet-400 hover:underline"
                                                onClick={() => { setPassportUrl(null); setPassportName(null); }}
                                            >Replace</button>
                                        </div>
                                    ) : (
                                        <UploadButton
                                            endpoint="documentUploader"
                                            onUploadBegin={() => setIsPassportUploading(true)}
                                            onClientUploadComplete={(res: any[]) => {
                                                setIsPassportUploading(false);
                                                if (res && res[0]?.ufsUrl) {
                                                    setPassportUrl(res[0].ufsUrl);
                                                    setPassportName(res[0].name);
                                                    toast.success("Document securely vaulted.", { description: "Passport / ID uploaded." });
                                                }
                                            }}
                                            onUploadError={() => {
                                                setIsPassportUploading(false);
                                                toast.error("Upload failed. Please check your connection and try again.");
                                            }}
                                            className="ut-button:bg-violet-600 ut-label:text-violet-400"
                                        />
                                    )}
                                </div>

                                {/* --- CV / Resume Upload --- */}
                                <div className={`space-y-4 p-6 rounded-2xl border-2 border-dashed transition-colors ${
                                    cvUrl ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-orange-500/30 bg-orange-500/5'
                                } text-center`}>
                                    {cvUrl ? (
                                        <CheckCircle2Icon className="w-10 h-10 text-emerald-400 mx-auto" />
                                    ) : isCvUploading ? (
                                        <Loader2 className="w-10 h-10 text-orange-400 mx-auto animate-spin" />
                                    ) : (
                                        <CloudIcon className="w-10 h-10 text-orange-400 mx-auto" />
                                    )}
                                    <div>
                                        <h3 className="font-bold text-neutral-200">{t("cv")}</h3>
                                        <p className="text-xs text-neutral-500">PDF Format only. Max 8MB.</p>
                                    </div>
                                    {cvUrl ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold justify-center">
                                                <CheckCircle2Icon className="w-4 h-4" /> Vaulted Successfully
                                            </div>
                                            <p className="text-xs text-neutral-600 truncate">{cvName}</p>
                                            <button
                                                className="text-xs text-orange-400 hover:underline"
                                                onClick={() => { setCvUrl(null); setCvName(null); }}
                                            >Replace</button>
                                        </div>
                                    ) : (
                                        <UploadButton
                                            endpoint="documentUploader"
                                            onUploadBegin={() => setIsCvUploading(true)}
                                            onClientUploadComplete={(res: any[]) => {
                                                setIsCvUploading(false);
                                                if (res && res[0]?.ufsUrl) {
                                                    setCvUrl(res[0].ufsUrl);
                                                    setCvName(res[0].name);
                                                    toast.success("Document securely vaulted.", { description: "CV uploaded." });
                                                }
                                            }}
                                            onUploadError={() => {
                                                setIsCvUploading(false);
                                                toast.error("Upload failed. Please check your connection and try again.");
                                            }}
                                            className="ut-button:bg-orange-600 ut-label:text-orange-400"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Progress hint */}
                            {(!passportUrl || !cvUrl) && (
                                <p className="text-center text-xs text-neutral-500">
                                    Both documents are required to proceed. Your files are encrypted and stored securely.
                                </p>
                            )}
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-neutral-500 uppercase font-bold">{t("fullName")}</p>
                                    <p className="text-neutral-200">{form1.getValues("fullName")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-neutral-500 uppercase font-bold">{t("nationality")}</p>
                                    <p className="text-neutral-200">{form1.getValues("citizenship")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-neutral-500 uppercase font-bold">{t("institution")}</p>
                                    <p className="text-neutral-200">{form2.getValues("institutionName")}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-neutral-500 uppercase font-bold">{t("major")}</p>
                                    <p className="text-neutral-200">{form2.getValues("major")}</p>
                                </div>
                            </div>
                            <div className="space-y-4 pt-4 border-t border-neutral-800">
                                <p className="text-xs text-neutral-500 uppercase font-bold mb-2">Professional Experience</p>
                                {form3.getValues("experiences").map((exp, idx) => (
                                    <div key={idx} className="space-y-1 pl-4 border-l border-violet-500/30">
                                        <p className="text-sm font-bold text-neutral-200">{exp.role} @ {exp.organization}</p>
                                        {exp.techStack && (
                                            <p className="text-xs text-violet-400 font-medium italic">Skills: {exp.techStack}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-neutral-800">
                                <p className="text-xs text-neutral-500 uppercase font-bold mb-3">Attached Documents</p>
                                <div className="flex flex-wrap gap-2">
                                    {passportName ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-xs text-violet-300">
                                            <CheckCircle2Icon className="w-3 h-3" />
                                            PASSPORT: {passportName}
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-full bg-neutral-800/60 text-xs text-neutral-500 border border-neutral-700 border-dashed">
                                            No Passport / ID uploaded
                                        </div>
                                    )}
                                    {cvName ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-xs text-orange-300">
                                            <CheckCircle2Icon className="w-3 h-3" />
                                            CV: {cvName}
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-full bg-neutral-800/60 text-xs text-neutral-500 border border-neutral-700 border-dashed">
                                            No CV uploaded
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                <div className="p-6 border-t border-neutral-800/50 flex justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        disabled={currentStep === 1 || isSaving}
                        className="text-neutral-400 hover:text-white"
                    >
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        {t("prev")}
                    </Button>

                    {currentStep < 5 ? (
                        <Button
                            onClick={handleNext}
                            disabled={
                                isSaving ||
                                (currentStep === 4 && (!passportUrl || !cvUrl || isPassportUploading || isCvUploading))
                            }
                            className="bg-violet-600 hover:bg-violet-700 text-white min-w-[120px] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : (
                                <>
                                    {currentStep === 4 && (isPassportUploading || isCvUploading)
                                        ? "Uploading to Vault..."
                                        : t("next")
                                    }
                                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            disabled={isSaving}
                            className="bg-gradient-to-r from-violet-600 to-violet-400 text-white px-8 hover:scale-[1.02] transition-all"
                        >
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : t("complete")}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
