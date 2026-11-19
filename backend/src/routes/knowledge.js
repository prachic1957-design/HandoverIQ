// Knowledge Reconstruction Routes (Phase 4)
// Implements API endpoints for AI knowledge reconstruction using Gemini.

import express from 'express';
import { repository } from '../db/repository.js';
import { reconstructKnowledge } from '../services/geminiService.js';
import { isAuthenticated } from '../middleware/auth.js'; // assumes auth middleware exists

const router = express.Router();

// Allowed finding types adhering to PostgreSQL constraint:
// CHECK (finding_type IN ('work_history', 'milestone', 'pending_task', 'risk_blocker', 'knowledge_gap', 'replacement_brief'))
export const ALLOWED_FINDING_TYPES = new Set([
  'work_history',
  'milestone',
  'pending_task',
  'risk_blocker',
  'knowledge_gap',
  'replacement_brief'
]);

export function normalizeFindingType(type) {
  if (!type) return 'work_history';
  const clean = String(type).trim().toLowerCase();
  if (ALLOWED_FINDING_TYPES.has(clean)) return clean;
  if (clean === 'risk' || clean === 'risks' || clean === 'risks_and_blockers' || clean === 'blocker' || clean === 'blockers') {
    return 'risk_blocker';
  }
  if (clean === 'task' || clean === 'tasks' || clean === 'pending_tasks') {
    return 'pending_task';
  }
  if (clean === 'milestones') {
    return 'milestone';
  }
  if (clean === 'work' || clean === 'history' || clean === 'employee_work_history') {
    return 'work_history';
  }
  if (clean === 'gap' || clean === 'gaps' || clean === 'knowledge_gaps') {
    return 'knowledge_gap';
  }
  if (clean === 'brief' || clean === 'briefing') {
    return 'replacement_brief';
  }
  return 'work_history';
}

/**
 * Safely format and compose a readable, non-empty finding description.
 * Preserves existing description/evidence_description while capturing
 * knowledge gap details (missing_information, conflicting_information, unclear_ownership)
 * without duplicating identical text.
 */
export function formatFindingDescription(item = {}) {
  if (!item || typeof item !== 'object') return '';

  const parts = [];
  const seenTexts = new Set();

  const addPart = (label, rawText) => {
    if (!rawText || typeof rawText !== 'string') return;
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const lower = trimmed.toLowerCase();
    if (seenTexts.has(lower)) return;
    seenTexts.add(lower);

    if (label) {
      const prefixRegex = new RegExp(`^${label}\\s*:\\s*`, 'i');
      if (prefixRegex.test(trimmed)) {
        parts.push(trimmed);
      } else {
        parts.push(`${label}: ${trimmed}`);
      }
    } else {
      parts.push(trimmed);
    }
  };

  // 1. Existing base description or evidence description
  const baseDesc = typeof item.description === 'string' && item.description.trim()
    ? item.description.trim()
    : (typeof item.evidence_description === 'string' && item.evidence_description.trim()
      ? item.evidence_description.trim()
      : '');

  if (baseDesc) {
    addPart(null, baseDesc);
  }

  // Helper to check if text is already substantially covered by baseDesc
  const isDuplicateOfBase = (txt) => {
    if (!baseDesc || !txt) return false;
    const cleanTxt = txt.trim().toLowerCase();
    const cleanBase = baseDesc.toLowerCase();
    return cleanBase === cleanTxt || cleanBase.includes(cleanTxt);
  };

  // 2. Specific knowledge gap / conflict details
  if (typeof item.missing_information === 'string' && item.missing_information.trim()) {
    const trimmed = item.missing_information.trim();
    if (!isDuplicateOfBase(trimmed)) {
      addPart('Missing Information', trimmed);
    }
  }

  if (typeof item.conflicting_information === 'string' && item.conflicting_information.trim()) {
    const trimmed = item.conflicting_information.trim();
    if (!isDuplicateOfBase(trimmed)) {
      addPart('Conflicting Information', trimmed);
    }
  }

  if (typeof item.unclear_ownership === 'string' && item.unclear_ownership.trim()) {
    const trimmed = item.unclear_ownership.trim();
    if (!isDuplicateOfBase(trimmed)) {
      addPart('Unclear Ownership', trimmed);
    }
  }

  return parts.join('\n\n');
}

// In-flight analysis deduplication cache
const inFlightAnalyses = new Map();

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

    // Deduplicate concurrent analysis requests for the same project & employee
    const dedupeKey = `${project_id}:${employee_id}`;

    if (!mockResponse && inFlightAnalyses.has(dedupeKey)) {
      const cachedPromise = inFlightAnalyses.get(dedupeKey);
      let cachedResult;

      try {
        cachedResult = await cachedPromise;
      } catch (error) {
        console.warn(`[HandoverIQ] Cached analysis rejected for ${dedupeKey}:`, error.message);
      }

      if (cachedResult) {
        console.log(`[HandoverIQ] Returning existing in-flight analysis for ${dedupeKey}`);
        return res.status(200).json(cachedResult);
      }

      if (inFlightAnalyses.get(dedupeKey) === cachedPromise) {
        inFlightAnalyses.delete(dedupeKey);
        console.warn(`[HandoverIQ] Removed stale in-flight analysis for ${dedupeKey}`);
      }
    }

    const [project, employee, chunks, projectDocuments] = await Promise.all([
      repository.getProjectById(project_id),
      repository.getEmployeeById(employee_id),
      repository.getDocumentChunksByProject(project_id),
      repository.getAllDocuments({ project_id })
    ]);
    if (!project || !employee) {
      return res.status(404).json({ error: 'Project or Employee not found' });
    }

    const totalDocumentsCount = Array.isArray(projectDocuments) ? projectDocuments.length : null;

    const runAnalysisTask = async () => {
      const aiResult = await reconstructKnowledge({
        employee,
        project,
        allChunks: chunks,
        mockResponse: mockResponse || null,
        model_name,
        totalDocumentsCount
      });
      const analysis = await repository.createKnowledgeAnalysis({
        project_id,
        employee_id,
        model_name: aiResult.model_name || model_name,
        analysis_summary: aiResult.analysis_summary,
        structured_result: aiResult.structured_result
      });
      const findingsPayload = [];
      const { employee_work_history = [], milestones = [], pending_tasks = [], risks_and_blockers = [], knowledge_gaps = [] } = aiResult.structured_result;
      const addFindings = (type, items) => {
        items.forEach(item => {
          findingsPayload.push({
            finding_type: normalizeFindingType(type),
            title: item.title || item.work_item || 'Untitled',
            description: formatFindingDescription(item),
            status: item.status || null,
            confidence: item.confidence || 'medium',
            grounding_status: item.grounding_status || (Array.isArray(item.evidence_references) && item.evidence_references.length > 0 ? 'grounded' : 'unsupported'),
            evidence_references: item.evidence_references || []
          });
        });
      };
      addFindings('work_history', employee_work_history);
      addFindings('milestone', milestones);
      addFindings('pending_task', pending_tasks);
      addFindings('risk_blocker', risks_and_blockers);
      addFindings('knowledge_gap', knowledge_gaps);
      const createdFindings = await repository.createKnowledgeFindings(analysis.id, findingsPayload);
      const evidence_coverage = aiResult.evidence_coverage || aiResult.structured_result?.evidence_coverage || null;
      return {
        analysis: {
          ...analysis,
          evidence_coverage
        },
        findings: createdFindings,
        evidence_coverage
      };
    };

    let resultPromise;
    if (!mockResponse) {
      resultPromise = runAnalysisTask();
      inFlightAnalyses.set(dedupeKey, resultPromise);
    } else {
      resultPromise = runAnalysisTask();
    }

    try {
      const { analysis, findings, evidence_coverage } = await resultPromise;
      res.status(201).json({ analysis, findings, evidence_coverage });
    } finally {
      if (!mockResponse) {
        inFlightAnalyses.delete(dedupeKey);
      }
    }
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
    const formatted = analyses.map(a => ({
      ...a,
      evidence_coverage: a.evidence_coverage || a.structured_result?.evidence_coverage || null
    }));
    res.json(formatted);
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
    res.json({
      ...analysis,
      evidence_coverage: analysis.evidence_coverage || analysis.structured_result?.evidence_coverage || null
    });
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


// Knowledge Reconstruction Routes (Phase 4)// Implements API endpoints for AI knowledge reconstruction using Gemini.import express from 'express';import { repository } from '../db/repository.js';import { reconstructKnowledge } from '../services/geminiService.js';import { isAuthenticated } from '../middleware/auth.js'; // assumes auth middleware existsconst router = express.Router();// Allowed finding types adhering to PostgreSQL constraint:// CHECK (finding_type IN ('work_history', 'milestone', 'pending_task', 'risk_blocker', 'knowledge_gap', 'replacement_brief'))export const ALLOWED_FINDING_TYPES = new Set([  'work_history',  'milestone',  'pending_task',  'risk_blocker',  'knowledge_gap',  'replacement_brief']);export function normalizeFindingType(type) {  if (!type) return 'work_history';  const clean = String(type).trim().toLowerCase();  if (ALLOWED_FINDING_TYPES.has(clean)) return clean;  if (clean === 'risk' || clean === 'risks' || clean === 'risks_and_blockers' || clean === 'blocker' || clean === 'blockers') {    return 'risk_blocker';  }  if (clean === 'task' || clean === 'tasks' || clean === 'pending_tasks') {    return 'pending_task';  }  if (clean === 'milestones') {    return 'milestone';  }  if (clean === 'work' || clean === 'history' || clean === 'employee_work_history') {    return 'work_history';  }  if (clean === 'gap' || clean === 'gaps' || clean === 'knowledge_gaps') {    return 'knowledge_gap';  }  if (clean === 'brief' || clean === 'briefing') {    return 'replacement_brief';  }  return 'work_history';}/** * Safely format and compose a readable, non-empty finding description. * Preserves existing description/evidence_description while capturing * knowledge gap details (missing_information, conflicting_information, unclear_ownership) * without duplicating identical text. */export function formatFindingDescription(item = {}) {  if (!item || typeof item !== 'object') return '';  const parts = [];  const seenTexts = new Set();  const addPart = (label, rawText) => {    if (!rawText || typeof rawText !== 'string') return;    const trimmed = rawText.trim();    if (!trimmed) return;    const lower = trimmed.toLowerCase();    if (seenTexts.has(lower)) return;    seenTexts.add(lower);    if (label) {      const prefixRegex = new RegExp(`^${label}\\s*:\\s*`, 'i');      if (prefixRegex.test(trimmed)) {        parts.push(trimmed);      } else {        parts.push(`${label}: ${trimmed}`);      }    } else {      parts.push(trimmed);    }  };  // 1. Existing base description or evidence description  const baseDesc = typeof item.description === 'string' && item.description.trim()    ? item.description.trim()    : (typeof item.evidence_description === 'string' && item.evidence_description.trim()      ? item.evidence_description.trim()      : '');  if (baseDesc) {    addPart(null, baseDesc);  }  // Helper to check if text is already substantially covered by baseDesc  const isDuplicateOfBase = (txt) => {    if (!baseDesc || !txt) return false;    const cleanTxt = txt.trim().toLowerCase();    const cleanBase = baseDesc.toLowerCase();    return cleanBase === cleanTxt || cleanBase.includes(cleanTxt);  };  // 2. Specific knowledge gap / conflict details  if (typeof item.missing_information === 'string' && item.missing_information.trim()) {    const trimmed = item.missing_information.trim();    if (!isDuplicateOfBase(trimmed)) {      addPart('Missing Information', trimmed);    }  }  if (typeof item.conflicting_information === 'string' && item.conflicting_information.trim()) {    const trimmed = item.conflicting_information.trim();    if (!isDuplicateOfBase(trimmed)) {      addPart('Conflicting Information', trimmed);    }  }  if (typeof item.unclear_ownership === 'string' && item.unclear_ownership.trim()) {    const trimmed = item.unclear_ownership.trim();    if (!isDuplicateOfBase(trimmed)) {      addPart('Unclear Ownership', trimmed);    }  }  return parts.join('\n\n');}// In-flight analysis deduplication cacheconst inFlightAnalyses = new Map();/** * POST /api/knowledge/analyze * Body: { project_id, employee_id, model_name? } */router.post('/analyze', isAuthenticated, async (req, res) => {  try {    const { project_id, employee_id, model_name, mockResponse } = req.body;    if (!project_id || !employee_id) {      return res.status(400).json({ error: 'project_id and employee_id are required' });    }    // Deduplicate concurrent analysis requests for the same project & employee    const dedupeKey = `${project_id}:${employee_id}`;    if (!mockResponse && inFlightAnalyses.has(dedupeKey)) {      const cachedPromise = inFlightAnalyses.get(dedupeKey);      let cachedResult;      try {        cachedResult = await cachedPromise;      } catch (error) {        console.warn(`[HandoverIQ] Cached analysis rejected for ${dedupeKey}:`, error.message);      }      if (cachedResult) {        console.log(`[HandoverIQ] Returning existing in-flight analysis for ${dedupeKey}`);        return res.status(200).json(cachedResult);      }      if (inFlightAnalyses.get(dedupeKey) === cachedPromise) {        inFlightAnalyses.delete(dedupeKey);        console.warn(`[HandoverIQ] Removed stale in-flight analysis for ${dedupeKey}`);      }    }const [project, employee, chunks, projectDocuments] = await Promise.all([      repository.getProjectById(project_id),      repository.getEmployeeById(employee_id),      repository.getDocumentChunksByProject(project_id),      repository.getAllDocuments({ project_id })    ]);    if (!project || !employee) {      return res.status(404).json({ error: 'Project or Employee not found' });    }    const totalDocumentsCount = Array.isArray(projectDocuments) ? projectDocuments.length : null;    const runAnalysisTask = async () => {      const aiResult = await reconstructKnowledge({        employee,        project,        allChunks: chunks,        mockResponse: mockResponse || null,        model_name,        totalDocumentsCount      });      const analysis = await repository.createKnowledgeAnalysis({        project_id,        employee_id,        model_name: aiResult.model_name || model_name,        analysis_summary: aiResult.analysis_summary,        structured_result: aiResult.structured_result      });      const findingsPayload = [];      const { employee_work_history = [], milestones = [], pending_tasks = [], risks_and_blockers = [], knowledge_gaps = [] } = aiResult.structured_result;      const addFindings = (type, items) => {        items.forEach(item => {          findingsPayload.push({            finding_type: normalizeFindingType(type),            title: item.title || item.work_item || 'Untitled',            description: formatFindingDescription(item),            status: item.status || null,            confidence: item.confidence || 'medium',            grounding_status: item.grounding_status || (Array.isArray(item.evidence_references) && item.evidence_references.length > 0 ? 'grounded' : 'unsupported'),            evidence_references: item.evidence_references || []          });        });      };      addFindings('work_history', employee_work_history);      addFindings('milestone', milestones);      addFindings('pending_task', pending_tasks);      addFindings('risk_blocker', risks_and_blockers);      addFindings('knowledge_gap', knowledge_gaps);      const createdFindings = await repository.createKnowledgeFindings(analysis.id, findingsPayload);      const evidence_coverage = aiResult.evidence_coverage || aiResult.structured_result?.evidence_coverage || null;      return {        analysis: {          ...analysis,          evidence_coverage        },        findings: createdFindings,        evidence_coverage      };    };    let resultPromise;    if (!mockResponse) {      resultPromise = runAnalysisTask();      inFlightAnalyses.set(dedupeKey, resultPromise);    } else {      resultPromise = runAnalysisTask();    }    try {      const { analysis, findings, evidence_coverage } = await resultPromise;      res.status(201).json({ analysis, findings, evidence_coverage });    } finally {      if (!mockResponse) {        inFlightAnalyses.delete(dedupeKey);      }    }  } catch (err) {    console.error('Knowledge analysis error:', err);    const status = err.code === 'GEMINI_NOT_CONFIGURED' ? 500 : 500;    res.status(status).json({ error: err.message });  }});// List analysesrouter.get('/analyses', isAuthenticated, async (req, res) => {  try {    const { project_id, employee_id } = req.query;    const analyses = await repository.listKnowledgeAnalyses({ project_id, employee_id });    const formatted = analyses.map(a => ({      ...a,      evidence_coverage: a.evidence_coverage || a.structured_result?.evidence_coverage || null    }));    res.json(formatted);  } catch (e) {    console.error(e);    res.status(500).json({ error: e.message });  }});// Get single analysisrouter.get('/analyses/:id', isAuthenticated, async (req, res) => {  try {    const analysis = await repository.getKnowledgeAnalysisById(req.params.id);    if (!analysis) return res.status(404).json({ error: 'Analysis not found' });    res.json({      ...analysis,      evidence_coverage: analysis.evidence_coverage || analysis.structured_result?.evidence_coverage || null    });  } catch (e) {    console.error(e);    res.status(500).json({ error: e.message });  }});// Get findings for an analysisrouter.get('/analyses/:id/findings', isAuthenticated, async (req, res) => {  try {    const findings = await repository.getKnowledgeFindingsByAnalysis(req.params.id);    res.json(findings);  } catch (e) {    console.error(e);    res.status(500).json({ error: e.message });  }});// Review a findingrouter.patch('/findings/:id/review', isAuthenticated, async (req, res) => {  try {    const { review_status, reviewed_by, reviewer_notes } = req.body;    if (!review_status) return res.status(400).json({ error: 'review_status required' });    const updated = await repository.reviewKnowledgeFinding(req.params.id, { review_status, reviewed_by, reviewer_notes });    if (!updated) return res.status(404).json({ error: 'Finding not found' });    res.json(updated);  } catch (e) {    console.error(e);    res.status(500).json({ error: e.message });  }});export default router;
