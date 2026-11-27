import { Router } from 'express';
import healthRouter from './v1/health.route.js';
import authRouter from './v1/auth.route.js';
import userRouter from './v1/user.route.js';
import eventRouter from './v1/event.route.js';
import registrationRouter from './v1/registration.route.js';
import financeRouter from './v1/finance.route.js';
import pollRouter from './v1/poll.route.js';
import adminRouter from './v1/admin.route.js';
import notificationRouter from './v1/notification.route.js';
import paymentRouter from './v1/payment.route.js';
import feedbackRouter from './v1/feedback.route.js';
import * as registrationController from '../controllers/registration.controller.js';
import { optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Direct registration endpoint: POST /api/v1/register (supports manual bKash TrxID)
router.post('/v1/register', optionalAuth, registrationController.create);

// API v1 routes
router.use('/v1/health', healthRouter);
router.use('/v1/auth', authRouter);
router.use('/v1/users', userRouter);
router.use('/v1/events', eventRouter);
router.use('/v1/registrations', registrationRouter);
router.use('/v1/finances', financeRouter);
router.use('/v1/polls', pollRouter);
router.use('/v1/admin', adminRouter);
router.use('/v1/notifications', notificationRouter);
router.use('/v1/payments', paymentRouter);
router.use('/v1/feedback', feedbackRouter);

export default router;
