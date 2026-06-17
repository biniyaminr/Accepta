import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const recommendations = await prisma.recommendation.findMany({
            where: { userId: user.id },
            include: { application: true },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(recommendations, { status: 200 });
    } catch (error) {
        console.error("Error fetching recommendations:", error);
        return NextResponse.json({ error: "Failed to fetch recommendations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await request.json();
        const { recommenderName, recommenderEmail, recommenderTitle, relationship, applicationId, dueDate, notes } = body;

        if (!recommenderName) {
            return NextResponse.json({ error: "Recommender name is required" }, { status: 400 });
        }

        if (!relationship) {
            return NextResponse.json({ error: "Relationship is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const recommendation = await prisma.recommendation.create({
            data: {
                recommenderName,
                recommenderEmail: recommenderEmail || null,
                recommenderTitle: recommenderTitle || null,
                relationship,
                applicationId: applicationId || null,
                dueDate: dueDate ? new Date(dueDate) : null,
                notes: notes || null,
                status: "NOT_ASKED",
                userId: user.id,
            },
            include: { application: true },
        });

        return NextResponse.json(recommendation, { status: 201 });
    } catch (error) {
        console.error("Error creating recommendation:", error);
        return NextResponse.json({ error: "Failed to create recommendation" }, { status: 500 });
    }
}
