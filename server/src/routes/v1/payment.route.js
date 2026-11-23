import { Router } from 'express';
import * as paymentController from '../../controllers/payment.controller.js';
import { optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

// POST /api/v1/payments/bkash/create - Initiate bKash payment session
router.post('/bkash/create', optionalAuth, paymentController.createBkashPayment);

// POST /api/v1/payments/bkash/execute - Execute bKash payment & issue ticket
router.post('/bkash/execute', optionalAuth, paymentController.executeBkashPayment);

// GET /api/v1/payments/bkash/query/:paymentID - Check payment status
router.get('/bkash/query/:paymentID', optionalAuth, paymentController.queryBkashPayment);

export default router;
