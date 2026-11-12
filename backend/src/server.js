import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import healthRouter from './routes/health.js';
import departmentsRouter from './routes/departments.js';
import employeesRouter from './routes/employees.js';
import projectsRouter from './routes/projects.js';
import dashboardRouter from './routes/dashboard.js';

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
app.use('/api/dashboard', dashboardRouter);

// Fallback route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to HandoverIQ Backend API',
    team: 'ROGUENOVA',
    tagline: 'Preserve Knowledge. Power Continuity.',
    version: '1.2.0-phase2',
    endpoints: {
      health: '/api/health',
      departments: '/api/departments',
      employees: '/api/employees',
      projects: '/api/projects',
      dashboardStats: '/api/dashboard/stats'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[HandoverIQ Error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(config.port, () => {
  console.log('========================================================');
  console.log(`🚀 HandoverIQ Backend Service Active (Phase 2)`);
  console.log(`🏢 Team: ROGUENOVA`);
  console.log(`🌐 Server running at: http://localhost:${config.port}`);
  console.log(`🩺 Health endpoint: http://localhost:${config.port}/api/health`);
  console.log(`📊 Departments API: http://localhost:${config.port}/api/departments`);
  console.log(`👥 Employees API:   http://localhost:${config.port}/api/employees`);
  console.log(`💼 Projects API:    http://localhost:${config.port}/api/projects`);
  console.log(`📈 Dashboard Stats: http://localhost:${config.port}/api/dashboard/stats`);
  console.log('========================================================');
});
