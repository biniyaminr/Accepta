import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const targetProgram = formData.get("targetProgram") as string;
    const targetUniversity = formData.get("targetUniversity") as string;

    if (!file || !targetProgram) throw new Error("Missing file or program details.");
    if (!process.env.GEMINI_API_KEY || !process.env.GROQ_API_KEY) {
      throw new Error("Missing API Keys for the Hybrid Pipeline.");
    }

    // 1. Prepare the PDF for Gemini Vision
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    // ==========================================
    // STAGE 1: GEMINI FLASH (The "Eyes")
    // ==========================================
    console.log("Stage 1: Gemini Flash is visually reading the PDF...");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const visionModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const extractionPrompt = `
      Read this resume PDF visually. Extract all of the text accurately. 
      Preserve the logical flow of information (Contact, Summary, Experience, Education, Skills).
      Output ONLY the raw extracted text, with no conversational filler.
    `;

    const visionResult = await visionModel.generateContent([
      extractionPrompt,
      { inlineData: { data: base64Data, mimeType: "application/pdf" } }
    ]);

    const extractedText = visionResult.response.text();
    if (!extractedText || extractedText.trim() === "") {
      throw new Error("Gemini failed to extract text from the PDF.");
    }
    console.log("Stage 1 Complete! Text extracted successfully.");

    // ==========================================
    // STAGE 2: GROQ LLAMA 3.3 (The "Brain")
    // ==========================================
    console.log("Stage 2: Groq is tailoring the resume and structuring JSON...");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const tailoringPrompt = `
      You are an expert university admissions consultant. Rewrite the provided raw resume text to make the applicant the perfect fit for a ${targetProgram} program at ${targetUniversity}.
      
      Guidelines:
      - Maintain their actual work history and truthfulness.
      - Highlight skills and metrics relevant to ${targetProgram}.
      - If any info (like phone/email) is missing, use an empty string.
      
      You MUST return the output ONLY as a valid JSON object matching this exact schema:
      {
        "fullName": "...",
        "email": "...",
        "phone": "...",
        "location": "...",
        "professionalSummary": "A highly persuasive 3-sentence summary tailored to the target program...",
        "education": [ { "degree": "...", "institution": "...", "year": "..." } ],
        "skills": ["skill1", "skill2"],
        "experience": [ { "role": "...", "company": "...", "date": "...", "location": "...", "bullets": ["...", "..."] } ]
      }
      
      Raw Resume Text:
      ${extractedText}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant that outputs strictly in JSON." },
        { role: "user", content: tailoringPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" }, 
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "{}";
    console.log("Stage 2 Complete! Groq generated the JSON.");

    const resumeData = JSON.parse(responseText);
    return NextResponse.json(resumeData);

  } catch (error: any) {
    console.error("HYBRID PIPELINE ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to process PDF" }, { status: 500 });
  }
}
