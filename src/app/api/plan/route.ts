import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { daysLeft } from "@/lib/plans";

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId },
            select: { id: true, planType: true, expiresAt: true },
        });

        if (!user) {
            return NextResponse.json({ planType: "FREE", expiresAt: null, daysLeft: 0 });
        }

        // Expired passes downgrade to Free automatically. The user keeps all
        // of their data and documents — only unlimited AI access ends.
        if (user.planType !== "FREE" && (!user.expiresAt || user.expiresAt <= new Date())) {
            await prisma.user.update({
                where: { id: user.id },
                data: { planType: "FREE", expiresAt: null },
            });
            return NextResponse.json({ planType: "FREE", expiresAt: null, daysLeft: 0 });
        }

        return NextResponse.json({
            planType: user.planType,
            expiresAt: user.expiresAt,
            daysLeft: daysLeft(user.expiresAt),
        });
    } catch (error) {
        console.error("Error fetching plan:", error);
        return NextResponse.json({ error: "Failed to fetch plan" }, { status: 500 });
    }
}
