import express from 'express';
import { db } from '../db/repository.js';

const router = express.Router();

// GET /api/departments - List all departments
router.get('/', async (req, res, next) => {
  try {
    const departments = await db.getAllDepartments();
    res.json({
      success: true,
      data: departments,
      count: departments.length
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/departments/:id - Get department by ID
router.get('/:id', async (req, res, next) => {
  try {
    const department = await db.getDepartmentById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/departments - Create new department
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Department name is required.'
      });
    }

    const created = await db.createDepartment({ name, description });
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: created
    });
  } catch (error) {
    if (error.code === '23505' || error.message?.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: error.message
      });
    }
    next(error);
  }
});

// PUT /api/departments/:id - Update department
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (name !== undefined && !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Department name cannot be empty.'
      });
    }

    const updated = await db.updateDepartment(req.params.id, { name, description });
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.json({
      success: true,
      message: 'Department updated successfully',
      data: updated
    });
  } catch (error) {
    if (error.code === '23505' || error.message?.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: error.message
      });
    }
    next(error);
  }
});

// DELETE /api/departments/:id - Delete department
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await db.deleteDepartment(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }

    res.json({
      success: true,
      message: 'Department deleted successfully',
      data: deleted
    });
  } catch (error) {
    if (error.code === '23503' || error.message?.includes('Cannot delete department')) {
      return res.status(400).json({
        success: false,
        error: 'Foreign Key Violation',
        message: error.message
      });
    }
    next(error);
  }
});

export default router;

