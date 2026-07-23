"use client";

import { Link, usePathname } from "@/i18n/routing";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    ScrollText,
    ShieldCheck,
    LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/lib/admin";

// Hyper-minimal admin rail — data-entry focused. Isolated from the user
// "Mission Control" sidebar via the (admin) route group.
// superOnly links are hidden from DATA_ENTRY admins (server routes enforce too).
const LINKS = [
    { href: "/admin", label: "Admin Home", icon: LayoutDashboard, superOnly: false },
    { href: "/admin/data-entry", label: "Program Entry", icon: GraduationCap, superOnly: false },
    { href: "/admin/new-users", label: "User Pipeline", icon: Users, superOnly: true },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, superOnly: true },
] as const;

function visibleLinks(role: AdminRole | null) {
    return LINKS.filter((l) => !l.superOnly || role === "SUPER_ADMIN");
}

// Compact top bar for < md screens — brand + horizontally scrollable nav, so
// the console stays usable on a phone where the rail is hidden.
export function AdminMobileBar({ role }: { role: AdminRole | null }) {
    const pathname = usePathname();

    return (
        <div className="md:hidden sticky top-0 z-40 border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-xl">
            <div className="h-14 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <span className="grid place-items-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500 text-white shadow-lg shadow-violet-950/40">
                        <ShieldCheck className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-bold text-white tracking-tight">Admin Control</p>
                </div>
                <SignedIn>
                    <UserButton appearance={{ elements: { avatarBox: "h-8 w-8 rounded-lg" } }} />
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl="/en/admin">
                        <button className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-orange-500 px-3 py-1.5 text-[12px] font-semibold text-white">
                            <LogIn className="h-3 w-3" />
                            Sign In
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
            <nav className="flex gap-1 px-2 pb-2 overflow-x-auto">
                {visibleLinks(role).map((item) => {
                    const isActive =
                        item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-1.5 px-3 h-8 rounded-lg text-[13px] font-medium no-underline whitespace-nowrap transition-colors duration-150",
                                isActive
                                    ? "bg-violet-500/[0.12] text-violet-100 ring-1 ring-inset ring-violet-500/25"
                                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.04]"
                            )}
                        >
                            <item.icon className="h-3.5 w-3.5 shrink-0" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}

export function AdminSidebar({ role }: { role: AdminRole | null }) {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
            {/* Brand */}
            <div className="h-16 flex items-center gap-2.5 px-5 border-b border-white/[0.06]">
                <span className="grid place-items-center h-9 w-9 rounded-lg bg-gradient-to-br from-violet-600 to-orange-500 text-white shadow-lg shadow-violet-950/40">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                </span>
                <div className="leading-tight">
                    <p className="text-sm font-bold text-white tracking-tight">Admin Control</p>
                    <p className="text-[11px] text-neutral-500">Accepta</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {visibleLinks(role).map((item) => {
                    // Home matches exactly; sections match their sub-paths too.
                    const isActive =
                        item.href === "/admin"
                            ? pathname === "/admin"
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium no-underline transition-colors duration-150",
                                isActive
                                    ? "bg-violet-500/[0.12] text-violet-100 ring-1 ring-inset ring-violet-500/25"
                                    : "text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.04]"
                            )}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 rounded-full bg-violet-400" />
                            )}
                            <item.icon
                                className={cn(
                                    "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                                    isActive ? "text-violet-400" : "text-neutral-500 group-hover:text-neutral-300"
                                )}
                            />
                            <span className="truncate">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Account footer */}
            <div className="border-t border-white/[0.06] p-3">
                <SignedIn>
                    <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5 ring-1 ring-inset ring-white/[0.06]">
                        <UserButton appearance={{ elements: { avatarBox: "h-8 w-8 rounded-lg" } }} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-medium text-neutral-200 truncate">
                                {role === "SUPER_ADMIN" ? "Super Admin" : "Data Entry"}
                            </span>
                            <span className="text-[11px] text-neutral-500">Signed in</span>
                        </div>
                    </div>
                </SignedIn>
                <SignedOut>
                    <SignInButton mode="modal" forceRedirectUrl="/en/admin">
                        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-orange-500 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-violet-950/40 transition-all hover:from-violet-500 hover:to-orange-400">
                            <LogIn className="h-3.5 w-3.5" />
                            Admin Sign In
                        </button>
                    </SignInButton>
                </SignedOut>
            </div>
        </aside>
    );
}
