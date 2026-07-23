import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { AdminSidebar, AdminMobileBar } from "@/components/admin/AdminSidebar";
import { GlassCard } from "@/components/admin/GlassCard";
import { resolveAdminRole } from "@/lib/admin";
import { ShieldCheck, LogIn } from "lucide-react";

// Isolated admin shell — a brand-new layout exclusively for /admin/*.
// It shares NOTHING with the user "Mission Control" layout: the (admin) route
// group guarantees standard users and admins never accidentally share chrome.
// URLs stay clean: the group name is stripped, so this still serves /en/admin.
//
// Auth is enforced HERE for the whole group: signed-out visitors get the
// sign-in card, signed-in non-admins get a 404, and only allowlisted admins
// ever see a page. Pages keep their own getAdminEmail() checks as
// defense-in-depth, but a future page that forgets one is still protected.
export default async function AdminGroupLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress?.toLowerCase();
    const role = resolveAdminRole(email);

    // Signed-in but not on any allowlist: hide the console entirely.
    if (user && !role) {
        notFound();
    }

    return (
        <div className="flex min-h-screen bg-[#09090b] text-zinc-50">
            <AdminSidebar role={role} />
            <main className="flex-1 min-w-0 flex flex-col">
                <AdminMobileBar role={role} />
                {/* Ambient brand glow */}
                <div className="pointer-events-none fixed top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-[140px]" />
                <div className="pointer-events-none fixed bottom-0 left-1/3 -z-10 h-[420px] w-[420px] rounded-full bg-orange-500/[0.07] blur-[150px]" />
                <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-10">
                    {role ? children : <AdminSignInGate />}
                </div>
            </main>
        </div>
    );
}

// Shown on every /admin/* URL when signed out — one gate for the whole group.
function AdminSignInGate() {
    return (
        <div className="mx-auto max-w-md pt-10">
            <GlassCard className="p-8 text-center">
                <span className="mx-auto grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-orange-500 text-white shadow-lg shadow-violet-950/40">
                    <ShieldCheck className="h-6 w-6" />
                </span>
                <h1 className="mt-5 text-xl font-bold text-white">Accepta Admin Control</h1>
                <p className="mt-1.5 text-sm text-neutral-400">
                    Restricted console. Sign in with an authorized admin account to continue.
                </p>
                <SignInButton mode="modal" forceRedirectUrl="/en/admin">
                    <button className="mt-6 inline-flex w-full items-center justify-center gap-2 h-11 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-500 hover:to-orange-400 shadow-lg shadow-violet-950/40 transition-all duration-300">
                        <LogIn className="h-4 w-4" />
                        Admin Sign In
                    </button>
                </SignInButton>
            </GlassCard>
        </div>
    );
}
