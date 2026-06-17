import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) return new NextResponse("Unauthorized", { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { tone } = body;

        if (!tone || !["polite", "urgent"].includes(tone)) {
            return NextResponse.json(
                { error: "Tone must be either 'polite' or 'urgent'." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({ where: { userId: clerkId } });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const recommendation = await prisma.recommendation.findFirst({
            where: { id, userId: user.id },
            include: { application: true },
        });

        if (!recommendation) {
            return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
        }

        const programInfo = recommendation.application
            ? `${recommendation.application.programName || recommendation.application.major || "a program"} at ${recommendation.application.universityName}`
            : "a university program";

        const dueDateInfo = recommendation.dueDate
            ? `The letter is due by ${new Date(recommendation.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.`
            : "No specific due date has been set yet.";

        const recommenderAddress = recommendation.recommenderTitle
            ? `${recommendation.recommenderTitle} ${recommendation.recommenderName}`
            : recommendation.recommenderName;

        const toneInstruction = tone === "urgent"
            ? "The tone should be respectful but convey urgency, emphasizing that the deadline is approaching soon."
            : "The tone should be warm, polite, and grateful, gently reminding them about the letter.";

        const systemPrompt = `You are an expert at writing professional academic correspondence. Generate a polite reminder email asking a recommender to submit a recommendation letter.

Context:
- Student name: ${user.fullName}
- Recommender: ${recommenderAddress}
- Relationship: ${recommendation.relationship}
- Application: ${programInfo}
- ${dueDateInfo}
- ${toneInstruction}

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks):
{
  "subject": "Email subject line",
  "body": "Full email body text"
}

The email should be professional, concise (under 200 words for the body), and include a clear call to action. Do not include placeholder brackets.`;

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Generate a ${tone} reminder email for my recommender ${recommenderAddress} about my recommendation letter for ${programInfo}.`,
                },
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        const rawOutput = response.choices[0]?.message?.content || "";

        let parsedResult;
        try {
            const cleanedOutput = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
            parsedResult = JSON.parse(cleanedOutput);
        } catch {
            console.error("Failed to parse Groq output for reminder:", rawOutput);
            return NextResponse.json(
                { error: "Failed to parse AI response. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json(parsedResult, { status: 200 });
    } catch (error) {
        console.error("Reminder API Error:", error);

        const errorMessage = error instanceof Error ? error.message : "";
        if (errorMessage.includes("429") || errorMessage.includes("rate_limit")) {
            return NextResponse.json(
                { error: "AI rate limit reached. Please wait 60 seconds and try again." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "An internal error occurred." },
            { status: 500 }
        );
    }
}
