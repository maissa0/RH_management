import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

async function extractTextFromPDF(pdfBuffer: Buffer) {
  const uint8Array = new Uint8Array(pdfBuffer);
  
  try {
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    const textContent: string[] = [];

    // Process all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      // Extract text with proper spacing
      const pageText = content.items
        .map((item: any) => {
          // Handle different types of text items
          if ('str' in item) {
            return item.str;
          }
          return '';
        })
        .join(' ');

      textContent.push(pageText);
    }

    return textContent.join('\n\n');
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF document');
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.type.includes('pdf')) {
      return Response.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractTextFromPDF(buffer);

    return Response.json({ text });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return Response.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}