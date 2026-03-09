import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/authRoutes';
import moodLogRoutes from './routes/moodLogRoutes';
import { errorHandler, notFound } from './middlewares/errorMiddleware';
import { requestId } from './middlewares/requestId';
import { healthLimiter } from './middlewares/rateLimiter';

const app: Application = express();

const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

// Middleware
app.use(requestId);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '16kb' }));
app.use(morgan('dev'));

// Health check
app.get('/health', healthLimiter, (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'unhealthy',
    db: isHealthy ? 'connected' : 'disconnected',
    uptime: process.uptime(),
  });
});

// Swagger docs (non-production only)
if (env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// // Routes
// app.get('/', (req, res) => {
//   res.status(200).json({
//     success: true,
//     message: 'Welcome to Moodmate',
//   });
// });

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/mood', moodLogRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
