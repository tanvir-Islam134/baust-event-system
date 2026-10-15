/**
 * Service to retrieve current server health status.
 * @returns {object} Health details
 */
export const getSystemHealth = () => {
  return {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'baust-event-system-server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  };
};

