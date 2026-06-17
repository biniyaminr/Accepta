import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) return new NextResponse("Unauthorized", { status: 401 });

        const {
            targetOrg,
            programOrRole,
            letterType,
            wordLimit,
            keyPoints,
            manualContext,
        } = await request.json();

        if (!targetOrg || !programOrRole || !letterType) {
            return NextResponse.json(
                { error: "Target organization, program/role, and letter type are required." },
                { status: 400 }
            );
        }

        let context = "";

        if (manualContext) {
            // ── Manual mode: build context from provided fields ──────────────────
            const lines: string[] = [];
            if (manualContext.name) lines.push(`Applicant Name: ${manualContext.name}`);
            if (manualContext.nationality) lines.push(`Nationality: ${manualContext.nationality}`);
            if (manualContext.email) lines.push(`Email: ${manualContext.email}`);
            lines.push("");
            if (manualContext.education?.trim()) {
                lines.push("ACADEMIC BACKGROUND:");
                lines.push(manualContext.education.trim());
                lines.push("");
            }
            if (manualContext.experience?.trim()) {
                lines.push("PROFESSIONAL EXPERIENCE & ACTIVITIES:");
                lines.push(manualContext.experience.trim());
                lines.push("");
            }
            if (manualContext.skills?.trim()) {
                lines.push("SKILLS & QUALIFICATIONS:");
                lines.push(manualContext.skills.trim());
                lines.push("");
            }
            context = lines.join("\n");
        } else {
            // ── Profile mode: fetch from DB ───────────────────────────────────────
            const user = await prisma.user.findUnique({
                where: { userId },
                include: { educations: true, extracurriculars: true, testScores: true },
            });

            if (!user) {
                return NextResponse.json(
                    { error: "No profile found. Please complete your Master Profile first." },
                    { status: 404 }
                );
            }

            const lines: string[] = [];
            lines.push(`Applicant Name: ${user.fullName}`);
            if (user.email) lines.push(`Email: ${user.email}`);
            if (user.phone) lines.push(`Phone: ${user.phone}`);
            if (user.address) lines.push(`Address: ${user.address}`);
            if (user.citizenship) lines.push(`Nationality: ${user.citizenship}`);
            if (user.dob) {
                const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
                lines.push(`Age: ${age}`);
            }
            lines.push("");

            if (user.educations?.length > 0) {
                lines.push("ACADEMIC BACKGROUND:");
                user.educations.forEach((edu: any) => {
                    let eduLine = `- ${edu.institutionName}`;
                    if (edu.major) eduLine += `, ${edu.major}`;
                    if (edu.gpa) eduLine += ` | GPA: ${edu.gpa}`;
                    if (edu.city || edu.country) eduLine += ` | ${[edu.city, edu.country].filter(Boolean).join(", ")}`;
                    if (edu.startDate || edu.gradDate) {
                        const start = edu.startDate ? new Date(edu.startDate).getFullYear() : "?";
                        const end = edu.gradDate ? new Date(edu.gradDate).getFullYear() : "Present";
                        eduLine += ` (${start}–${end})`;
                    }
                    lines.push(eduLine);
                });
                lines.push("");
            }

            if (user.extracurriculars?.length > 0) {
                lines.push("PROFESSIONAL EXPERIENCE & ACTIVITIES:");
                user.extracurriculars.forEach((ec: any) => {
                    let ecLine = `- ${ec.role} at ${ec.organization}`;
                    if (ec.startDate || ec.endDate) {
                        const start = ec.startDate ? new Date(ec.startDate).getFullYear() : "?";
                        const end = ec.endDate ? new Date(ec.endDate).getFullYear() : "Present";
                        ecLine += ` (${start}–${end})`;
                    }
                    if (ec.description) ecLine += `: ${ec.description}`;
                    lines.push(ecLine);
                });
                lines.push("");
            }

            if (user.testScores?.length > 0) {
                lines.push("STANDARDIZED TEST SCORES:");
                user.testScores.forEach((ts: any) => {
                    lines.push(`- ${ts.testType}: ${ts.score}${ts.dateTaken ? ` (${new Date(ts.dateTaken).getFullYear()})` : ""}`);
                });
                lines.push("");
            }

            context = lines.join("\n");
        }

        // ── Prompt ────────────────────────────────────────────────────────────────
        const letterTypeLabel =
            letterType === "motivation" ? "Motivation Letter" :
            letterType === "scholarship" ? "Scholarship Letter" :
            "Cover Letter";

        const wordLimitNote = wordLimit
            ? `The letter must be approximately ${wordLimit} words.`
            : "Aim for 400–500 words.";

        const systemPrompt = `You are an expert academic writing coach specializing in ${letterTypeLabel}s for international students applying to universities and scholarship programs.

Write a compelling, professional, and personalized ${letterTypeLabel} for the applicant applying to "${programOrRole}" at ${targetOrg}.

STRICT RULES:
- Base the letter ONLY on the provided applicant profile. Do not invent facts or credentials.
- Structure: strong opening paragraph, 2–3 body paragraphs (academic background → relevant experience → motivation/fit with this specific program), closing paragraph with a clear call to action.
- Tone: professional, confident, authentic, forward-looking, specific to this program and institution.
- Use the applicant's REAL name — never use placeholder text like [Your Name].
- ${wordLimitNote}
- Do NOT include a date header or address block — just start with "Dear Admissions Committee," or similar.
${keyPoints ? `\nKEY EMPHASIS POINTS (weave these naturally throughout):\n${keyPoints}` : ""}

APPLICANT PROFILE:
${context}`;

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Write the ${letterTypeLabel} for "${programOrRole}" at ${targetOrg}.` },
            ],
            temperature: 0.72,
            max_tokens: 1400,
        });

        const letter = response.choices[0]?.message?.content ?? "";
        return NextResponse.json({ letter }, { status: 200 });

    } catch (error) {
        console.error("Letter generation error:", error);
        const msg = error instanceof Error ? error.message : "";
        if (msg.includes("429") || msg.includes("rate_limit")) {
            return NextResponse.json(
                { error: "AI rate limit reached. Please wait 60 seconds and try again." },
                { status: 429 }
            );
        }
        return NextResponse.json({ error: "Failed to generate letter." }, { status: 500 });
    }
}
