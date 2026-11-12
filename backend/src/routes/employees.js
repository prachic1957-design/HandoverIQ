import express from 'express';
import { db } from '../db/repository.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all employee routes
router.use(authenticate);

// GET /api/employees - List all employees (salary stripped for non-HR)
router.get('/', async (req, res, next) => {
  try {
    const { department_id, search } = req.query;
    const employees = await db.getAllEmployees({
      department_id,
      search,
      isHR: req.isHR
    });

    res.json({
      success: true,
      data: employees,
      count: employees.length,
      hrView: req.isHR
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/employees/:id - Get single employee by ID
router.get('/:id', async (req, res, next) => {
  try {
    const employee = await db.getEmployeeById(req.params.id, { isHR: req.isHR });
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee,
      hrView: req.isHR
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/employees - Create new employee
router.post('/', async (req, res, next) => {
  try {
    const { full_name, email, designation, department_id, joining_date, employment_status, salary } = req.body;

    // Required fields validation
    if (!full_name || !full_name.trim()) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Full name is required.' });
    }
    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'A valid email address is required.' });
    }
    if (!designation || !designation.trim()) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Designation is required.' });
    }
    if (!department_id) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Department assignment is required.' });
    }

    // Salary can only be set if user is authorized as HR
    if (salary !== undefined && salary !== null && salary !== '' && !req.isHR) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only authorized HR users can set employee compensation / salary.'
      });
    }

    const created = await db.createEmployee({
      full_name,
      email,
      designation,
      department_id,
      joining_date,
      employment_status,
      salary,
      isHR: req.isHR
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: created
    });
  } catch (error) {
    if (error.code === '23505' || error.message?.includes('already exists')) {
      return res.status(409).json({ success: false, error: 'Conflict', message: error.message });
    }
    if (error.code === '23503' || error.message?.includes('does not exist')) {
      return res.status(400).json({ success: false, error: 'Invalid Foreign Key', message: error.message });
    }
    next(error);
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', async (req, res, next) => {
  try {
    const { full_name, email, designation, department_id, joining_date, employment_status, salary } = req.body;

    if (email !== undefined && (!email.trim() || !email.includes('@'))) {
      return res.status(400).json({ success: false, error: 'Validation failed', message: 'Valid email is required.' });
    }

    // Salary can only be updated if user is authorized as HR
    if (salary !== undefined && !req.isHR) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only authorized HR users can view or modify employee compensation / salary.'
      });
    }

    const updated = await db.updateEmployee(req.params.id, {
      full_name,
      email,
      designation,
      department_id,
      joining_date,
      employment_status,
      salary
    }, { isHR: req.isHR });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updated
    });
  } catch (error) {
    if (error.code === '23505' || error.message?.includes('already exists')) {
      return res.status(409).json({ success: false, error: 'Conflict', message: error.message });
    }
    if (error.code === '23503' || error.message?.includes('does not exist')) {
      return res.status(400).json({ success: false, error: 'Invalid Foreign Key', message: error.message });
    }
    next(error);
  }
});

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await db.deleteEmployee(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully',
      data: deleted
    });
  } catch (error) {
    next(error);
  }
});

export default router;
