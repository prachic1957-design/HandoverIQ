import express from 'express';
import { db } from '../db/repository.js';

const router = express.Router();

// ----------------------------------------------------------------------------
// PROJECT ROUTES
// ----------------------------------------------------------------------------

// GET /api/projects - List all projects
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const projects = await db.getAllProjects({ status, search });
    res.json({
      success: true,
      data: projects,
      count: projects.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project with member assignments
router.get('/:id', async (req, res, next) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res, next) => {
  try {
    const { name, description, status, start_date, end_date } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Project name is required.'
      });
    }

    const created = await db.createProject({
      name,
      description,
      status,
      start_date,
      end_date
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: created
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, status, start_date, end_date } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Project name cannot be empty.'
      });
    }

    const updated = await db.updateProject(req.params.id, {
      name,
      description,
      status,
      start_date,
      end_date
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await db.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      message: 'Project deleted successfully',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

// ----------------------------------------------------------------------------
// PROJECT MEMBER ASSIGNMENT ROUTES
// ----------------------------------------------------------------------------

// GET /api/projects/:id/members - Get all assigned members for a project
router.get('/:id/members', async (req, res, next) => {
  try {
    const members = await db.getProjectMembers(req.params.id);
    res.json({
      success: true,
      data: members,
      count: members.length
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/members - Assign employee to project
router.post('/:id/members', async (req, res, next) => {
  try {
    const { employee_id, responsibility, work_status } = req.body;

    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Employee ID is required for project assignment.'
      });
    }
    if (!responsibility || !responsibility.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Responsibility description is required.'
      });
    }

    const member = await db.addProjectMember(req.params.id, {
      employee_id,
      responsibility,
      work_status
    });

    res.status(201).json({
      success: true,
      message: 'Employee assigned to project successfully',
      data: member
    });
  } catch (error) {
    if (error.code === '23505' || error.message?.includes('already assigned')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'This employee is already assigned to this project.'
      });
    }
    if (error.code === '23503' || error.message?.includes('does not exist')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Reference',
        message: error.message
      });
    }
    next(error);
  }
});

// DELETE /api/projects/:id/members/:employeeId - Remove employee from project
router.delete('/:id/members/:employeeId', async (req, res, next) => {
  try {
    const removed = await db.removeProjectMember(req.params.id, req.params.employeeId);
    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      message: 'Employee assignment removed from project',
      data: removed
    });
  } catch (error) {
    next(error);
  }
});

export default router;
