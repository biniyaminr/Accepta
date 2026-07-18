"use client";

import Image from "next/image";
import AcceptaLogo from "@/images/acceptalogo.png";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { Home, FileText, User, GraduationCap, Briefcase, Compass, LogIn, CreditCard, Sparkles, Mail, MessageSquare, Users, CalendarDays, FileSearch, BarChart3 } from "lucide-react";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/routing";
import { PassStatus } from "./PassStatus";

export function AppSidebar() {
    const pathname = usePathname();
    const t = useTranslations("Sidebar");

    const groups = [
        {
            label: t("groupOverview"),
            items: [
                { title: t("missionDashboard"), url: "/dashboard", icon: Home },
                { title: t("liveFeed"), url: "/feed", icon: Sparkles },
                { title: t("analytics"), url: "/analytics", icon: BarChart3 },
            ],
        },
        {
            label: t("groupAiStudio"),
            items: [
                { title: t("aiEssays"), url: "/essays", icon: FileText },
                { title: t("essayReview"), url: "/essay-review", icon: FileSearch },
                { title: t("letters"), url: "/letters", icon: Mail },
                { title: t("aiCvMaker"), url: "/resume", icon: Briefcase },
                { title: t("interviewPrep"), url: "/interview-prep", icon: MessageSquare },
            ],
        },
        {
            label: t("groupApplications"),
            items: [
                { title: t("discoverPrograms"), url: "/discover", icon: Compass },
                { title: t("applicationTracker"), url: "/applications", icon: GraduationCap },
                { title: t("recommendations"), url: "/recommendations", icon: Users },
                { title: t("calendar"), url: "/calendar", icon: CalendarDays },
            ],
        },
        {
            label: t("groupAccount"),
            items: [
                { title: t("masterProfile"), url: "/profile", icon: User },
                { title: t("pricing"), url: "/pricing", icon: CreditCard },
            ],
        },
    ];

    return (
        <Sidebar className="border-r border-white/[0.06] bg-neutral-950">
            <SidebarHeader className="h-16 flex flex-row items-center px-5 border-b border-white/[0.06] bg-transparent">
                <Link href="/" className="flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity">
                    <Image
                        src={AcceptaLogo}
                        alt="Accepta logo"
                        width={36}
                        height={36}
                        priority
                        className="object-contain shrink-0 rounded-lg"
                    />
                    <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-300 to-neutral-100 tracking-tight">
                        Accepta
                    </span>
                </Link>
            </SidebarHeader>
            <SidebarContent className="bg-transparent pt-3 pb-2">
                {groups.map((group) => (
                    <SidebarGroup key={group.label} className="py-1.5">
                        <SidebarGroupLabel className="text-neutral-600 font-semibold px-3 tracking-[0.14em] text-[10px] uppercase mb-1">
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu className="px-2 space-y-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.url;
                                    return (
                                        <SidebarMenuItem key={item.url}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isActive}
                                                className={`
                                                    w-full justify-start gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-colors duration-150 group relative
                                                    ${isActive
                                                        ? 'bg-violet-500/[0.12] text-violet-100 ring-1 ring-inset ring-violet-500/25'
                                                        : 'text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.04]'
                                                    }
                                                `}
                                            >
                                                <Link href={item.url} className="flex items-center w-full gap-3">
                                                    {isActive && (
                                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-violet-400" />
                                                    )}
                                                    <item.icon className={`h-[18px] w-[18px] shrink-0 transition-colors duration-150 ${isActive ? 'text-violet-400' : 'text-neutral-500 group-hover:text-neutral-300'}`} />
                                                    <span className="truncate">{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            {/* Auth Footer */}
            <SidebarFooter className="border-t border-white/[0.06] p-3 gap-2">
                <SignedIn>
                    <PassStatus />
                </SignedIn>
                {/* Language Switcher */}
                <div className="px-1">
                    <LanguageSwitcher />
                </div>
                <SignedOut>
                    <div className="flex flex-col gap-2">
                        <SignInButton mode="modal">
                            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[13px] font-medium text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white">
                                <LogIn className="h-3.5 w-3.5" />
                                Log In
                            </button>
                        </SignInButton>
                        <SignUpButton mode="modal">
                            <button className="flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-violet-500 shadow-lg shadow-violet-950/40">
                                Sign Up Free
                            </button>
                        </SignUpButton>
                    </div>
                </SignedOut>

                <SignedIn>
                    <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
                        <UserButton
                            appearance={{
                                elements: {
                                    avatarBox: "h-8 w-8 rounded-lg",
                                },
                            }}
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-medium text-neutral-200 truncate">My Account</span>
                            <span className="text-[11px] text-neutral-500">Manage profile</span>
                        </div>
                    </div>
                </SignedIn>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    );
}
