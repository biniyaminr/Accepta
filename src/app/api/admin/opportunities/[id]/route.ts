import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin, logAudit, sanitizeTags } from "@/lib/admin";

// Edit / delete a GLOBAL opportunity (userId: null). The userId guard in every
// where-clause makes it impossible to touch a user's personal saves from here.

const STATUSES = ["DRAFT", "NEEDS_REVIEW", "PUBLISHED"] as const;

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await getAdmin();
    if (!admin) return new NextResponse("Not Found", { status: 404 });

    try {
        const { id } = await params;
        const existing = await prisma.opportunity.findFirst({
            where: { id, userId: null },
        });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const body = await request.json();
        const data: Record<string, unknown> = {};
        if (typeof body.university === "string" && body.university) data.university = body.university;
        if (typeof body.programName === "string" && body.programName) data.programName = body.programName;
        if ("description" in body) data.description = body.description || null;
        if ("deadline" in body) data.deadline = body.deadline ? new Date(body.deadline) : null;
        if ("country" in body) data.country = body.country || null;
        if (typeof body.link === "string" && body.link) data.link = body.link;
        if ("isScholarship" in body) data.isScholarship = !!body.isScholarship;
        if ("isFreeApp" in body) data.isFreeApp = !!body.isFreeApp;
        if (STATUSES.includes(body.status)) data.status = body.status;
        if ("tags" in body) {
            const tags = sanitizeTags(body.tags);
            data.tags = tags;
            // isScholarship stays derived from funding tags for feed back-compat.
            data.isScholarship =
                tags.includes("FULLY_FUNDED") || tags.includes("PARTIAL_SCHOLARSHIP");
        }

        const updated = await prisma.opportunity.update({ where: { id }, data });

        const publishedNow = updated.status === "PUBLISHED" && existing.status !== "PUBLISHED";
        await logAudit({
            actorEmail: admin.email,
            action: publishedNow ? "PUBLISH" : "UPDATE",
            entity: "Opportunity",
            entityId: id,
            summary: publishedNow
                ? `Published "${updated.programName}" (${updated.university})`
                : `Updated "${updated.programName}" (${updated.university})`,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating admin opportunity:", error);
        return NextResponse.json(
            { error: "Failed to update opportunity" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Destructive — reserved for super admins; data-entry admins can only
    // create/edit/publish.
    const admin = await getAdmin();
    if (admin?.role !== "SUPER_ADMIN") {
        return new NextResponse("Not Found", { status: 404 });
    }

    try {
        const { id } = await params;
        const existing = await prisma.opportunity.findFirst({
            where: { id, userId: null },
        });
        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        await prisma.opportunity.delete({ where: { id } });

        await logAudit({
            actorEmail: admin.email,
            action: "DELETE",
            entity: "Opportunity",
            entityId: id,
            summary: `Deleted "${existing.programName}" (${existing.university})`,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting admin opportunity:", error);
        return NextResponse.json(
            { error: "Failed to delete opportunity" },
            { status: 500 }
        );
    }
}
