import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Ensure backend/.env is loaded even if process.cwd() is project root
if (!process.env.GEMINI_API_KEY) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(currentDir, '../../.env') });
}

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
};
