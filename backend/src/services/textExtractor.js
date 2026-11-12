import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
const PDFParse = pdfModule.PDFParse || pdfModule.default?.PDFParse || pdfModule;

/**
 * HandoverIQ Text Extraction & Source Traceability Service
 * Team: ROGUENOVA
 * 
 * Supports: PDF, DOCX, TXT, CSV
 * Extracts text and splits into source-linked chunks with strict page, section, or row references.
 */

// Helper: Split text into traceable chunks
export function createChunks(text, metadata = {}) {
  const { defaultPage = null, defaultSection = null } = metadata;
  const chunks = [];
  
  if (!text || !text.trim()) {
    return chunks;
  }

  const maxChunkSize = 750;
  const overlapSize = 100;
  
  const paragraphs = text.split(/\n\s*\n/);
  let currentBuffer = '';
  let chunkIdx = 0;

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx].trim();
    if (!para) continue;

    if (currentBuffer.length + para.length > maxChunkSize && currentBuffer.length > 0) {
      chunks.push({
        chunk_index: chunkIdx++,
        extracted_content: currentBuffer.trim(),
        page_number: defaultPage,
        section_reference: defaultSection || `Paragraph ${chunkIdx}`
      });
      currentBuffer = currentBuffer.slice(-overlapSize) + '\n\n' + para;
    } else {
      currentBuffer = currentBuffer ? currentBuffer + '\n\n' + para : para;
    }
  }

  if (currentBuffer.trim()) {
    chunks.push({
      chunk_index: chunkIdx,
      extracted_content: currentBuffer.trim(),
      page_number: defaultPage,
      section_reference: defaultSection || `Paragraph ${chunkIdx + 1}`
    });
  }

  return chunks;
}

/**
 * Extract text from PDF buffer
 * Preserves page numbering and detects scanned documents needing OCR
 */
async function extractPDF(buffer) {
  try {
    const uint8Data = new Uint8Array(buffer);
    const parser = new PDFParse(uint8Data);
    await parser.load();
    const result = await parser.getText();

    const fullText = result.text || '';
    const cleanText = fullText.replace(/-- \d+ of \d+ --/g, '').replace(/\s+/g, ' ').trim();

    // Check if extraction is empty or too short (scanned PDF detection)
    if (cleanText.length < 25) {
      return {
        status: 'needs_ocr',
        fullText: cleanText,
        chunks: [],
        error: 'Scanned or image-only PDF detected: insufficient selectable text (< 25 characters). Optical Character Recognition (OCR) required.'
      };
    }

    const chunks = [];
    let chunkIndex = 0;

    if (result.pages && Array.isArray(result.pages) && result.pages.length > 0) {
      for (const p of result.pages) {
        const pageText = (p.text || '').trim();
        if (!pageText) continue;

        const pageSubChunks = createChunks(pageText, {
          defaultPage: p.num,
          defaultSection: `Page ${p.num}`
        });

        for (const sc of pageSubChunks) {
          chunks.push({
            ...sc,
            chunk_index: chunkIndex++
          });
        }
      }
    } else {
      const rawChunks = createChunks(cleanText, {
        defaultPage: result.total >= 1 ? 1 : null,
        defaultSection: 'Page coordinate unavailable'
      });
      chunks.push(...rawChunks);
    }

    return {
      status: 'completed',
      fullText: cleanText,
      chunks,
      totalPages: result.total || 1
    };
  } catch (err) {
    return {
      status: 'failed',
      fullText: '',
      chunks: [],
      error: `PDF parsing error: ${err.message}`
    };
  }
}

/**
 * Extract text from DOCX (Word) buffer
 */
async function extractDOCX(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const fullText = result.value || '';
    const cleanText = fullText.trim();

    if (!cleanText) {
      return {
        status: 'failed',
        fullText: '',
        chunks: [],
        error: 'Word document appears to be empty or unreadable.'
      };
    }

    const chunks = createChunks(cleanText, {
      defaultPage: null, // Word docs do not have native fixed pages
      defaultSection: 'Document Body'
    });

    return {
      status: 'completed',
      fullText: cleanText,
      chunks
    };
  } catch (err) {
    return {
      status: 'failed',
      fullText: '',
      chunks: [],
      error: `DOCX extraction error: ${err.message}`
    };
  }
}

/**
 * Extract text from TXT buffer
 */
function extractTXT(buffer) {
  try {
    const text = buffer.toString('utf-8').trim();
    if (!text) {
      return {
        status: 'failed',
        fullText: '',
        chunks: [],
        error: 'Plain text file is empty.'
      };
    }

    const chunks = createChunks(text, {
      defaultPage: null,
      defaultSection: 'Text Section'
    });

    return {
      status: 'completed',
      fullText: text,
      chunks
    };
  } catch (err) {
    return {
      status: 'failed',
      fullText: '',
      chunks: [],
      error: `TXT decoding error: ${err.message}`
    };
  }
}

/**
 * Extract structured CSV preserving rows and column header context
 */
function extractCSV(buffer) {
  try {
    const text = buffer.toString('utf-8').trim();
    if (!text) {
      return {
        status: 'failed',
        fullText: '',
        chunks: [],
        error: 'CSV file is empty.'
      };
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      return {
        status: 'failed',
        fullText: '',
        chunks: [],
        error: 'CSV contains no rows.'
      };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];
    const chunks = [];

    let formattedDocument = `CSV Dataset Schema: [${headers.join(' | ')}]\n\n`;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
      const rowMapping = headers.map((h, idx) => `${h}: "${cols[idx] || ''}"`).join(', ');
      const rowText = `Row ${i}: { ${rowMapping} }`;
      rows.push(rowText);
      formattedDocument += rowText + '\n';
    }

    const rowsPerChunk = 5;
    let chunkIdx = 0;
    for (let i = 0; i < rows.length; i += rowsPerChunk) {
      const slice = rows.slice(i, i + rowsPerChunk);
      const startRow = i + 1;
      const endRow = Math.min(i + rowsPerChunk, rows.length);
      chunks.push({
        chunk_index: chunkIdx++,
        extracted_content: slice.join('\n'),
        page_number: null,
        section_reference: `Rows ${startRow}-${endRow}`
      });
    }

    return {
      status: 'completed',
      fullText: formattedDocument.trim(),
      chunks
    };
  } catch (err) {
    return {
      status: 'failed',
      fullText: '',
      chunks: [],
      error: `CSV processing error: ${err.message}`
    };
  }
}

/**
 * Main Text Extraction Dispatcher
 */
export async function processDocumentBuffer(buffer, mimeType, filename) {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return await extractPDF(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ext === 'docx'
  ) {
    return await extractDOCX(buffer);
  }

  if (mimeType === 'text/plain' || ext === 'txt') {
    return extractTXT(buffer);
  }

  if (
    mimeType === 'text/csv' ||
    mimeType === 'application/vnd.ms-excel' ||
    ext === 'csv'
  ) {
    return extractCSV(buffer);
  }

  return {
    status: 'failed',
    fullText: '',
    chunks: [],
    error: `Unsupported file format (.${ext}). HandoverIQ supports PDF, DOCX, TXT, and CSV files.`
  };
}
