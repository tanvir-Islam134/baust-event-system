import * as healthService from '../services/health.service.js';

/**
 * Controller to handle health check requests.
 */
export const getHealth = (req, res, next) => {
  try {
    const health = healthService.getSystemHealth();
    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};

