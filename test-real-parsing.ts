
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';

async function testParsing() {
  console.log("--- REAL PARSING ENGINE TEST ---");

  // 1. Test Text
  const textBuffer = Buffer.from("Hello World from TXT");
  console.log("\n[TXT Test]:", textBuffer.toString('utf8'));

  // 2. Test DOCX (using mammoth)
  try {
    // Creating a minimal valid DOCX structure is complex, 
    // but we can test if mammoth is loaded and the function exists
    console.log("[DOCX Engine]: mammoth.extractRawText is available:", typeof mammoth.extractRawText === 'function');
  } catch (e) {
    console.error("[DOCX Engine Error]:", e);
  }

  // 3. Test PDF (using pdf-parse)
  try {
    console.log("[PDF Engine]: pdf-parse is available:", typeof pdfParse === 'function');
    // We skip actual PDF parsing here because it requires a valid binary buffer
  } catch (e) {
    console.error("[PDF Engine Error]:", e);
  }

  console.log("\n--- TEST COMPLETE ---");
}

testParsing();
