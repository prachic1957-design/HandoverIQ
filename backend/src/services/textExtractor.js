import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
const PDFParse = pdfModule.PDFParse || pdfModule.default?.PDFParse || pdfModule;

/**
 * HandoverIQ Text Extraction & Source Traceability Service
 * Team: ROGUENOVA
 * 
 * Supports: PDF (selectable text + Gemini Multimodal OCR), DOCX, TXT, CSV
 * Extracts text and splits into source-linked chunks with strict page, section, or row references.
 */

// Helper: Split text into traceable chunks
export function createChunks(text, metadata = {}) {
  const { defaultPage = null, defaultSection = null, isOcr = false } = metadata;
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
        section_reference: defaultSection || `Paragraph ${chunkIdx}`,
        is_ocr: isOcr
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
      section_reference: defaultSection || `Paragraph ${chunkIdx + 1}`,
      is_ocr: isOcr
    });
  }

  return chunks;
}

/**
 * Split OCR text into page-aware traceable chunks
 */
export function parseOcrTextToChunks(ocrText) {
  const cleanText = ocrText.trim();
  const chunks = [];
  let chunkIndex = 0;

  // Check for multi-page headers: --- PAGE <num> ---
  const hasPageHeaders = /---\s*PAGE\s+\d+\s*---/i.test(cleanText);

  if (hasPageHeaders) {
    const segments = cleanText.split(/---\s*PAGE\s+(\d+)\s*---/i);
    // segments[0] is preamble, segments[1] is pageNum, segments[2] is pageText...
    for (let i = 1; i < segments.length; i += 2) {
      const pageNum = parseInt(segments[i], 10) || 1;
      const pageText = (segments[i + 1] || '').trim();
      if (!pageText) continue;

      const pageChunks = createChunks(pageText, {
        defaultPage: pageNum,
        defaultSection: `Page ${pageNum} (OCR)`,
        isOcr: true
      });

      for (const pc of pageChunks) {
        chunks.push({
          ...pc,
          chunk_index: chunkIndex++,
          is_ocr: true
        });
      }
    }
  }

  // Fallback if no page headers or if regex parsing produced 0 chunks
  if (chunks.length === 0) {
    const rawChunks = createChunks(cleanText, {
      defaultPage: 1,
      defaultSection: 'Page 1 (OCR)',
      isOcr: true
    });
    for (const rc of rawChunks) {
      chunks.push({
        ...rc,
        chunk_index: chunkIndex++,
        is_ocr: true
      });
    }
  }

  if (chunks.length === 0) {
    return {
      status: 'needs_ocr',
      fullText: cleanText,
      chunks: [],
      error: 'OCR text could not be chunked into readable segments.'
    };
  }

  return {
    status: 'completed',
    fullText: cleanText,
    chunks,
    is_ocr: true,
    ocr_extracted_at: new Date().toISOString()
  };
}

/**
 * Perform Optical Character Recognition (OCR) on scanned / image-only PDF buffer.
 * Uses Google GenAI SDK (multimodal PDF document understanding).
 */
export async function performPdfOcr(buffer, options = {}) {
  // Check if simulated OCR text was passed (for deterministic tests)
  if (options.mockOcrText !== undefined) {
    const text = (options.mockOcrText || '').trim();
    if (text === 'NO_READABLE_TEXT' || text.length < 25) {
      return {
        status: 'needs_ocr',
        fullText: text,
        chunks: [],
        error: 'OCR extraction attempted, but no readable text could be deciphered from the document image (< 25 characters).'
      };
    }
    return parseOcrTextToChunks(text);
  }

  // Check if failure simulation requested (for error state tests)
  if (options.simulateOcrFailure) {
    return {
      status: 'needs_ocr',
      fullText: '',
      chunks: [],
      error: `OCR extraction failed: ${options.simulateOcrFailure}. Please retry.`
    };
  }

  // Verify Gemini configuration
  if (!config.gemini?.apiKey || !config.gemini.apiKey.trim()) {
    return {
      status: 'needs_ocr',
      fullText: '',
      chunks: [],
      error: 'Scanned or image-only PDF detected: insufficient selectable text (< 25 characters). Optical Character Recognition (OCR) required, but GEMINI_API_KEY is not configured.'
    };
  }

  const candidateModels = [
    config.gemini.model || 'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.5-flash'
  ];

  const uniqueModels = Array.from(new Set(candidateModels));
  const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  let lastError = null;

  for (const model of uniqueModels) {
    const controller = new AbortController();
    const timeoutMs = 60000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[HandoverIQ OCR] Attempting multimodal PDF OCR with ${model}...`);
      const base64Data = buffer.toString('base64');

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'application/pdf'
            }
          },
          'You are a high-precision Optical Character Recognition (OCR) engine. Extract all visible text from this document verbatim. If multi-page, delimit each page with "--- PAGE <number> ---" (e.g. --- PAGE 1 ---). Preserve numbers, tables, lists, and headers. If the document is blank or contains no readable text, respond with "NO_READABLE_TEXT".'
        ],
        config: {
          abortSignal: controller.signal,
          temperature: 0.1
        }
      });

      clearTimeout(timeoutId);

      const rawText = (response.text || '').trim();
      if (!rawText || rawText === 'NO_READABLE_TEXT' || rawText.length < 25) {
        return {
          status: 'needs_ocr',
          fullText: rawText === 'NO_READABLE_TEXT' ? '' : rawText,
          chunks: [],
          error: 'OCR extraction attempted, but no readable text could be deciphered from the document image (< 25 characters).'
        };
      }

      return parseOcrTextToChunks(rawText);
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
      lastError = isAbort
        ? new Error(`OCR extraction timed out after ${Math.round(timeoutMs / 1000)} seconds. Service busy.`)
        : err;
      console.warn(`[HandoverIQ OCR] Model ${model} failed: ${lastError.message}`);

      // Stop immediately on authentication, permission, or invalid key errors without hiding behind fallback models
      const errMsg = (err.message || '').toLowerCase();
      const isAuthError =
        err.status === 401 ||
        err.status === 403 ||
        errMsg.includes('api_key_invalid') ||
        errMsg.includes('api key not valid') ||
        errMsg.includes('permission_denied') ||
        errMsg.includes('unauthenticated');

      if (isAuthError) {
        return {
          status: 'needs_ocr',
          fullText: '',
          chunks: [],
          error: `OCR extraction authentication error: API key is invalid or unauthorized (${err.message}).`
        };
      }
    }
  }

  return {
    status: 'needs_ocr',
    fullText: '',
    chunks: [],
    error: `OCR extraction failed (${lastError?.message || 'Unknown error'}). Please retry or upload a text-native document.`
  };
}

/**
 * Extract text from PDF buffer
 * Preserves page numbering and runs OCR when selectable text is insufficient (< 25 characters)
 */
async function extractPDF(buffer, options = {}) {
  try {
    const uint8Data = new Uint8Array(buffer);
    const parser = new PDFParse(uint8Data);
    await parser.load();
    const result = await parser.getText();

    const fullText = result.text || '';
    const cleanText = fullText.replace(/-- \d+ of \d+ --/g, '').replace(/\s+/g, ' ').trim();

    // Check if extraction is empty or too short (scanned PDF detection)
    if (cleanText.length < 25) {
      console.log('[HandoverIQ PDF Parser] Insufficient selectable text detected (< 25 chars). Invoking OCR engine...');
      return await performPdfOcr(buffer, options);
    }

    const chunks = [];
    let chunkIndex = 0;

    if (result.pages && Array.isArray(result.pages) && result.pages.length > 0) {
      for (const p of result.pages) {
        const pageText = (p.text || '').trim();
        if (!pageText) continue;

        const pageSubChunks = createChunks(pageText, {
          defaultPage: p.num,
          defaultSection: `Page ${p.num}`,
          isOcr: false
        });

        for (const sc of pageSubChunks) {
          chunks.push({
            ...sc,
            chunk_index: chunkIndex++,
            is_ocr: false
          });
        }
      }
    } else {
      const rawChunks = createChunks(cleanText, {
        defaultPage: result.total >= 1 ? 1 : null,
        defaultSection: 'Page coordinate unavailable',
        isOcr: false
      });
      for (const rc of rawChunks) {
        chunks.push({
          ...rc,
          chunk_index: chunkIndex++,
          is_ocr: false
        });
      }
    }

    return {
      status: 'completed',
      fullText: cleanText,
      chunks,
      totalPages: result.total || 1,
      is_ocr: false
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
export async function processDocumentBuffer(buffer, mimeType, filename, options = {}) {
  const ext = filename.split('.').pop()?.toLowerCase();

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    return await extractPDF(buffer, options);
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
