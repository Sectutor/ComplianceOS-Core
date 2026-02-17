import 'dotenv/config';
import { PDFParse } from "pdf-parse";
import * as fs from 'fs';

async function testPDF() {
    console.log("Testing PDF Parsing locally...");
    try {
        // Create a dummy PDF buffer or read a small one if exists
        // Since I don't have a PDF, I'll just check if the class can be instantiated
        const parser = new PDFParse({ data: Buffer.from('%PDF-1.4...') });
        console.log("PDFParse instantiated successfully.");

        // This will likely fail with a real error if the buffer is invalid, 
        // which is better than hanging.
        try {
            await parser.getText();
        } catch (e) {
            console.log("Expected error from invalid PDF data:", (e as any).message);
        }

    } catch (e) {
        console.error("PDFParse instantiation failed:", e);
    }
}

testPDF();
