import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Test types that expire after 2 years from dateTaken
const TWO_YEAR_EXPIRY_TESTS = ["IELTS", "TOEFL", "Duolingo"];

function getStatus(daysRemaining: number): "expired" | "expiring_soon" | "valid" {
    if (daysRemaining < 0) return "expired";
    if (daysRemaining <= 90) return "expiring_soon";
    return "valid";
}

function daysBetween(from: Date, to: Date): number {
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET() {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { userId: clerkId },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const now = new Date();
        const alerts: {
            id: string;
            type: "document" | "testScore";
            name: string;
            expiryDate: string;
            daysRemaining: number;
            status: "valid" | "expiring_soon" | "expired";
        }[] = [];

        // Fetch documents with expiryDate set
        const documents = await prisma.document.findMany({
            where: {
                userId: user.id,
                expiryDate: { not: null },
            },
        });

        for (const doc of documents) {
            const expiry = doc.expiryDate!;
            const daysRemaining = daysBetween(now, expiry);
            alerts.push({
                id: doc.id,
                type: "document",
                name: doc.name,
                expiryDate: expiry.toISOString().split("T")[0],
                daysRemaining,
                status: getStatus(daysRemaining),
            });
        }

        // Fetch test scores
        const testScores = await prisma.testScore.findMany({
            where: { userId: user.id },
        });

        for (const ts of testScores) {
            let expiry: Date | null = ts.expiryDate;

            // Auto-calculate expiry for known test types if no explicit expiryDate
            if (!expiry && ts.dateTaken) {
                const testTypeUpper = ts.testType.toUpperCase();
                const matches = TWO_YEAR_EXPIRY_TESTS.some(
                    (t) => testTypeUpper === t.toUpperCase()
                );
                if (matches) {
                    expiry = new Date(ts.dateTaken);
                    expiry.setFullYear(expiry.getFullYear() + 2);
                }
            }

            if (!expiry) continue;

            const daysRemaining = daysBetween(now, expiry);
            alerts.push({
                id: ts.id,
                type: "testScore",
                name: ts.testType,
                expiryDate: expiry.toISOString().split("T")[0],
                daysRemaining,
                status: getStatus(daysRemaining),
            });
        }

        // Sort by urgency: expired first, then expiring_soon, then valid; within each group sort by days remaining ascending
        const statusOrder = { expired: 0, expiring_soon: 1, valid: 2 };
        alerts.sort((a, b) => {
            const orderDiff = statusOrder[a.status] - statusOrder[b.status];
            if (orderDiff !== 0) return orderDiff;
            return a.daysRemaining - b.daysRemaining;
        });

        return NextResponse.json({ alerts });
    } catch (error) {
        console.error("Error fetching expiry alerts:", error);
        return NextResponse.json(
            { error: "Failed to fetch expiry alerts" },
            { status: 500 }
        );
    }
}
