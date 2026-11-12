import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import healthRouter from './routes/health.js';

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

// Routes
app.use('/api/health', healthRouter);

// Fallback route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to HandoverIQ Backend API',
    team: 'ROGUENOVA',
    docs: '/api/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[HandoverIQ Error]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(config.port, () => {
  console.log('========================================================');
  console.log(`🚀 HandoverIQ Backend Service Active`);
  console.log(`🏢 Team: ROGUENOVA`);
  console.log(`🌐 Server running at: http://localhost:${config.port}`);
  console.log(`🩺 Health endpoint: http://localhost:${config.port}/api/health`);
  console.log('========================================================');
});
