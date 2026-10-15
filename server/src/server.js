import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server] BAUST Event System server listening on port ${PORT}`);
  console.log(`[Server] Health check available at http://localhost:${PORT}/api/v1/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Process] Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err);
  process.exit(1);
});

// Handle graceful termination
process.on('SIGTERM', () => {
  console.log('[Process] SIGTERM received. Gracefully shutting down...');
  server.close(() => {
    console.log('[Process] Server closed.');
  });
});

