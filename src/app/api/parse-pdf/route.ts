import { NextResponse } from "next/server";
import PDFParser from "pdf2json";

export async function POST(req: Request) {
  try {
    console.log("1. API hit. Extracting file...");
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("2. Buffer ready. Booting pdf2json...");

    const text = await new Promise<string>((resolve, reject) => {
      // The '1' flag tells it to extract pure raw text, stripping out heavy visual data
      const pdfParser = new PDFParser(null, true); 
      
      pdfParser.on("pdfParser_dataError", (errData: any) => {
         console.error("Parser Error:", errData.parserError);
         reject(errData.parserError);
      });
      
      pdfParser.on("pdfParser_dataReady", () => {
         console.log("3. Parse complete!");
         // Clean up the weird URL-encoded spaces pdf2json sometimes leaves behind
         const rawText = decodeURIComponent(pdfParser.getRawTextContent());
         resolve(rawText);
      });

      pdfParser.parseBuffer(buffer);
    });

    console.log("4. SUCCESS! Characters extracted:", text.length);
    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("CRITICAL ERROR:", error);
    return NextResponse.json({ error: error.message || "Parsing failed" }, { status: 500 });
  }
}
