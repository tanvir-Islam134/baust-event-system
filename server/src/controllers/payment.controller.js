import * as bkashService from '../services/bkash.service.js';
import {
  CreateBkashPaymentSchema,
  ExecuteBkashPaymentSchema,
  QueryBkashPaymentSchema,
} from '../schemas/payment.schema.js';

/**
 * Controller for handling bKash Payment Gateway endpoints.
 */

/**
 * POST /api/v1/payments/bkash/create
 * Initiate a bKash online checkout session for paid event registration.
 */
export const createBkashPayment = async (req, res, next) => {
  try {
    const validated = CreateBkashPaymentSchema.parse(req.body);
    const session = await bkashService.createPaymentSession(req.user?.uid || null, validated);

    res.status(201).json({
      success: true,
      message: 'bKash payment session initialized successfully',
      data: session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payments/bkash/execute
 * Verify bKash OTP/PIN and complete payment transaction, issuing digital ticket.
 */
export const executeBkashPayment = async (req, res, next) => {
  try {
    const validated = ExecuteBkashPaymentSchema.parse(req.body);
    const result = await bkashService.executePayment(req.user?.uid || null, validated);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payments/bkash/query/:paymentID
 * Query the status of a specific bKash payment session.
 */
export const queryBkashPayment = async (req, res, next) => {
  try {
    const { paymentID } = QueryBkashPaymentSchema.parse(req.params);
    const status = await bkashService.queryPayment(paymentID);

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};
