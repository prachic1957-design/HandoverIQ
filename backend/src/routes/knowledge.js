// Knowledge Reconstruction Routes (Phase 4)
// Implements API endpoints for AI knowledge reconstruction using Gemini.

import express from 'express';
import { repository } from '../db/repository.js';
import { reconstructKnowledge } from '../services/geminiService.js';
import { isAuthenticated } from '../middleware/auth.js'; // assumes auth middleware exists

const router = express.Router();

/**
 * POST /api/knowledge/analyze
 * Body: { project_id, employee_id, model_name? }
 */
router.post('/analyze', isAuthenticated, async (req, res) => {
  try {
    const { project_id, employee_id, model_name, mockResponse } = req.body;
    if (!project_id || !employee_id) {
      return res.status(400).json({ error: 'project_id and employee_id are required' });
    }
    const [project, employee, chunks] = await Promise.all([
      repository.getProjectById(project_id),
      repository.getEmployeeById(employee_id),
      repository.getDocumentChunksByProject(project_id)
    ]);
    if (!project || !employee) {
      return res.status(404).json({ error: 'Project or Employee not found' });
    }
    const aiResult = await reconstructKnowledge({ employee, project, allChunks: chunks, mockResponse: mockResponse || null, model_name });
    const analysis = await repository.createKnowledgeAnalysis({
      project_id,
      employee_id,
      model_name: model_name || aiResult.model_name,
      analysis_summary: aiResult.analysis_summary,
      structured_result: aiResult.structured_result
    });
    const findingsPayload = [];
    const { employee_work_history = [], milestones = [], pending_tasks = [], risks_and_blockers = [], knowledge_gaps = [] } = aiResult.structured_result;
    const addFindings = (type, items) => {
      items.forEach(item => {
        findingsPayload.push({
          finding_type: type,
          title: item.title || item.work_item || 'Untitled',
          description: item.description || item.evidence_description || '',
          status: item.status || null,
          confidence: item.confidence || 'medium',
          evidence_references: item.evidence_references || []
        });
      });
    };
    addFindings('work_history', employee_work_history);
    addFindings('milestone', milestones);
    addFindings('pending_task', pending_tasks);
    addFindings('risk', risks_and_blockers);
    addFindings('knowledge_gap', knowledge_gaps);
    const createdFindings = await repository.createKnowledgeFindings(analysis.id, findingsPayload);
    res.status(201).json({ analysis, findings: createdFindings });
  } catch (err) {
    console.error('Knowledge analysis error:', err);
    const status = err.code === 'GEMINI_NOT_CONFIGURED' ? 500 : 500;
    res.status(status).json({ error: err.message });
  }
});

// List analyses
router.get('/analyses', isAuthenticated, async (req, res) => {
  try {
    const { project_id, employee_id } = req.query;
    const analyses = await repository.listKnowledgeAnalyses({ project_id, employee_id });
    res.json(analyses);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get single analysis
router.get('/analyses/:id', isAuthenticated, async (req, res) => {
  try {
    const analysis = await repository.getKnowledgeAnalysisById(req.params.id);
    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
    res.json(analysis);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Get findings for an analysis
router.get('/analyses/:id/findings', isAuthenticated, async (req, res) => {
  try {
    const findings = await repository.getKnowledgeFindingsByAnalysis(req.params.id);
    res.json(findings);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Review a finding
router.patch('/findings/:id/review', isAuthenticated, async (req, res) => {
  try {
    const { review_status, reviewed_by, reviewer_notes } = req.body;
    if (!review_status) return res.status(400).json({ error: 'review_status required' });
    const updated = await repository.reviewKnowledgeFinding(req.params.id, { review_status, reviewed_by, reviewer_notes });
    if (!updated) return res.status(404).json({ error: 'Finding not found' });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;

