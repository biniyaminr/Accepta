import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
    try {
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { essay, essayType, targetProgram } = body;

        if (!essay || typeof essay !== "string") {
            return NextResponse.json(
                { error: "Essay text is required." },
                { status: 400 }
            );
        }

        const wordCount = essay.trim().split(/\s+/).length;
        if (wordCount < 50) {
            return NextResponse.json(
                { error: "Essay is too short. Please enter at least 50 words." },
                { status: 400 }
            );
        }

        // Fetch user profile for context
        const user = await prisma.user.findUnique({
            where: { userId: clerkId },
            include: {
                educations: true,
                extracurriculars: true,
                testScores: true,
            },
        });

        const profileContext = user
            ? `
APPLICANT CONTEXT:
- Name: ${user.fullName || "N/A"}
- Nationality: ${user.citizenship || "N/A"}
- Education: ${user.educations?.map((e) => `${e.institutionName} - ${e.major} (GPA: ${e.gpa || "N/A"})`).join("; ") || "N/A"}
- Extracurriculars: ${user.extracurriculars?.map((e: any) => `${e.role} at ${e.organization}`).join(", ") || "N/A"}
- Test Scores: ${user.testScores?.map((t: any) => `${t.testType}: ${t.score}`).join(", ") || "N/A"}
`
            : "";

        const essayTypeContext = essayType ? `\nESSAY TYPE: ${essayType}` : "";
        const programContext = targetProgram ? `\nTARGET PROGRAM: ${targetProgram}` : "";

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.3,
            max_tokens: 4000,
            messages: [
                {
                    role: "system",
                    content: `You are an expert university admissions essay reviewer with years of experience evaluating applications for top universities worldwide. Your job is to provide detailed, constructive feedback on application essays.

Analyze the essay thoroughly and return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
    "overallScore": <number 0-100>,
    "grammar": { "score": <number 0-100>, "issues": [<string>, ...] },
    "structure": { "score": <number 0-100>, "feedback": "<string>" },
    "tone": { "score": <number 0-100>, "feedback": "<string>" },
    "content": { "score": <number 0-100>, "feedback": "<string>" },
    "strengths": [<string>, ...],
    "weaknesses": [<string>, ...],
    "suggestions": [<string>, ...],
    "revisedVersion": "<string with the improved full essay>"
}

Scoring guidelines:
- 90-100: Exceptional, publication-worthy
- 80-89: Strong, minor improvements needed
- 70-79: Good, some notable areas for improvement
- 60-69: Average, significant revisions recommended
- Below 60: Needs substantial rework

Be specific in your feedback. Reference particular sentences or paragraphs. The revised version should preserve the applicant's voice while fixing all identified issues.`,
                },
                {
                    role: "user",
                    content: `Please review the following university application essay and provide your detailed analysis.
${profileContext}${essayTypeContext}${programContext}

ESSAY:
${essay}`,
                },
            ],
        });

        const responseText = completion.choices[0]?.message?.content?.trim() || "";

        // Parse the JSON response, handling potential markdown wrapping
        let cleanedText = responseText;
        if (cleanedText.startsWith("```json")) {
            cleanedText = cleanedText.slice(7);
        } else if (cleanedText.startsWith("```")) {
            cleanedText = cleanedText.slice(3);
        }
        if (cleanedText.endsWith("```")) {
            cleanedText = cleanedText.slice(0, -3);
        }
        cleanedText = cleanedText.trim();

        const review = JSON.parse(cleanedText);

        return NextResponse.json({ review }, { status: 200 });
    } catch (error) {
        console.error("Essay Review Error:", error);

        const errorMessage = error instanceof Error ? error.message : "";

        if (errorMessage.includes("429") || errorMessage.includes("rate_limit")) {
            return NextResponse.json(
                { error: "AI rate limit reached. Please wait 60 seconds and try again." },
                { status: 429 }
            );
        }

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { error: "Failed to parse AI response. Please try again." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: "Failed to review essay. Please try again." },
            { status: 500 }
        );
    }
}
