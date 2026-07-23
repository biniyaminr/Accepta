import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin, logAudit } from "@/lib/admin";

// Super-admin only: update pipeline flags on a user record. Currently just
// the `interviewed` user-research flag from the new-users console.

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdmin();
    if (admin?.role !== "SUPER_ADMIN") {
        return new NextResponse("Not Found", { status: 404 });
    }

    try {
        const { id } = await params;
        const body = await request.json();

        if (typeof body.interviewed !== "boolean") {
            return NextResponse.json(
                { error: "Missing interviewed flag" },
                { status: 400 }
            );
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { interviewed: body.interviewed },
            select: { id: true, email: true, interviewed: true },
        });

        await logAudit({
            actorEmail: admin.email,
            action: "UPDATE",
            entity: "User",
            entityId: id,
            summary: `Marked ${updated.email} as ${updated.interviewed ? "interviewed" : "not interviewed"}`,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating user pipeline flag:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}
