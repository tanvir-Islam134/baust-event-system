import { Router } from 'express';
import healthRouter from './v1/health.route.js';
import authRouter from './v1/auth.route.js';

const router = Router();

// API v1 routes
router.use('/v1/health', healthRouter);
router.use('/v1/auth', authRouter);

export default router;

