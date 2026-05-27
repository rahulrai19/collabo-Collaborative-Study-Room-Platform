const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

// Track online users per room: { roomId: Set(userId) }
const roomPresence = {};

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
      if (!roomPresence[roomId]) roomPresence[roomId] = new Set();
      roomPresence[roomId].add(socket.user.username);

      // Notify others
      socket.to(roomId).emit('user_joined', {
        username: socket.user.username,
        onlineUsers: [...roomPresence[roomId]],
      });

      // Send current online list to the joining user
      socket.emit('presence_update', { onlineUsers: [...roomPresence[roomId]] });
    });

    // Leave a room
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      if (roomPresence[roomId]) {
        roomPresence[roomId].delete(socket.user.username);
        io.to(roomId).emit('user_left', {
          username: socket.user.username,
          onlineUsers: [...roomPresence[roomId]],
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

    // Handle disconnect
    socket.on('disconnect', () => {
      // Remove from all rooms they were in
      for (const roomId in roomPresence) {
        if (roomPresence[roomId].has(socket.user.username)) {
          roomPresence[roomId].delete(socket.user.username);
          io.to(roomId).emit('user_left', {
            username: socket.user.username,
            onlineUsers: [...roomPresence[roomId]],
          });
        }
      }
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = socketHandler;
