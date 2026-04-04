import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';

export async function POST(req: NextRequest) {
  try {
    console.log('--- 📄 Modern Resume Extraction (unpdf) ---');
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.warn('⚠️ No file found in request');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log(`--- 📥 Processing: ${file.name} (${file.size} bytes) ---`);
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('--- 🧠 Parsing PDF with unpdf... ---');
    // Extract text from PDF buffer
    // Note: mergePages: true ensures we get a single string instead of an array
    const { text } = await extractText(arrayBuffer, { mergePages: true });
    
    if (!text || (Array.isArray(text) && text.length === 0)) {
      console.error('❌ unpdf returned no text');
      throw new Error('PDF parsing failed or returned empty text');
    }

    const trimmedText = text.trim();
    console.log(`--- ✅ Extraction Success! (${trimmedText.length} chars) ---`);

    // Limit text size to avoid JWT/Token overflow (e.g., first 5000 characters)
    const truncatedText = trimmedText.substring(0, 5000);

    return NextResponse.json({ text: truncatedText });
  } catch (error: any) {
    console.error('❌ Resume extraction error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error: ' + (error.message || 'Unknown') }, { status: 500 });
  }
}
