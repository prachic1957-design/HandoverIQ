import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import healthRouter from './routes/health.js';
import departmentsRouter from './routes/departments.js';
import employeesRouter from './routes/employees.js';
import projectsRouter from './routes/projects.js';
import dashboardRouter from './routes/dashboard.js';
import documentsRouter, { projectDocumentsHandler } from './routes/documents.js';
import knowledgeRouter from './routes/knowledge.js';
import handoversRouter from './routes/handovers.js';

const app = express();

// Middlewares
app.use(cors({
  origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[HandoverIQ API] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/health', healthRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/knowledge', knowledgeRouter);
app.use('/api/handovers', handoversRouter);

// Nested project documents route
app.get('/api/projects/:id/documents', projectDocumentsHandler);

// Fallback route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to HandoverIQ Backend API',
    team: 'ROGUENOVA',
    tagline: 'Preserve Knowledge. Power Continuity.',
    version: '1.5.0-phase5',
    endpoints: {
      health: '/api/health',
      departments: '/api/departments',
      employees: '/api/employees',
      projects: '/api/projects',
      documents: '/api/documents',
      dashboardStats: '/api/dashboard/stats',
      knowledgeAnalyze: 'POST /api/knowledge/analyze',
      knowledgeAnalyses: 'GET /api/knowledge/analyses',
      knowledgeAnalysisById: 'GET /api/knowledge/analyses/:id',
      knowledgeFindings: 'GET /api/knowledge/analyses/:id/findings',
      knowledgeFindingReview: 'PATCH /api/knowledge/findings/:id/review',
      handoversCreate: 'POST /api/handovers',
      handoversList: 'GET /api/handovers',
      handoversGetById: 'GET /api/handovers/:id',
      handoversUpdateStatus: 'PATCH /api/handovers/:id/status',
      handoversAssignReplacement: 'POST /api/handovers/:id/assign',
      handoversBriefing: 'GET /api/handovers/:id/briefing',
      handoversHistory: 'GET /api/handovers/:id/history'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[HandoverIQ Error]', err);
  const status = err.status || (err.message && err.message.includes('Unsupported file type') ? 400 : 500);
  res.status(status).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(config.port, () => {
  console.log('========================================================');
  console.log(`🚀 HandoverIQ Backend Service Active (Phase 3)`);
  console.log(`🏢 Team: ROGUENOVA`);
  console.log(`🌐 Server running at: http://localhost:${config.port}`);
  console.log(`🩺 Health endpoint: http://localhost:${config.port}/api/health`);
  console.log(`📁 Documents API:   http://localhost:${config.port}/api/documents`);
  console.log(`========================================================`);
});
