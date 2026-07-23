import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/admin";
import { GlassCard } from "@/components/admin/GlassCard";
import { InterviewedToggle } from "@/components/admin/InterviewedToggle";
import { Users, CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

// Founder-only interview pipeline: newest signups with email, date, and
// referral source. Access is limited to the ADMIN_EMAILS env allowlist
// (comma-separated). Everyone else gets a 404.

export const dynamic = "force-dynamic";

export default async function NewUsersAdminPage() {
    const admin = await getAdmin();
    if (admin?.role !== "SUPER_ADMIN") notFound();

    const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            fullName: true,
            email: true,
            createdAt: true,
            referralSource: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            interviewed: true,
            isOnboardingComplete: true,
        },
    });

    const interviewed = users.filter((u) => u.interviewed).length;
    const onboarded = users.filter((u) => u.isOnboardingComplete).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    New Users — Interview Pipeline
                </h1>
                <p className="text-sm text-neutral-400 mt-0.5">
                    Newest signups first, with referral source and interview status.
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Signups", value: users.length, icon: Users, tint: "text-neutral-200" },
                    { label: "Onboarded", value: onboarded, icon: CheckCircle2, tint: "text-emerald-300" },
                    { label: "Interviewed", value: interviewed, icon: Clock3, tint: "text-sky-300" },
                ].map((s) => (
                    <GlassCard key={s.label} className="p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                                {s.label}
                            </span>
                            <s.icon className={cn("h-4 w-4", s.tint)} />
                        </div>
                        <p className={cn("mt-2 text-3xl font-bold tabular-nums", s.tint)}>{s.value}</p>
                    </GlassCard>
                ))}
            </div>

            <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[11px] uppercase tracking-wider text-neutral-500">
                            <tr className="border-b border-white/[0.06]">
                                <th className="px-5 py-3 font-medium">Name</th>
                                <th className="px-5 py-3 font-medium">Email</th>
                                <th className="px-5 py-3 font-medium">Signed up</th>
                                <th className="px-5 py-3 font-medium">Referral source</th>
                                <th className="px-5 py-3 font-medium">UTM</th>
                                <th className="px-5 py-3 font-medium">Onboarded</th>
                                <th className="px-5 py-3 font-medium">Interviewed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-neutral-200">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-3.5 font-medium text-neutral-100 whitespace-nowrap">
                                        {u.fullName}
                                    </td>
                                    <td className="px-5 py-3.5 text-neutral-400">{u.email}</td>
                                    <td className="px-5 py-3.5 tabular-nums text-neutral-400 whitespace-nowrap">
                                        {u.createdAt.toISOString().slice(0, 10)}
                                    </td>
                                    <td className="px-5 py-3.5 text-neutral-400">
                                        {u.referralSource ?? "—"}
                                    </td>
                                    <td className="px-5 py-3.5 text-neutral-500">
                                        {[u.utmSource, u.utmMedium, u.utmCampaign]
                                            .filter(Boolean)
                                            .join(" / ") || "—"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span
                                            className={cn(
                                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                                                u.isOnboardingComplete
                                                    ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                                                    : "bg-white/[0.02] text-neutral-500 ring-white/[0.08]"
                                            )}
                                        >
                                            {u.isOnboardingComplete ? "Yes" : "No"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <InterviewedToggle userId={u.id} initial={u.interviewed} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
}
