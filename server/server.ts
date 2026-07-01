import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db';
import { initSocketIO } from './socket/handler';
import { setDemoMode } from './utils/demoData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, '../../dist')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize Socket.IO
initSocketIO(server);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connected = await connectDB();

    if (connected) {
      // Use real routes with MongoDB
      const { seedDatabase } = await import('./utils/seed');
      await seedDatabase();

      const authRoutes = await import('./routes/auth');
      const userRoutes = await import('./routes/users');
      const productRoutes = await import('./routes/products');
      const loanRoutes = await import('./routes/loans');
      const returnRoutes = await import('./routes/returns');
      const occurrenceRoutes = await import('./routes/occurrences');
      const dashboardRoutes = await import('./routes/dashboard');
      const logRoutes = await import('./routes/logs');
      const reportRoutes = await import('./routes/reports');

      app.use('/api/auth', authRoutes.default);
      app.use('/api/users', userRoutes.default);
      app.use('/api/products', productRoutes.default);
      app.use('/api/loans', loanRoutes.default);
      app.use('/api/returns', returnRoutes.default);
      app.use('/api/occurrences', occurrenceRoutes.default);
      app.use('/api/dashboard', dashboardRoutes.default);
      app.use('/api/logs', logRoutes.default);
      app.use('/api/reports', reportRoutes.default);

      console.log('Server running with MongoDB');
    } else {
      // Use demo routes
      setDemoMode(true);
      const demoRoutes = await import('./routes/demo');
      app.use('/api/auth', demoRoutes.default);
      app.use('/api/users', demoRoutes.default);
      app.use('/api/products', demoRoutes.default);
      app.use('/api/loans', demoRoutes.default);
      app.use('/api/returns', demoRoutes.default);
      app.use('/api/occurrences', demoRoutes.default);
      app.use('/api/dashboard', demoRoutes.default);
      app.use('/api/logs', demoRoutes.default);
      app.use('/api/reports', demoRoutes.default);

      console.log('Server running in DEMO MODE (no MongoDB)');
      console.log('Login with: adminplataforma / adminplataforma12345');
    }

    // Serve React app for all other routes
    app.use((req, res) => {
      res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default server;
