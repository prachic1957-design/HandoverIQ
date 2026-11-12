import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { db } from '../db/repository.js';
import { storage } from '../services/storage.js';
import { processDocumentBuffer } from '../services/textExtractor.js';

const router = express.Router();

// Configure multer for in-memory upload buffering (max 25MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'docx', 'txt', 'csv'];

    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type (.${ext}). Only PDF, DOCX, TXT, and CSV documents are permitted.`));
    }
  }
});

// ----------------------------------------------------------------------------
// POST /api/documents/upload - Ingest & Process Document
// ----------------------------------------------------------------------------
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'No document file provided. Please attach a PDF, DOCX, TXT, or CSV file.'
      });
    }

    const { project_id, employee_id } = req.body;
    if (!project_id || !project_id.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Project assignment (project_id) is mandatory for knowledge ingestion.'
      });
    }

    // Check project existence
    const project = await db.getProjectById(project_id.trim());
    if (!project) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Project',
        message: `Project ID "${project_id}" does not exist in HandoverIQ.`
      });
    }

    // Check employee existence if provided
    if (employee_id && employee_id.trim()) {
      const emp = await db.getEmployeeById(employee_id.trim());
      if (!emp) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Employee',
          message: `Employee ID "${employee_id}" does not exist in HandoverIQ.`
        });
      }
    }

    // Compute SHA-256 hash for integrity and duplicate prevention
    const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Duplicate check within same project
    const existingDoc = await db.findDocumentByHash(project_id.trim(), fileHash);
    if (existingDoc) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate Document',
        message: `This exact document ("${existingDoc.original_filename}") was already ingested for this project on ${new Date(existingDoc.uploaded_at).toLocaleDateString()}.`
      });
    }

    // Generate secure storage path with timestamp and random UUID
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageUniqueFilename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${sanitizedFilename}`;

    // Save to Supabase Storage or Local Secured Store
    const storageResult = await storage.saveFile({
      projectId: project_id.trim(),
      filename: storageUniqueFilename,
      buffer: file.buffer,
      mimeType: file.mimetype
    });

    // Execute Text Extraction & Source Chunking
    const extractionResult = await processDocumentBuffer(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    // Persist Document Record
    const newDocument = await db.createDocument({
      project_id: project_id.trim(),
      employee_id: (employee_id && employee_id.trim()) ? employee_id.trim() : null,
      original_filename: file.originalname,
      storage_path: storageResult.storagePath,
      mime_type: file.mimetype,
      file_size: file.size,
      file_hash: fileHash,
      extracted_text: extractionResult.fullText || null,
      processing_status: extractionResult.status,
      processing_error: extractionResult.error || null
    });

    // Persist Chunks with Page/Section coordinates
    let savedChunks = [];
    if (extractionResult.chunks && extractionResult.chunks.length > 0) {
      savedChunks = await db.saveDocumentChunks(newDocument.id, extractionResult.chunks);
    }

    res.status(201).json({
      success: true,
      message: extractionResult.status === 'needs_ocr'
        ? 'Document uploaded, but marked for OCR review due to insufficient selectable text.'
        : 'Document ingested, text extracted, and source-traced successfully.',
      data: {
        ...newDocument,
        storage_provider: storageResult.provider,
        chunk_count: savedChunks.length,
        chunks: savedChunks
      }
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// GET /api/documents - List Documents
// ----------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { project_id, employee_id, processing_status, search } = req.query;
    const documents = await db.getAllDocuments({
      project_id,
      employee_id,
      processing_status,
      search
    });

    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// GET /api/documents/:id - Single Document Detail
// ----------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const document = await db.getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// GET /api/documents/:id/chunks - Get Source-Linked Text Chunks
// ----------------------------------------------------------------------------
router.get('/:id/chunks', async (req, res, next) => {
  try {
    const chunks = await db.getDocumentChunks(req.params.id);
    res.json({
      success: true,
      data: chunks,
      count: chunks.length
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// GET /api/documents/:id/download - Secure Document Download
// ----------------------------------------------------------------------------
router.get('/:id/download', async (req, res, next) => {
  try {
    const document = await db.getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const fileBuffer = await storage.getFileBuffer(document.storage_path);

    res.setHeader('Content-Type', document.mime_type || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.original_filename)}"`
    );
    res.setHeader('Content-Length', fileBuffer.length);

    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// DELETE /api/documents/:id - Delete Document & Chunks
// ----------------------------------------------------------------------------
router.delete('/:id', async (req, res, next) => {
  try {
    const document = await db.getDocumentById(req.params.id);
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Delete file from storage bucket/disk
    await storage.deleteFile(document.storage_path);

    // Delete metadata and chunks from database
    const deleted = await db.deleteDocument(req.params.id);

    res.json({
      success: true,
      message: 'Document and extracted knowledge chunks deleted successfully.',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// GET /api/projects/:id/documents - Documents by Project
// ----------------------------------------------------------------------------
export const projectDocumentsHandler = async (req, res, next) => {
  try {
    const documents = await db.getAllDocuments({ project_id: req.params.id });
    res.json({
      success: true,
      data: documents,
      count: documents.length
    });
  } catch (error) {
    next(error);
  }
};

export default router;
