import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId }
        });

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await context.params;

        // Verify ownership
        const existingDoc = await prisma.document.findUnique({ where: { id } });
        if (!existingDoc || existingDoc.userId !== user.id) {
            return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
        }

        const body = await request.json();
        const { name, type, applicationId, expiryDate } = body;

        const updatedDoc = await prisma.document.update({
            where: { id },
            data: {
                name,
                type,
                applicationId: applicationId === "none" ? null : applicationId,
                ...(expiryDate !== undefined && {
                    expiryDate: expiryDate ? new Date(expiryDate) : null
                })
            }
        });

        return NextResponse.json(updatedDoc, { status: 200 });
    } catch (error) {
        console.error("Error updating document:", error);
        return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId }
        });

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await context.params;

        const doc = await prisma.document.findUnique({ where: { id } });

        if (!doc || doc.userId !== user.id) {
            return NextResponse.json({ error: "Document not found or access denied" }, { status: 404 });
        }

        // Strike 1: Delete from Uploadthing cloud storage
        // Uploadthing URLs look like: https://utfs.io/f/<fileKey>
        if (doc.fileUrl && doc.fileUrl.includes('/f/')) {
            try {
                const fileKey = doc.fileUrl.split('/f/').pop();
                if (fileKey) {
                    await utapi.deleteFiles(fileKey);
                    console.log(`🗑️ Uploadthing file deleted: ${fileKey}`);
                }
            } catch (err) {
                // Log but don't block — still remove the DB record
                console.warn("⚠️ Uploadthing deletion failed (file may already be gone):", err);
            }
        }

        // Strike 2: Delete the database record
        await prisma.document.delete({ where: { id } });

        return NextResponse.json({ message: "Document deleted from vault and cloud storage" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
