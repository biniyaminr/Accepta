import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Single source of truth for admin gating. Two tiers, both env allowlists
// (comma-separated emails):
//   ADMIN_EMAILS      → SUPER_ADMIN: full console (users, audit logs, deletes)
//   DATA_ENTRY_EMAILS → DATA_ENTRY: program data entry only (create/edit/publish)
// Pages call getAdmin() and notFound() on null; API routes return 404 so the
// console stays hidden from everyone else.

export type AdminRole = "SUPER_ADMIN" | "DATA_ENTRY";

export type Admin = { email: string; role: AdminRole };

export const OPPORTUNITY_TAGS = ["FULLY_FUNDED", "PARTIAL_SCHOLARSHIP", "NO_IELTS"] as const;

/** Keep only known Opportunity tag keys; anything else from the client is dropped. */
export function sanitizeTags(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return OPPORTUNITY_TAGS.filter((k) => input.includes(k));
}

function parseList(value: string | undefined): string[] {
    return (value || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
}

/** Role for an email, or null if not an admin. Super admin wins if listed in both. */
export function resolveAdminRole(email: string | null | undefined): AdminRole | null {
    if (!email) return null;
    const normalized = email.toLowerCase();
    if (parseList(process.env.ADMIN_EMAILS).includes(normalized)) return "SUPER_ADMIN";
    if (parseList(process.env.DATA_ENTRY_EMAILS).includes(normalized)) return "DATA_ENTRY";
    return null;
}

/** The signed-in admin (email + role), or null if not an allowlisted admin. */
export async function getAdmin(): Promise<Admin | null> {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress?.toLowerCase();
    const role = resolveAdminRole(email);
    return email && role ? { email, role } : null;
}

/** Fire-and-forget audit trail entry; never throws into the caller's flow. */
export async function logAudit(entry: {
    actorEmail: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH";
    entity: string;
    entityId?: string;
    summary: string;
}) {
    try {
        await prisma.auditLog.create({ data: entry });
    } catch (error) {
        console.error("Failed to write audit log:", error);
    }
}
