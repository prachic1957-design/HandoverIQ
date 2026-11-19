// Handover Package & Replacement Management Routes (Phase 5)
// Implements API endpoints for manager-reviewed handover packages and replacement transitions.
// Team: ROGUENOVA
// Tagline: Preserve Knowledge. Power Continuity.

import express from 'express';
import { repository } from '../db/repository.js';
import { isAuthenticated, requireHR } from '../middleware/auth.js';

const router = express.Router();

const VALID_STATUSES = ['draft', 'under_review', 'approved', 'assigned', 'in_progress', 'completed', 'rejected'];

/**
 * POST /api/handovers
 * Generate or create a handover package from a completed knowledge analysis.
 * Body: { analysis_id, created_by? }
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { analysis_id, created_by } = req.body;
    if (!analysis_id) {
      return res.status(400).json({ error: 'analysis_id is required' });
    }

    const analysis = await repository.getKnowledgeAnalysisById(analysis_id);
    if (!analysis) {
      return res.status(404).json({ error: `Knowledge analysis "${analysis_id}" not found` });
    }

    const [project, departingEmployee, findings] = await Promise.all([
      repository.getProjectById(analysis.project_id),
      repository.getEmployeeById(analysis.employee_id),
      repository.getKnowledgeFindingsByAnalysis(analysis.id)
    ]);

    if (!project || !departingEmployee) {
      return res.status(404).json({ error: 'Associated project or departing employee record not found' });
    }

    // Filter findings according to verification business rules:
    // Approved findings are strictly verified; needs_review and rejected remain clearly labelled.
    const approvedFindings = findings.filter(f => f.review_status === 'approved');
    const pendingReviewFindings = findings.filter(f => f.review_status === 'needs_review');
    const rejectedFindings = findings.filter(f => f.review_status === 'rejected');

    const structuredResult = analysis.structured_result || {};

    const packageContent = {
      analysis_id: analysis.id,
      model_name: analysis.model_name,
      reconstructed_at: analysis.created_at,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status
      },
      departing_employee: {
        id: departingEmployee.id,
        full_name: departingEmployee.full_name,
        designation: departingEmployee.designation,
        email: departingEmployee.email
      },
      findings_breakdown: {
        total_findings: findings.length,
        approved_count: approvedFindings.length,
        pending_review_count: pendingReviewFindings.length,
        rejected_count: rejectedFindings.length
      },
      verified_findings: approvedFindings.map(f => ({
        id: f.id,
        finding_type: f.finding_type,
        title: f.title,
        description: f.description,
        confidence: f.confidence,
        status: f.status,
        evidence_references: f.evidence_references,
        reviewed_by: f.reviewed_by,
        reviewer_notes: f.reviewer_notes
      })),
      unreviewed_findings: pendingReviewFindings.map(f => ({
        id: f.id,
        finding_type: f.finding_type,
        title: f.title,
        description: f.description,
        confidence: f.confidence,
        review_status: 'needs_review',
        evidence_references: f.evidence_references
      })),
      rejected_findings: rejectedFindings.map(f => ({
        id: f.id,
        title: f.title,
        review_status: 'rejected',
        reviewer_notes: f.reviewer_notes
      })),
      replacement_brief: structuredResult.replacement_brief || {}
    };

    const pkg = await repository.createHandoverPackage({
      analysis_id: analysis.id,
      departing_employee_id: departingEmployee.id,
      project_id: project.id,
      package_summary: analysis.analysis_summary || 'Handover package compiled from AI knowledge analysis.',
      package_content: packageContent,
      created_by: created_by || 'Manager'
    });

    res.status(201).json(pkg);
  } catch (err) {
    console.error('[HandoverIQ Handover Create Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/handovers
 * List handover packages with optional filters (project_id, departing_employee_id, status).
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { project_id, departing_employee_id, status } = req.query;
    const packages = await repository.listHandoverPackages({ project_id, departing_employee_id, status });
    res.json(packages);
  } catch (err) {
    console.error('[HandoverIQ Handover List Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/handovers/:id
 * Retrieve single handover package details including content and assignment.
 */
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const pkg = await repository.getHandoverPackageById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: `Handover package "${req.params.id}" not found` });
    }
    res.json(pkg);
  } catch (err) {
    console.error('[HandoverIQ Handover Get Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/handovers/:id/status
 * Update package status and record status history.
 * Body: { status, changed_by? }
 */
router.patch('/:id/status', isAuthenticated, requireHR, async (req, res) => {
  try {
    const { status, changed_by } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status: "${status}". Allowed values: ${VALID_STATUSES.join(', ')}`
      });
    }

    const pkg = await repository.getHandoverPackageById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: `Handover package "${req.params.id}" not found` });
    }

    const updated = await repository.updateHandoverPackageStatus(req.params.id, status, changed_by || 'Manager');
    res.json(updated);
  } catch (err) {
    console.error('[HandoverIQ Handover Status Update Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/handovers/:id/assign
 * Assign a replacement employee to the handover package.
 * Body: { replacement_employee_id }
 */
router.post('/:id/assign', isAuthenticated, requireHR, async (req, res) => {
  try {
    const { replacement_employee_id } = req.body;
    if (!replacement_employee_id) {
      return res.status(400).json({ error: 'replacement_employee_id is required' });
    }

    const pkg = await repository.getHandoverPackageById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: `Handover package "${req.params.id}" not found` });
    }

    // Business Rule: Cannot assign departing employee as their own replacement
    if (pkg.departing_employee_id === replacement_employee_id) {
      return res.status(400).json({
        error: 'Business Rule Violation: Departing employee cannot be assigned as their own replacement'
      });
    }

    // Verify replacement employee exists
    const replacementEmp = await repository.getEmployeeById(replacement_employee_id);
    if (!replacementEmp) {
      return res.status(404).json({ error: `Replacement employee "${replacement_employee_id}" not found` });
    }

    const assignment = await repository.assignReplacementEmployee(req.params.id, replacement_employee_id);
    res.status(201).json({
      message: 'Replacement employee successfully assigned to handover package.',
      assignment
    });
  } catch (err) {
    console.error('[HandoverIQ Handover Assign Error]', err);
    if (err.code === 'DUPLICATE_ASSIGNMENT' || err.message?.includes('already assigned')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/handovers/:id/briefing
 * Structured Day-1 replacement briefing compiled from manager-verified findings and AI brief.
 */
router.get('/:id/briefing', isAuthenticated, async (req, res) => {
  try {
    const pkg = await repository.getHandoverPackageById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: `Handover package "${req.params.id}" not found` });
    }

    const content = pkg.package_content || {};
    const verifiedFindings = content.verified_findings || [];
    const brief = content.replacement_brief || {};

    const successor = pkg.assignment?.replacement_employee
      || pkg.assignment?.employees
      || (Array.isArray(pkg.package_assignments) && (pkg.package_assignments[0]?.replacement_employee || pkg.package_assignments[0]?.employees))
      || null;

    const briefingPayload = {
      package_id: pkg.id,
      status: pkg.status,
      project: content.project || pkg.projects || {},
      predecessor: content.departing_employee || pkg.departing_employee || pkg.employees || {},
      successor,
      summary: pkg.package_summary,
      day_one_briefing: {
        project_overview: brief.project_overview || content.project?.description || 'N/A',
        predecessor_role: brief.employee_responsibilities || content.departing_employee?.designation || 'N/A',
        completed_milestones: verifiedFindings.filter(f => f.finding_type === 'milestone' || f.finding_type === 'work_history'),
        critical_pending_tasks: verifiedFindings.filter(f => f.finding_type === 'pending_task'),
        identified_risks_and_blockers: verifiedFindings.filter(f => f.finding_type === 'risk_blocker' || f.finding_type === 'risk'),
        knowledge_gaps: verifiedFindings.filter(f => f.finding_type === 'knowledge_gap'),
        actionable_next_steps: brief.suggested_next_steps || 'Review project repository and connect with project lead.',
        important_contacts: brief.important_contacts || 'Consult project team roster.'
      },
      verification_status: {
        total_verified_findings: verifiedFindings.length,
        unreviewed_findings_pending: content.findings_breakdown?.pending_review_count || 0
      }
    };

    res.json(briefingPayload);
  } catch (err) {
    console.error('[HandoverIQ Handover Briefing Error]', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/handovers/:id/history
 * Status change audit trail.
 */
router.get('/:id/history', isAuthenticated, async (req, res) => {
  try {
    const history = await repository.getHandoverStatusHistory(req.params.id);
    res.json(history);
  } catch (err) {
    console.error('[HandoverIQ Handover History Error]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

