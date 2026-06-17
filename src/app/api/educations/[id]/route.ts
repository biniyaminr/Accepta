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
        const { institutionName, major, city, country, gpa, startDate, gradDate } = body;

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const existing = await prisma.education.findFirst({ where: { id, userId: user.id } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const updated = await prisma.education.update({
            where: { id },
            data: {
                institutionName: institutionName || existing.institutionName,
                major: major ?? existing.major,
                city: city ?? existing.city,
                country: country ?? existing.country,
                gpa: gpa !== undefined ? (gpa ? parseFloat(gpa) : null) : existing.gpa,
                startDate: startDate ? new Date(startDate) : existing.startDate,
                gradDate: gradDate ? new Date(gradDate) : existing.gradDate,
            },
        });
        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        console.error("Error updating education:", error);
        return NextResponse.json({ error: "Failed to update education" }, { status: 500 });
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

        const existing = await prisma.education.findFirst({ where: { id, userId: user.id } });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.education.delete({ where: { id } });
        return NextResponse.json({ message: "Deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting education:", error);
        return NextResponse.json({ error: "Failed to delete education" }, { status: 500 });
    }
}
