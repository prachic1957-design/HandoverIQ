import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase, isConfigured } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local secured uploads directory for local demo mode
const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

export const storage = {
  isCloudStorage: isConfigured,

  /**
   * Save uploaded file to Supabase Storage or secure local demo disk
   */
  async saveFile({ projectId, filename, buffer, mimeType }) {
    const storagePath = `projects/${projectId}/${filename}`;

    if (isConfigured) {
      try {
        const { data, error } = await supabase.storage
          .from('handover-documents')
          .upload(storagePath, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (error) throw error;

        return {
          storagePath: data.path,
          provider: 'supabase_storage',
          bucket: 'handover-documents'
        };
      } catch (err) {
        console.warn('[HandoverIQ Storage] Supabase Storage upload failed, falling back to local secure storage:', err.message);
      }
    }

    // Local secure demo storage fallback
    const targetDir = path.join(LOCAL_UPLOADS_DIR, 'projects', projectId);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const localFilePath = path.join(targetDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    return {
      storagePath,
      provider: 'local_demo_storage',
      localPath: localFilePath
    };
  },

  /**
   * Retrieve file buffer for secure download
   */
  async getFileBuffer(storagePath) {
    if (isConfigured) {
      try {
        const { data, error } = await supabase.storage
          .from('handover-documents')
          .download(storagePath);

        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch (err) {
        console.warn('[HandoverIQ Storage] Supabase Storage download error:', err.message);
      }
    }

    // Local fallback
    const localFilePath = path.join(LOCAL_UPLOADS_DIR, storagePath);
    if (fs.existsSync(localFilePath)) {
      return fs.readFileSync(localFilePath);
    }

    throw new Error(`File at "${storagePath}" not found in storage.`);
  },

  /**
   * Delete file from storage
   */
  async deleteFile(storagePath) {
    if (isConfigured) {
      try {
        await supabase.storage
          .from('handover-documents')
          .remove([storagePath]);
      } catch (err) {
        console.warn('[HandoverIQ Storage] Supabase file deletion warning:', err.message);
      }
    }

    // Local cleanup
    const localFilePath = path.join(LOCAL_UPLOADS_DIR, storagePath);
    if (fs.existsSync(localFilePath)) {
      try {
        fs.unlinkSync(localFilePath);
      } catch (e) {
        // Ignored if file doesn't exist
      }
    }
    return true;
  }
};

