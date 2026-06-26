import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import objectiveRoutes from './routes/objectives';
import actionRoutes from './routes/actions';
import dailyLogRoutes from './routes/dailyLogs';
import weeklyReviewRoutes from './routes/weeklyReviews';
import statsRoutes from './routes/stats';
import achievementRoutes from './routes/achievements';
import nlpRoutes from './routes/nlp';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Demasiadas solicitudes, intentá más tarde.' },
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/weekly-reviews', weeklyReviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/nlp', nlpRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

export default app;
