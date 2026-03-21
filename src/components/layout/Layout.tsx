"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OnboardingGuard } from "../auth/OnboardingGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLandingPage = pathname === "/" || pathname === "/en" || pathname === "/am";

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
            <OnboardingGuard>
                <SidebarProvider defaultOpen>
                    <AppSidebar />
                    <div className="flex-1 w-full flex flex-col min-h-screen transition-all duration-300">
                    <header className="h-16 flex items-center px-6 border-b border-border/10 bg-background/50 backdrop-blur-md sticky top-0 z-30">
                        <SidebarTrigger className="hover:bg-neutral-800/50 text-neutral-400 hover:text-neutral-200 transition-colors" />
                    </header>
                    <main className="flex-1 w-full p-6 lg:p-10 relative overflow-x-hidden bg-gradient-to-br from-background via-background/90 to-background">
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
