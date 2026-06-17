import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { status, notes, reminderSent, askedDate, dueDate, recommenderName, recommenderEmail, recommenderTitle, relationship, applicationId } = body;

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const existing = await prisma.recommendation.findFirst({ where: { id, userId: user.id } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {};
        if (status !== undefined) data.status = status;
        if (notes !== undefined) data.notes = notes;
        if (reminderSent !== undefined) data.reminderSent = reminderSent;
        if (askedDate !== undefined) data.askedDate = askedDate ? new Date(askedDate) : null;
        if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
        if (recommenderName !== undefined) data.recommenderName = recommenderName;
        if (recommenderEmail !== undefined) data.recommenderEmail = recommenderEmail || null;
        if (recommenderTitle !== undefined) data.recommenderTitle = recommenderTitle || null;
        if (relationship !== undefined) data.relationship = relationship;
        if (applicationId !== undefined) data.applicationId = applicationId || null;

        const updated = await prisma.recommendation.update({
            where: { id },
            data,
            include: { application: true },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating recommendation:", error);
        return NextResponse.json({ error: "Failed to update recommendation" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const existing = await prisma.recommendation.findFirst({ where: { id, userId: user.id } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.recommendation.delete({ where: { id } });
        return NextResponse.json({ message: "Deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting recommendation:", error);
        return NextResponse.json({ error: "Failed to delete recommendation" }, { status: 500 });
    }
}
