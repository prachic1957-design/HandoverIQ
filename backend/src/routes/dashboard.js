import express from 'express';
import { db } from '../db/repository.js';

const router = express.Router();

// GET /api/dashboard/stats - Real-time statistics from database
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await db.getDashboardStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

export default router;
