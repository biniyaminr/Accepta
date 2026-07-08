import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Founder-only interview pipeline: newest signups with email, date, and
// referral source. Access is limited to the ADMIN_EMAILS env allowlist
// (comma-separated). Everyone else gets a 404.

export const dynamic = "force-dynamic";

export default async function NewUsersAdminPage() {
    const user = await currentUser();
    const allowlist = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
    const email = user?.emailAddresses[0]?.emailAddress?.toLowerCase();

    if (!email || !allowlist.includes(email)) {
        notFound();
    }

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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-100">New Users — Interview Pipeline</h1>
                <p className="text-sm text-neutral-400">{users.length} signups, newest first.</p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-neutral-800">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-900 text-neutral-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Signed up</th>
                            <th className="px-4 py-3">Referral source</th>
                            <th className="px-4 py-3">UTM</th>
                            <th className="px-4 py-3">Onboarded</th>
                            <th className="px-4 py-3">Interviewed</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800 text-neutral-200">
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td className="px-4 py-3">{u.fullName}</td>
                                <td className="px-4 py-3">{u.email}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                    {u.createdAt.toISOString().slice(0, 10)}
                                </td>
                                <td className="px-4 py-3">{u.referralSource ?? "—"}</td>
                                <td className="px-4 py-3 text-neutral-400">
                                    {[u.utmSource, u.utmMedium, u.utmCampaign].filter(Boolean).join(" / ") || "—"}
                                </td>
                                <td className="px-4 py-3">{u.isOnboardingComplete ? "Yes" : "No"}</td>
                                <td className="px-4 py-3">{u.interviewed ? "Yes" : "No"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
