import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin, logAudit, sanitizeTags } from "@/lib/admin";

// Admin-only console API for GLOBAL opportunities (userId: null). These are
// the entries every student sees in the live feed once status is PUBLISHED.
// Personal saves keep flowing through /api/opportunities untouched.

const STATUSES = ["DRAFT", "NEEDS_REVIEW", "PUBLISHED"] as const;
type Status = (typeof STATUSES)[number];

export async function GET() {
    const admin = await getAdmin();
    if (!admin) return new NextResponse("Not Found", { status: 404 });

    try {
        const opportunities = await prisma.opportunity.findMany({
            where: { userId: null },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(opportunities);
    } catch (error) {
        console.error("Error fetching admin opportunities:", error);
        return NextResponse.json(
            { error: "Failed to fetch opportunities" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const admin = await getAdmin();
    if (!admin) return new NextResponse("Not Found", { status: 404 });

    try {
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
            status,
            tags,
        } = body;

        if (!university || !programName || !link) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const entryStatus: Status = STATUSES.includes(status) ? status : "DRAFT";
        const entryTags = sanitizeTags(tags);

        const opportunity = await prisma.opportunity.create({
            data: {
                userId: null, // global entry — visible to all users when PUBLISHED
                university,
                programName,
                description: description || null,
                deadline: deadline ? new Date(deadline) : null,
                // isScholarship stays derived from funding tags for feed back-compat.
                isScholarship:
                    !!isScholarship ||
                    entryTags.includes("FULLY_FUNDED") ||
                    entryTags.includes("PARTIAL_SCHOLARSHIP"),
                isFreeApp: !!isFreeApp,
                country: country || null,
                link,
                status: entryStatus,
                tags: entryTags,
            },
        });

        await logAudit({
            actorEmail: admin.email,
            action: entryStatus === "PUBLISHED" ? "PUBLISH" : "CREATE",
            entity: "Opportunity",
            entityId: opportunity.id,
            summary: `Created "${programName}" (${university}) as ${entryStatus}`,
        });

        return NextResponse.json(opportunity, { status: 201 });
    } catch (error) {
        console.error("Error creating admin opportunity:", error);
        return NextResponse.json(
            { error: "Failed to create opportunity" },
            { status: 500 }
        );
    }
}
