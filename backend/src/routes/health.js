import express from 'express';
import { isConfigured } from '../config/supabase.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'online',
    product: 'HandoverIQ',
    team: 'ROGUENOVA',
    tagline: 'Preserve Knowledge. Power Continuity.',
    version: '1.0.0-phase1',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: isConfigured ? 'connected' : 'pending_configuration',
      geminiAI: process.env.GEMINI_API_KEY ? 'ready' : 'pending_configuration'
    },
    phase: 'PHASE 1 - Foundation & Dashboard'
  });
});

export default router;

