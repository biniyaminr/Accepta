import { notFound } from "next/navigation";
import { Link } from "@/i18n/routing";
import { GlassCard } from "@/components/admin/GlassCard";
import { getAdmin } from "@/lib/admin";
import { GraduationCap, Users, ScrollText, ArrowRight, ShieldCheck } from "lucide-react";

// Accepta Admin Control — the console hub admins land on:
//   /en/admin  (or /am/admin)
// Sign-in and allowlist gating live in the (admin) layout; the page-level
// check below is defense-in-depth only.

export const dynamic = "force-dynamic";

const CONSOLES = [
    {
        href: "/admin/data-entry",
        title: "Program Data Entry",
        desc: "Add and publish university programs to the live feed.",
        icon: GraduationCap,
        superOnly: false,
    },
    {
        href: "/admin/new-users",
        title: "New Users — Interview Pipeline",
        desc: "Newest signups with referral source and interview status.",
        icon: Users,
        superOnly: true,
    },
    {
        href: "/admin/audit-logs",
        title: "Audit Logs",
        desc: "Every create, edit, publish, and delete across the console.",
        icon: ScrollText,
        superOnly: true,
    },
] as const;

export default async function AdminHubPage() {
    const admin = await getAdmin();
    if (!admin) notFound();

    const consoles = CONSOLES.filter((c) => !c.superOnly || admin.role === "SUPER_ADMIN");

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <span className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-600 to-orange-500 text-white shadow-lg shadow-violet-950/40">
                    <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Control</h1>
                    <p className="text-sm text-neutral-400">
                        Signed in as <span className="text-neutral-200">{admin.email}</span>
                        <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/25">
                            {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Data Entry"}
                        </span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {consoles.map((c) => (
                    <Link key={c.href} href={c.href} className="group no-underline">
                        <GlassCard className="p-5 h-full transition-all duration-300 hover:ring-1 hover:ring-inset hover:ring-violet-500/30 hover:bg-zinc-900/70">
                            <div className="flex items-start justify-between">
                                <span className="grid place-items-center h-10 w-10 rounded-lg bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] text-violet-300">
                                    <c.icon className="h-5 w-5" />
                                </span>
                                <ArrowRight className="h-4 w-4 text-neutral-600 group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all duration-300" />
                            </div>
                            <h2 className="mt-4 text-sm font-semibold text-white">{c.title}</h2>
                            <p className="mt-1 text-[13px] text-neutral-400 leading-relaxed">{c.desc}</p>
                        </GlassCard>
                    </Link>
                ))}
            </div>
        </div>
    );
}
