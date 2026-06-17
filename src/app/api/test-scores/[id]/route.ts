import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

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

        // Verify ownership before delete
        const score = await prisma.testScore.findFirst({
            where: { id, userId: user.id },
        });
        if (!score) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.testScore.delete({ where: { id } });
        return NextResponse.json({ message: "Deleted" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting test score:", error);
        return NextResponse.json({ error: "Failed to delete test score" }, { status: 500 });
    }
}
