import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId },
            include: {
                educations: true,
                extracurriculars: true,
                testScores: true,
                documents: true,
            },
        });

        if (!user) {
            return NextResponse.json({ message: "No user profile found" }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { fullName, email, phone, address, dob, citizenship, zipCode, institutionName, major, city, country, gpa, startDate, gradDate } = body;

        // Validate required fields
        if (!fullName || !email) {
            return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        }

        const user = await prisma.user.upsert({
            where: { userId: clerkId },
            update: {
                fullName,
                email, // In case they changed their email
                phone,
                address,
                dob: dob ? new Date(dob) : null,
                citizenship,
                zipCode,
            },
            create: {
                userId: clerkId,
                fullName,
                email,
                phone,
                address,
                dob: dob ? new Date(dob) : null,
                citizenship,
                zipCode,
            },
        });

        // Handle Education entry if provided
        if (institutionName) {
            await prisma.education.deleteMany({
                where: { userId: user.id },
            });

            await prisma.education.create({
                data: {
                    institutionName,
                    major,
                    city,
                    country,
                    gpa: gpa ? parseFloat(gpa) : null,
                    startDate: startDate ? new Date(startDate) : null,
                    gradDate: gradDate ? new Date(gradDate) : null,
                    userId: user.id,
                },
            });
        }

        return NextResponse.json({ message: "Profile saved successfully", user }, { status: 200 });
    } catch (error) {
        console.error("Error saving profile:", error);
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
    }
}
