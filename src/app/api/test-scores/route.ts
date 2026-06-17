import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json([], { status: 200 });

        const scores = await prisma.testScore.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(scores, { status: 200 });
    } catch (error) {
        console.error("Error fetching test scores:", error);
        return NextResponse.json({ error: "Failed to fetch test scores" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await request.json();
        const { testType, score, dateTaken } = body;

        if (!testType || !score) {
            return NextResponse.json({ error: "testType and score are required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const testScore = await prisma.testScore.create({
            data: {
                testType,
                score,
                dateTaken: dateTaken ? new Date(dateTaken) : null,
                userId: user.id,
            },
        });
        return NextResponse.json(testScore, { status: 201 });
    } catch (error) {
        console.error("Error creating test score:", error);
        return NextResponse.json({ error: "Failed to create test score" }, { status: 500 });
    }
}
