 import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Personal saves + globally published admin entries (userId: null).
        const opportunities = await prisma.opportunity.findMany({
            where: {
                OR: [
                    { userId: clerkId },
                    { userId: null, status: "PUBLISHED" },
                ],
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return NextResponse.json(opportunities);
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        return NextResponse.json(
            { error: "Failed to fetch opportunities" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const {
            university,
            programName,
            description,
            deadline,
            isScholarship,
            isFreeApp,
            country,
            link,
        } = body;

        if (!university || !programName || !link) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const opportunity = await prisma.opportunity.create({
            data: {
                userId: clerkId,
                university,
                programName,
                description,
                deadline: deadline ? new Date(deadline) : null,
                isScholarship: !!isScholarship,
                isFreeApp: !!isFreeApp,
                country,
                link,
            },
        });

        return NextResponse.json(opportunity, { status: 201 });
    } catch (error) {
        console.error("Error creating opportunity:", error);
        return NextResponse.json(
            { error: "Failed to create opportunity" },
            { status: 500 }
        );
    }
}
