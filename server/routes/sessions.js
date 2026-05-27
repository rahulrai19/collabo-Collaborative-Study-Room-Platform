const router = require('express').Router();
const Session = require('../models/Session');
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

// POST /api/sessions/start
router.post('/start', auth, async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Only owner can start a session
    if (room.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the room owner can start a session' });

    if (room.isActive)
      return res.status(400).json({ message: 'Session already active' });

    room.isActive = true;
    room.sessionStart = new Date();
    await room.save();

    const session = new Session({
      room: roomId,
      startedBy: req.user.id,
      participants: room.members,
      startTime: new Date(),
    });
    await session.save();

    res.status(201).json({ message: 'Session started', session });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/sessions/stop
router.post('/stop', auth, async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the room owner can stop the session' });
    if (!room.isActive)
      return res.status(400).json({ message: 'No active session' });

    const endTime = new Date();
    const duration = Math.floor((endTime - room.sessionStart) / 1000); // seconds

    room.isActive = false;
    room.sessionStart = null;
    await room.save();

    // Find and update the latest session
    const session = await Session.findOne({ room: roomId, endTime: null }).sort({ createdAt: -1 });
    if (session) {
      session.endTime = endTime;
      session.duration = duration;
      session.participants = room.members;
      await session.save();
    }

    // Update total study time for all members
    await User.updateMany(
      { _id: { $in: room.members } },
      { $inc: { totalStudyTime: duration } }
    );

    res.json({ message: 'Session stopped', duration, session });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/sessions/room/:roomId - session history for a room
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ room: req.params.roomId })
      .populate('startedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/sessions/my - current user's session history
router.get('/my', auth, async (req, res) => {
  try {
    const sessions = await Session.find({ participants: req.user.id })
      .populate('room', 'name topic')
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
