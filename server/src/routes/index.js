import { Router } from 'express';
import healthRouter from './v1/health.route.js';
import authRouter from './v1/auth.route.js';
import userRouter from './v1/user.route.js';
import eventRouter from './v1/event.route.js';
import registrationRouter from './v1/registration.route.js';
import financeRouter from './v1/finance.route.js';
import pollRouter from './v1/poll.route.js';

const router = Router();

// API v1 routes
router.use('/v1/health', healthRouter);
router.use('/v1/auth', authRouter);
router.use('/v1/users', userRouter);
router.use('/v1/events', eventRouter);
router.use('/v1/registrations', registrationRouter);
router.use('/v1/finances', financeRouter);
router.use('/v1/polls', pollRouter);

export default router;
