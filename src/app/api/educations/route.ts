import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const body = await request.json();
        const { institutionName, major, city, country, gpa, startDate, gradDate } = body;

        if (!institutionName) {
            return NextResponse.json({ error: "Institution name is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const education = await prisma.education.create({
            data: {
                institutionName,
                major: major || null,
                city: city || null,
                country: country || null,
                gpa: gpa ? parseFloat(gpa) : null,
                startDate: startDate ? new Date(startDate) : null,
                gradDate: gradDate ? new Date(gradDate) : null,
                userId: user.id,
            },
        });
        return NextResponse.json(education, { status: 201 });
    } catch (error) {
        console.error("Error creating education:", error);
        return NextResponse.json({ error: "Failed to create education" }, { status: 500 });
    }
}
