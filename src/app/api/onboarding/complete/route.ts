import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId },
            include: {
                educations: true,
                documents: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // Verify "Minimum Viable Data"
        const hasIdentity = user.fullName && user.fullName !== "TBD" && user.dob && user.citizenship;
        const hasEducation = user.educations.length > 0 && user.educations[0].institutionName;
        const hasDocuments = user.documents.some(d => d.type === 'PASSPORT') && user.documents.some(d => d.type === 'RESUME');

        if (!hasIdentity || !hasEducation) {
            return NextResponse.json({ 
                error: "Incomplete profile data", 
                details: { hasIdentity, hasEducation, hasDocuments } 
            }, { status: 400 });
        }

        // Update onboarding status
        await prisma.user.update({
            where: { id: user.id },
            data: { 
                // @ts-ignore
                isOnboardingComplete: true 
            },
        });

        return NextResponse.json({ message: "Onboarding complete" }, { status: 200 });
    } catch (error) {
        console.error("Error completing onboarding:", error);
        return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
    }
}
