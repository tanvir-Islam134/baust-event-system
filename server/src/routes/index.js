import { Router } from 'express';
import healthRouter from './v1/health.route.js';

const router = Router();

// API v1 routes
router.use('/v1/health', healthRouter);

export default router;

