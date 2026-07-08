import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; noteId: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const { id, noteId } = await params;

        // Verify the application belongs to this user
        const application = await prisma.application.findFirst({
            where: { id, userId: user.id },
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        // Verify the note belongs to this application and user
        const existingNote = await prisma.applicationNote.findFirst({
            where: { id: noteId, applicationId: id, userId: user.id },
        });

        if (!existingNote) {
            return NextResponse.json(
                { error: "Note not found" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { content, category, isPinned } = body;

        const updated = await prisma.applicationNote.update({
            where: { id: noteId },
            data: {
                ...(content !== undefined && { content: content.trim() }),
                ...(category !== undefined && { category }),
                ...(isPinned !== undefined && { isPinned }),
            },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating note:", error);
        return NextResponse.json(
            { error: "Failed to update note" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string; noteId: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const { id, noteId } = await params;

        // Verify the application belongs to this user
        const application = await prisma.application.findFirst({
            where: { id, userId: user.id },
        });

        if (!application) {
            return NextResponse.json(
                { error: "Application not found" },
                { status: 404 }
            );
        }

        // Verify the note belongs to this application and user
        const existingNote = await prisma.applicationNote.findFirst({
            where: { id: noteId, applicationId: id, userId: user.id },
        });

        if (!existingNote) {
            return NextResponse.json(
                { error: "Note not found" },
                { status: 404 }
            );
        }

        await prisma.applicationNote.delete({
            where: { id: noteId },
        });

        return NextResponse.json(
            { message: "Note deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting note:", error);
        return NextResponse.json(
            { error: "Failed to delete note" },
            { status: 500 }
        );
    }
}
