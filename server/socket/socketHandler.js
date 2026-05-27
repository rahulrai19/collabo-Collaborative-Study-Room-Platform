const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

// Track online users per room: { roomId: { username: { status, mode, timeString } } }
const roomPresence = {};

const getPresenceArray = (roomId) => {
  if (!roomPresence[roomId]) return [];
  return Object.entries(roomPresence[roomId]).map(([username, data]) => ({
    username,
    ...data,
  }));
};

const socketHandler = (io) => {
  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Join a room
    socket.on('join_room', async (roomId) => {
      socket.join(roomId);
      if (!roomPresence[roomId]) roomPresence[roomId] = {};
      roomPresence[roomId][socket.user.username] = { status: 'idle', mode: 'focus', timeString: '25:00' };

      // Notify others
      socket.to(roomId).emit('user_joined', {
        username: socket.user.username,
        onlineUsers: getPresenceArray(roomId),
      });

      // Send current online list to the joining user
      socket.emit('presence_update', { onlineUsers: getPresenceArray(roomId) });
    });

    // Leave a room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      if (roomPresence[roomId] && roomPresence[roomId][socket.user.username]) {
        delete roomPresence[roomId][socket.user.username];
        io.to(roomId).emit('user_left', {
          username: socket.user.username,
          onlineUsers: getPresenceArray(roomId),
        });
      }
    });

    // Send a chat message
    socket.on('send_message', async ({ roomId, text }) => {
      if (!text || !text.trim()) return;
      const message = {
        user: socket.user.id,
        username: socket.user.username,
        text: text.trim(),
        sentAt: new Date(),
      };

      try {
        // Persist message to DB (keep last 200 messages)
        await Room.findByIdAndUpdate(roomId, {
          $push: {
            messages: {
              $each: [message],
              $slice: -200,
            },
          },
        });
      } catch (err) {
        console.error('Failed to save message:', err.message);
      }

      // Broadcast to room
      io.to(roomId).emit('receive_message', message);
    });

    // Session started/stopped events (broadcast to room)
    socket.on('session_started', (roomId) => {
      io.to(roomId).emit('session_update', { isActive: true, startedBy: socket.user.username });
    });

    socket.on('session_stopped', ({ roomId, duration }) => {
      io.to(roomId).emit('session_update', { isActive: false, duration });
    });

    // Timer sync for live focus tracking
    socket.on('timer_update', ({ roomId, status, mode, timeString }) => {
      if (roomPresence[roomId] && roomPresence[roomId][socket.user.username]) {
        roomPresence[roomId][socket.user.username] = { status, mode, timeString };
        io.to(roomId).emit('presence_update', { onlineUsers: getPresenceArray(roomId) });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove from all rooms they were in
      for (const roomId in roomPresence) {
        if (roomPresence[roomId][socket.user.username]) {
          delete roomPresence[roomId][socket.user.username];
          io.to(roomId).emit('user_left', {
            username: socket.user.username,
            onlineUsers: getPresenceArray(roomId),
          });
        }
      }
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = socketHandler;
