"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ClockIcon, CheckCircle2Icon, AlertCircleIcon, FileIcon, PlusIcon, UserIcon, GraduationCapIcon, BriefcaseIcon, BookOpenIcon, ShieldIcon } from "lucide-react";
import { toast } from "sonner";
import { ExpiryAlerts } from "@/components/dashboard/ExpiryAlerts";
import { captureOnce } from "@/lib/analytics";

export function DashboardContent() {
    const t = useTranslations("Dashboard");
    const tPlan = useTranslations("Plan");
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Chapa's verify route redirects back here with ?payment=success|failed
    useEffect(() => {
        const payment = searchParams.get("payment");
        if (!payment) return;
        if (payment === "success") {
            toast.success(tPlan("paymentSuccessTitle"), { description: tPlan("paymentSuccessDesc") });
        } else {
            toast.error(tPlan("paymentFailedTitle"), { description: tPlan("paymentFailedDesc") });
        }
        router.replace(pathname, { scroll: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);
    const [applications, setApplications] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    // Form State
    const [universityName, setUniversityName] = useState("");
    const [programName, setProgramName] = useState("");
    const [deadline, setDeadline] = useState("");
    const [portalUrl, setPortalUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            const [appsRes, docsRes, profileRes] = await Promise.all([
                fetch('/api/applications'),
                fetch('/api/documents'),
                fetch('/api/profile')
            ]);

            if (appsRes.ok) setApplications(await appsRes.json());
            if (docsRes.ok) setDocuments(await docsRes.json());
            if (profileRes.ok) setProfile(await profileRes.json());
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/applications', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ universityName, programName, deadline, portalUrl })
            });

            if (!res.ok) {
                const error = await res.json();
                toast.error(error.error || "Failed to create application");
                return;
            }

            toast.success("Application created successfully!");
            setIsDialogOpen(false);
            setUniversityName("");
            setProgramName("");
            setDeadline("");
            setPortalUrl("");
            fetchData();
        } catch (error) {
            toast.error("Network error creating application");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Derived State
    const totalApps = applications.length;
    const submittedApps = applications.filter(a => a.status === 'SUBMITTED').length;
    const completionRate = totalApps === 0 ? 0 : Math.round((submittedApps / totalApps) * 100);

    // Nearest Deadline
    const futureDeads = applications.filter(a => new Date(a.deadline) > new Date()).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    const nextDeadline = futureDeads.length > 0 ? futureDeads[0] : null;
    const nextDeadDays = nextDeadline ? Math.ceil((new Date(nextDeadline.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : null;

    // Progress Pipeline
    const inProgress = applications.filter(a => a.status === 'IN_PROGRESS').length;
    const ready = applications.filter(a => a.status === 'READY').length;
    const notStarted = applications.filter(a => a.status === 'NOT_STARTED').length;

    // Profile Completion Score
    const completionChecks = [
        {
            key: 'identity',
            label: t('identity'),
            icon: UserIcon,
            done: !!(profile?.fullName && profile?.dob && profile?.citizenship),
            href: '/profile',
            fix: 'Add name, DOB & nationality',
        },
        {
            key: 'education',
            label: t('education'),
            icon: GraduationCapIcon,
            done: (profile?.educations?.length ?? 0) > 0,
            href: '/profile',
            fix: 'Add your institution & major',
        },
        {
            key: 'experience',
            label: t('experience'),
            icon: BriefcaseIcon,
            done: (profile?.extracurriculars?.length ?? 0) > 0,
            href: '/profile',
            fix: 'Add a role or activity',
        },
        {
            key: 'scores',
            label: t('testScores'),
            icon: BookOpenIcon,
            done: (profile?.testScores?.length ?? 0) > 0,
            href: '/profile',
            fix: 'Add IELTS, SAT or other score',
        },
        {
            key: 'documents',
            label: t('coreDocuments'),
            icon: ShieldIcon,
            done: !!(
                profile?.documents?.some((d: any) => d.type === 'PASSPORT') &&
                profile?.documents?.some((d: any) => d.type === 'RESUME')
            ),
            href: '/documents',
            fix: 'Upload Passport & CV',
        },
    ];
    const profileScore = completionChecks.filter(c => c.done).length * 20;
    const profileScoreColor = profileScore < 40 ? '#f97316' : profileScore < 80 ? '#eab308' : '#22c55e';

    // Fire once per user when Profile Strength first reaches 100%.
    useEffect(() => {
        if (profile?.id && profileScore === 100) {
            captureOnce(`profile_completed_${profile.id}`, "profile_completed");
        }
    }, [profile?.id, profileScore]);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-col gap-1.5">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">{t("missionControl")}</h2>
                    <p className="text-neutral-400 text-sm sm:text-base">{t("overview")}</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-lg shadow-violet-950/40">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            {t("newApplication")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-neutral-100">
                        <DialogHeader>
                            <DialogTitle>{t("addNewApplication")}</DialogTitle>
                            <DialogDescription className="text-neutral-400">
                                {t("addNewApplicationDesc")}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateApplication} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="universityName" className="text-neutral-300">{t("universityName")}</Label>
                                <Input id="universityName" value={universityName} onChange={e => setUniversityName(e.target.value)} required placeholder="e.g. Stanford University" className="bg-neutral-950/50 border-neutral-800 text-neutral-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="programName" className="text-neutral-300">{t("programMajor")}</Label>
                                <Input id="programName" value={programName} onChange={e => setProgramName(e.target.value)} required placeholder="e.g. Computer Science, BS" className="bg-neutral-950/50 border-neutral-800 text-neutral-200" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline" className="text-neutral-300">{t("applicationDeadline")}</Label>
                                <Input id="deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required className="bg-neutral-950/50 border-neutral-800 text-neutral-200 [color-scheme:dark]" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="portalUrl" className="text-neutral-300">{t("portalUrl")}</Label>
                                <Input id="portalUrl" type="url" value={portalUrl} onChange={e => setPortalUrl(e.target.value)} placeholder="https://apply.university.edu" className="bg-neutral-950/50 border-neutral-800 text-neutral-200" />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                                    {isSubmitting ? t("saving") : t("createApplication")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="bg-neutral-900/40 border-white/[0.06] hover:border-indigo-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden group transition-colors duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[13px] font-medium text-neutral-400">{t("totalApplications")}</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20 flex items-center justify-center shrink-0">
                            <AlertCircleIcon className="w-4 h-4 text-indigo-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-100 tracking-tight tabular-nums">{totalApps}</div>
                        <p className="text-xs text-neutral-500 mt-1">{t("activeDeadlines", { count: futureDeads.length })}</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 border-white/[0.06] hover:border-emerald-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden group transition-colors duration-300">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[13px] font-medium text-neutral-400">{t("submitted")}</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 ring-1 ring-inset ring-emerald-500/20 flex items-center justify-center shrink-0">
                            <CheckCircle2Icon className="w-4 h-4 text-emerald-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-neutral-100 tracking-tight tabular-nums">{submittedApps}</div>
                        <p className="text-xs text-neutral-500 mt-1">{t("completionRate", { rate: completionRate })}</p>
                    </CardContent>
                </Card>

                <Card className="bg-neutral-900/40 backdrop-blur-sm shadow-xl relative overflow-hidden group border-amber-500/25 transition-colors duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.07] to-transparent" />
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[13px] font-medium text-amber-200/90">{t("nextDeadline")}</CardTitle>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 ring-1 ring-inset ring-amber-500/20 flex items-center justify-center shrink-0">
                            <ClockIcon className="w-4 h-4 text-amber-400" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-100 tracking-tight tabular-nums">
                            {nextDeadDays !== null ? t("days", { count: nextDeadDays }) : "-"}
                        </div>
                        <p className="text-xs text-amber-400/80 mt-1 truncate">
                            {nextDeadline ? nextDeadline.universityName : t("noUpcomingDeadlines")}
                        </p>
                    </CardContent>
                </Card>

                <Link href="/documents" className="block focus:outline-none focus:ring-2 focus:ring-violet-500/50 rounded-xl">
                    <Card className="bg-neutral-900/40 border-white/[0.06] hover:border-blue-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden group cursor-pointer h-full transition-colors duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-[13px] font-medium text-neutral-400">{t("documents")}</CardTitle>
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 ring-1 ring-inset ring-blue-500/20 flex items-center justify-center shrink-0">
                                <FileIcon className="w-4 h-4 text-blue-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-neutral-100 tracking-tight tabular-nums">{documents.length}</div>
                            <p className="text-xs text-neutral-500 mt-1">{t("uploadedToVault")}</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Profile Completion Score */}
            <Card className="bg-neutral-900/40 border-neutral-800/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-orange-500/5 pointer-events-none" />
                <CardHeader className="pb-4">
                    <CardTitle className="text-neutral-200">{t("profileStrength")}</CardTitle>
                    <CardDescription className="text-neutral-400">
                        {t("profileStrengthDesc")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Ring */}
                        <div className="relative shrink-0">
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle cx="60" cy="60" r="50" fill="none" stroke="#262626" strokeWidth="10" />
                                <circle
                                    cx="60" cy="60" r="50" fill="none"
                                    stroke={profileScoreColor}
                                    strokeWidth="10"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 50}`}
                                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - profileScore / 100)}`}
                                    transform="rotate(-90 60 60)"
                                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-neutral-100">{profileScore}%</span>
                                <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{t("complete")}</span>
                            </div>
                        </div>
                        {/* Checklist */}
                        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {completionChecks.map((check) => (
                                <div
                                    key={check.key}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                                        check.done
                                            ? 'border-emerald-500/20 bg-emerald-500/5'
                                            : 'border-orange-500/20 bg-orange-500/5'
                                    }`}
                                >
                                    <check.icon className={`w-4 h-4 shrink-0 ${check.done ? 'text-emerald-400' : 'text-orange-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold ${check.done ? 'text-emerald-300' : 'text-neutral-200'}`}>
                                            {check.label}
                                        </p>
                                        {!check.done && (
                                            <Link href={check.href} className="text-[10px] text-orange-400 hover:text-orange-300 hover:underline">
                                                {check.fix} →
                                            </Link>
                                        )}
                                    </div>
                                    {check.done ? (
                                        <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                                    ) : (
                                        <AlertCircleIcon className="w-4 h-4 text-orange-400 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Document & Test Expiry Alerts */}
            <ExpiryAlerts />

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1 bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-neutral-200">{t("applicationProgress")}</CardTitle>
                        <CardDescription className="text-neutral-400">{t("applicationProgressDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-300">{t("inProgress")}</span>
                                <span className="font-medium text-neutral-100">{inProgress}</span>
                            </div>
                            <Progress value={totalApps ? (inProgress / totalApps) * 100 : 0} className="h-2 bg-neutral-800" indicatorClass="bg-blue-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-300">{t("ready")}</span>
                                <span className="font-medium text-neutral-100">{ready}</span>
                            </div>
                            <Progress value={totalApps ? (ready / totalApps) * 100 : 0} className="h-2 bg-neutral-800" indicatorClass="bg-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-300">{t("notStarted")}</span>
                                <span className="font-medium text-neutral-100">{notStarted}</span>
                            </div>
                            <Progress value={totalApps ? (notStarted / totalApps) * 100 : 0} className="h-2 bg-neutral-800" indicatorClass="bg-neutral-500" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-neutral-300">{t("submitted")}</span>
                                <span className="font-medium text-neutral-100">{submittedApps}</span>
                            </div>
                            <Progress value={totalApps ? (submittedApps / totalApps) * 100 : 0} className="h-2 bg-neutral-800" indicatorClass="bg-emerald-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1 bg-neutral-900/40 border-border/50 backdrop-blur-sm shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-neutral-200">{t("upcomingDeadlines")}</CardTitle>
                        <CardDescription className="text-neutral-400">{t("upcomingDeadlinesDesc")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {futureDeads.length > 0 ? (
                                futureDeads.slice(0, 3).map((app, i) => {
                                    const daysLeft = Math.ceil((new Date(app.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                    return (
                                        <div key={app.id || i} className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/30 border border-neutral-800/50 hover:bg-neutral-800/50 transition-colors">
                                            <div>
                                                <p className="font-medium text-neutral-200">{app.universityName}</p>
                                                <p className="text-xs text-neutral-500">{app.programName}</p>
                                            </div>
                                            <Badge variant="outline" className={
                                                daysLeft < 7 ? "text-red-400 border-red-400/30 bg-red-400/10" :
                                                    daysLeft < 15 ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
                                                        "text-indigo-400 border-indigo-400/30 bg-indigo-400/10"
                                            }>{t("days", { count: daysLeft })}</Badge>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-6 text-neutral-500 text-sm">
                                    {t("noDeadlinesMessage")}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
