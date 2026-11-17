import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] BAUST Event System server listening on port ${PORT}`);
  console.log(`[Server] Health check available at http://localhost:${PORT}/api/v1/health`);
});

// Initialize Socket.io gracefully if installed
try {
  const { Server } = await import('socket.io');
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow all matching web clients and development hosts
        if (!origin) return callback(null, true);
        if (
          origin.includes('localhost') ||
          origin.includes('127.0.0.1') ||
          origin.includes('192.168.') ||
          origin.includes('vercel.app') ||
          origin.includes('loca.lt') ||
          origin.includes('ngrok-free.app')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    },
  });
  app.set('io', io);

  io.on('connection', (socket) => {
    socket.on('join_admin_room', (userData) => {
      socket.join('admin_room');
      console.log(`[Socket.io] Client joined admin_room: ${socket.id}`);
    });

    socket.on('join_user_room', (userData) => {
      if (userData?.uid) {
        socket.join(`user_${userData.uid}`);
        console.log(`[Socket.io] Client joined user room user_${userData.uid}: ${socket.id}`);
      }
      if (userData?.role === 'organizer') {
        socket.join('organizer_room');
        console.log(`[Socket.io] Organizer joined organizer_room: ${socket.id}`);
      }
    });
  });

  console.log('[Socket.io] Real-time notification gateway active');
} catch {
  console.log('[Socket.io] Optional module not detected; proceeding in standard REST mode');
}

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

