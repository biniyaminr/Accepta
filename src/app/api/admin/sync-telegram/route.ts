import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";
import { load } from "cheerio";
import { getAdmin, logAudit } from "@/lib/admin";

// Admin-only: scrape Telegram scholarship channels, AI-extract structured
// opportunities, and land them as GLOBAL drafts (userId: null, NEEDS_REVIEW).
// Nothing reaches the student feed until an admin publishes it from the
// data-entry console — this is the intake side of the review pipeline.

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const CHANNELS = [
    "OHUB4AllET",
    "scholarshipscorner",
    "mulukenbafa",
    "BrightScholarship",
    "Global_Dreamss",
];

export async function GET() {
    const admin = await getAdmin();
    if (!admin) return new NextResponse("Not Found", { status: 404 });

    try {
        let addCount = 0;

        for (const channel of CHANNELS) {
            console.log(`Syncing channel: ${channel}`);

            const response = await fetch(`https://t.me/s/${channel}`);
            const html = await response.text();
            const $ = load(html);

            // Extract text from the last 3 messages
            const posts = $(".tgme_widget_message_text")
                .slice(-3)
                .map((i, el) => $(el).text())
                .get()
                .join("\n\n---\n\n");

            if (!posts) {
                console.log(`No posts found for ${channel}`);
                continue;
            }

            // AI Parser with Groq
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content:
                            "You are an AI data extractor. Read these Telegram posts and extract scholarship/university opportunities. Return strictly a JSON object with an array named opportunities. Each object must have: university (string), programName (string), description (short string), isScholarship (boolean), isFreeApp (boolean), and link (URL string). If a post doesn't have a clear university and link, ignore it.",
                    },
                    {
                        role: "user",
                        content: posts,
                    },
                ],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" },
            });

            const result = JSON.parse(completion.choices[0].message.content || '{"opportunities": []}');
            const opportunities = result.opportunities || [];

            for (const opt of opportunities) {
                if (!opt.university || !opt.link) continue;

                // Dedupe against the global pool (any status) so re-syncs
                // never resurrect something already reviewed or deleted-then-readded.
                const existing = await prisma.opportunity.findFirst({
                    where: {
                        link: opt.link,
                        userId: null,
                    },
                });

                if (!existing) {
                    await prisma.opportunity.create({
                        data: {
                            userId: null, // global entry — in the review queue
                            university: opt.university,
                            programName: opt.programName || "Unknown Program",
                            description: opt.description,
                            isScholarship: !!opt.isScholarship,
                            isFreeApp: !!opt.isFreeApp,
                            link: opt.link,
                            status: "NEEDS_REVIEW",
                        },
                    });
                    addCount++;
                }
            }
        }

        if (addCount > 0) {
            await logAudit({
                actorEmail: admin.email,
                action: "CREATE",
                entity: "Opportunity",
                summary: `Telegram sync queued ${addCount} program${addCount === 1 ? "" : "s"} for review`,
            });
        }

        return NextResponse.json({
            success: true,
            addedCount: addCount,
        });
    } catch (error) {
        console.error("Error syncing Telegram:", error);
        return NextResponse.json(
            { error: "Failed to sync Telegram opportunities" },
            { status: 500 }
        );
    }
}
