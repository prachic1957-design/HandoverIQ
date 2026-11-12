import express from 'express';
import { isConfigured } from '../config/supabase.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    status: 'online',
    product: 'HandoverIQ',
    team: 'ROGUENOVA',
    tagline: 'Preserve Knowledge. Power Continuity.',
    version: '1.5.0-phase5',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      database: isConfigured ? 'connected' : 'pending_configuration',
      geminiAI: process.env.GEMINI_API_KEY ? 'ready' : 'pending_configuration'
    },
    phase: 'PHASE 5 - Handover Package, Manager Review & Replacement Briefing'
  });
});

export default router;

