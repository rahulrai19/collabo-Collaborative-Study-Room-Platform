const Room = require('../models/Room');
const jwt = require('jsonwebtoken');

// Track online users per room: { roomId: { username: { status, mode, timeString } } }
const roomPresence = {};

// Track user sockets globally: { userId: socketId }
const userSockets = {};

const getPresenceArray = (roomId) => {
  if (!roomPresence[roomId]) return [];
  return Object.entries(roomPresence[roomId]).map(([username, data]) => ({
    username,
    ...data,
  }));
};

/**
 * Main Socket.io handler for the Collabo platform.
 * Manages real-time presence, global chat, study session synchronization, and shared tasks.
 * Includes JWT-based socket authentication.
 * 
 * @param {import('socket.io').Server} io - The initialized Socket.io server instance
 */
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
    userSockets[socket.user.id] = socket.id;

    // Join a room
    socket.on('join_room', async (roomId) => {
      socket.join(roomId);
      if (!roomPresence[roomId]) roomPresence[roomId] = {};
      roomPresence[roomId][socket.user.username] = { status: 'idle', mode: 'focus', timeString: '25:00', distractions: 0 };

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
    socket.on('timer_update', ({ roomId, status, mode, timeString, distractions = 0 }) => {
      if (roomPresence[roomId] && roomPresence[roomId][socket.user.username]) {
        roomPresence[roomId][socket.user.username] = { status, mode, timeString, distractions };
        io.to(roomId).emit('presence_update', { onlineUsers: getPresenceArray(roomId) });
      }
    });

    // File shared
    socket.on('file_uploaded', ({ roomId, file }) => {
      io.to(roomId).emit('receive_file', file);
    });

    // File pinned
    socket.on('file_pinned', ({ roomId, fileId, isPinned }) => {
      io.to(roomId).emit('file_pin_update', { fileId, isPinned });
    });

    // Tasks Features
    socket.on('add_task', async ({ roomId, text }) => {
      if (!text || !text.trim()) return;
      const task = {
        text: text.trim(),
        username: socket.user.username,
        isCompleted: false,
        createdAt: new Date(),
      };
      try {
        const room = await Room.findByIdAndUpdate(
          roomId,
          { $push: { tasks: task } },
          { new: true }
        );
        const addedTask = room.tasks[room.tasks.length - 1];
        io.to(roomId).emit('receive_task', addedTask);
      } catch (err) {
        console.error('Failed to add task:', err.message);
      }
    });

    socket.on('toggle_task', async ({ roomId, taskId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        const task = room.tasks.id(taskId);
        if (!task) return;
        
        task.isCompleted = !task.isCompleted;
        await room.save();
        
        io.to(roomId).emit('task_updated', { taskId, isCompleted: task.isCompleted });
      } catch (err) {
        console.error('Failed to toggle task:', err.message);
      }
    });

    socket.on('delete_task', async ({ roomId, taskId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;
        const task = room.tasks.id(taskId);
        if (!task) return;
        
        // Only creator or room owner can delete
        const isCreator = task.username === socket.user.username;
        const isOwner = room.owner.toString() === socket.user.id;
        
        if (isCreator || isOwner) {
          room.tasks.pull(taskId);
          await room.save();
          io.to(roomId).emit('task_deleted', taskId);
        }
      } catch (err) {
        console.error('Failed to delete task:', err.message);
      }
    });

    // Social Features
    socket.on('private_message', async ({ recipientId, text }) => {
      if (!text || !text.trim()) return;
      
      const Message = require('../models/Message');
      try {
        const msg = new Message({
          sender: socket.user.id,
          recipient: recipientId,
          content: text.trim()
        });
        await msg.save();
        
        // Notify recipient if online
        const recipientSocketId = userSockets[recipientId];
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive_private_message', msg);
        }
        
        // Send back to sender for confirmation
        socket.emit('receive_private_message', msg);
      } catch (err) {
        console.error('Private message error:', err);
      }
    });

    socket.on('friend_request', ({ recipientId }) => {
      const recipientSocketId = userSockets[recipientId];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('friend_request_received');
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
      delete userSockets[socket.user.id];
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = socketHandler;
