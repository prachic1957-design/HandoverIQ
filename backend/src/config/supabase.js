import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

let supabase = null;
let isConfigured = false;

const isPlaceholder = config.supabase.url.includes('your-project-ref') || config.supabase.url.includes('your-project.supabase.co');

if (config.supabase.url && !isPlaceholder && (config.supabase.serviceRoleKey || config.supabase.anonKey)) {
  try {
    const key = config.supabase.serviceRoleKey || config.supabase.anonKey;
    supabase = createClient(config.supabase.url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    isConfigured = true;
    console.log('[HandoverIQ] Supabase client initialized successfully.');
  } catch (error) {
    console.warn('[HandoverIQ] Warning: Failed to initialize Supabase client:', error.message);
  }
} else {
  console.log('[HandoverIQ] Notice: Supabase credentials not provided in .env yet. Running in mock/ready mode.');
}

export { supabase, isConfigured };

