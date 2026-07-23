import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/admin";
import { GlassCard } from "@/components/admin/GlassCard";
import { ScrollText, PlusCircle, Pencil, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// Audit Logs — every create/edit/publish/delete performed in the admin
// console, newest first. Gated by the ADMIN_EMAILS allowlist.
export const dynamic = "force-dynamic";

const ACTION_META: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; pill: string }
> = {
    CREATE: {
        icon: PlusCircle,
        pill: "bg-violet-500/15 text-violet-300 ring-violet-500/25",
    },
    UPDATE: {
        icon: Pencil,
        pill: "bg-sky-500/15 text-sky-300 ring-sky-500/25",
    },
    PUBLISH: {
        icon: Send,
        pill: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25",
    },
    DELETE: {
        icon: Trash2,
        pill: "bg-red-500/15 text-red-300 ring-red-500/25",
    },
};

export default async function AuditLogsPage() {
    const admin = await getAdmin();
    if (admin?.role !== "SUPER_ADMIN") notFound();

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Audit Logs</h1>
                <p className="text-sm text-neutral-400 mt-0.5">
                    Track data-entry activity across the admin console — last {logs.length} events.
                </p>
            </div>

            {logs.length === 0 ? (
                <GlassCard className="p-10 text-center">
                    <span className="mx-auto grid place-items-center h-12 w-12 rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] text-neutral-400">
                        <ScrollText className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-sm font-medium text-neutral-200">No activity recorded yet</p>
                    <p className="mt-1 text-[13px] text-neutral-500">
                        Entry, edit, publish, and delete events will appear here.
                    </p>
                </GlassCard>
            ) : (
                <GlassCard className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[11px] uppercase tracking-wider text-neutral-500">
                                <tr className="border-b border-white/[0.06]">
                                    <th className="px-5 py-3 font-medium">Action</th>
                                    <th className="px-5 py-3 font-medium">Details</th>
                                    <th className="px-5 py-3 font-medium">Admin</th>
                                    <th className="px-5 py-3 font-medium text-right">When</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {logs.map((log) => {
                                    const meta = ACTION_META[log.action] ?? ACTION_META.UPDATE;
                                    return (
                                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                                                        meta.pill
                                                    )}
                                                >
                                                    <meta.icon className="h-3 w-3" />
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-neutral-200 max-w-[380px]">
                                                <span className="line-clamp-2">{log.summary}</span>
                                                <span className="block text-[11px] text-neutral-600 mt-0.5">
                                                    {log.entity}
                                                    {log.entityId ? ` · ${log.entityId}` : ""}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-neutral-400 whitespace-nowrap">
                                                {log.actorEmail}
                                            </td>
                                            <td className="px-5 py-3.5 text-right text-neutral-400 tabular-nums whitespace-nowrap">
                                                {log.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
