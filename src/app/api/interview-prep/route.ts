import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

export async function POST(request: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await request.json();
        const { programName, universityName, mode, question, answer } = body;

        if (!programName || !universityName) {
            return NextResponse.json(
                { error: "Both program name and university name are required." },
                { status: 400 }
            );
        }

        if (!mode || !["generate", "evaluate"].includes(mode)) {
            return NextResponse.json(
                { error: "Mode must be either 'generate' or 'evaluate'." },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { userId },
            include: {
                educations: true,
                extracurriculars: true,
                testScores: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "No user profile found. Please fill out your Master Profile first." },
                { status: 404 }
            );
        }

        // Build user context string
        let contextString = `Applicant Name: ${user.fullName}\n`;
        contextString += `Citizenship: ${user.citizenship || "Not specified"}\n\n`;

        if (user.educations?.length > 0) {
            contextString += "Education History:\n";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user.educations.forEach((edu: any) => {
                contextString += `- ${edu.institutionName} (${edu.city || ""}, ${edu.country || ""}). Major: ${edu.major || "N/A"}. GPA: ${edu.gpa || "N/A"}.\n`;
            });
            contextString += "\n";
        }

        if (user.extracurriculars?.length > 0) {
            contextString += "Extracurricular Activities & Experience:\n";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user.extracurriculars.forEach((ec: any) => {
                contextString += `- ${ec.role} at ${ec.organization} (${ec.hoursPerWeek} hrs/wk). ${ec.description}\n`;
            });
            contextString += "\n";
        }

        if (user.testScores?.length > 0) {
            contextString += "Test Scores:\n";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            user.testScores.forEach((ts: any) => {
                contextString += `- ${ts.testType}: ${ts.score}\n`;
            });
            contextString += "\n";
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        if (mode === "generate") {
            const systemPrompt = `You are an expert university admissions interviewer. Your task is to generate 5 realistic mock interview questions for a student applying to the ${programName} program at ${universityName}.

Tailor the questions to the student's background and the specific program. The questions should cover different categories to provide comprehensive preparation.

Student Profile:
${contextString}

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks):
{
  "questions": [
    {
      "id": 1,
      "question": "The interview question text",
      "category": "motivation",
      "tip": "A brief tip for answering this question well"
    }
  ]
}

Categories must be one of: "motivation", "academic", "experience", "situational", "technical".
Generate exactly 5 questions, with a good mix of categories. Each question should be specific to the program and the student's background.`;

            const response = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `Generate 5 tailored interview questions for my application to ${programName} at ${universityName}.`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 2000,
            });

            const rawOutput = response.choices[0]?.message?.content || "";

            let parsedResult;
            try {
                const cleanedOutput = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
                parsedResult = JSON.parse(cleanedOutput);
            } catch {
                console.error("Failed to parse Groq output for question generation:", rawOutput);
                return NextResponse.json(
                    { error: "Failed to parse AI response. Please try again." },
                    { status: 500 }
                );
            }

            return NextResponse.json(parsedResult, { status: 200 });
        }

        if (mode === "evaluate") {
            if (!question || !answer) {
                return NextResponse.json(
                    { error: "Both question and answer are required for evaluation." },
                    { status: 400 }
                );
            }

            const systemPrompt = `You are an expert university admissions interview coach. Evaluate the student's answer to the interview question below. The student is applying to ${programName} at ${universityName}.

Student Profile:
${contextString}

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks):
{
  "score": 7,
  "feedback": "Overall feedback about the answer",
  "improvedAnswer": "A rewritten, improved version of their answer",
  "strengths": "What they did well",
  "weaknesses": "What they could improve"
}

The score must be an integer from 1 to 10. Be constructive and specific in your feedback.`;

            const response = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `Interview Question: "${question}"\n\nMy Answer: "${answer}"\n\nPlease evaluate my response.`,
                    },
                ],
                temperature: 0.3,
                max_tokens: 1500,
            });

            const rawOutput = response.choices[0]?.message?.content || "";

            let parsedResult;
            try {
                const cleanedOutput = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
                parsedResult = JSON.parse(cleanedOutput);
            } catch {
                console.error("Failed to parse Groq output for evaluation:", rawOutput);
                return NextResponse.json(
                    { error: "Failed to parse AI evaluation. Please try again." },
                    { status: 500 }
                );
            }

            return NextResponse.json(parsedResult, { status: 200 });
        }
    } catch (error) {
        console.error("Interview Prep API Error:", error);

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
