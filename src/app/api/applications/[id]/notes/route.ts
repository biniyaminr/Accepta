import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;

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

        const notes = await prisma.applicationNote.findMany({
            where: { applicationId: id },
            orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        });

        return NextResponse.json(notes, { status: 200 });
    } catch (error) {
        console.error("Error fetching notes:", error);
        return NextResponse.json(
            { error: "Failed to fetch notes" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;

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

        const body = await request.json();
        const { content, category } = body;

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        const note = await prisma.applicationNote.create({
            data: {
                content: content.trim(),
                category: category || "general",
                applicationId: id,
                userId: user.id,
            },
        });

        return NextResponse.json(note, { status: 201 });
    } catch (error) {
        console.error("Error creating note:", error);
        return NextResponse.json(
            { error: "Failed to create note" },
            { status: 500 }
        );
    }
}
