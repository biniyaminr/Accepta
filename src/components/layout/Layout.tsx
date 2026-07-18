"use client";

import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingGuard } from "../auth/OnboardingGuard";
import { ExtensionSync } from "../extension/ExtensionSync";
import { DeadlineNotifications } from "./DeadlineNotifications";
import { PassExpiryBanner } from "./PassExpiryBanner";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const t = useTranslations("Sidebar");
    const isLandingPage = pathname === "/";

    const pageTitles: Record<string, string> = {
        "/dashboard": t("missionDashboard"),
        "/profile": t("masterProfile"),
        "/essays": t("aiEssays"),
        "/essay-review": t("essayReview"),
        "/letters": t("letters"),
        "/resume": t("aiCvMaker"),
        "/discover": t("discoverPrograms"),
        "/applications": t("applicationTracker"),
        "/interview-prep": t("interviewPrep"),
        "/recommendations": t("recommendations"),
        "/calendar": t("calendar"),
        "/analytics": t("analytics"),
        "/feed": t("liveFeed"),
        "/pricing": t("pricing"),
    };
    const pageTitle = pageTitles[pathname];

    if (isLandingPage) {
        return (
            <TooltipProvider>
                <div className="w-full min-h-screen">
                    {children}
                </div>
            </TooltipProvider>
        );
    }

    return (
        <TooltipProvider>
            <ExtensionSync />
            <OnboardingGuard>
                <SidebarProvider defaultOpen>
                    <AppSidebar />
                    <div className="flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300">
                    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-white/[0.06] bg-neutral-950/70 backdrop-blur-xl sticky top-0 z-30">
                        <div className="flex items-center gap-3 min-w-0">
                            <SidebarTrigger className="hover:bg-white/[0.06] text-neutral-400 hover:text-neutral-100 transition-colors rounded-lg" />
                            {pageTitle && (
                                <>
                                    <div className="h-4 w-px bg-white/[0.08]" />
                                    <span className="text-sm font-medium text-neutral-200 truncate">{pageTitle}</span>
                                </>
                            )}
                        </div>
                        <DeadlineNotifications />
                    </header>
                    <PassExpiryBanner />
                    <main className="flex-1 w-full p-4 sm:p-6 lg:p-10 relative overflow-x-hidden bg-gradient-to-br from-background via-background/90 to-background">
                        {/* Ambient background decoration */}
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
                        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />
                        <div className="w-full max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </SidebarProvider>
            </OnboardingGuard>
        </TooltipProvider>
    );
}
