const router = require('express').Router();
const Session = require('../models/Session');
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/sessions/start:
 *   post:
 *     summary: Start a study session (Room Owner)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId]
 *             properties:
 *               roomId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Session started
 *       403:
 *         description: Not authorized
 */
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

/**
 * @swagger
 * /api/sessions/stop:
 *   post:
 *     summary: Stop an active study session (Room Owner)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId]
 *             properties:
 *               roomId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session stopped
 *       400:
 *         description: No active session
 */
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

/**
 * @swagger
 * /api/sessions/room/{roomId}:
 *   get:
 *     summary: Get session history for a specific room
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of sessions
 */
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

/**
 * @swagger
 * /api/sessions/my:
 *   get:
 *     summary: Get current user's session history
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of user sessions
 */
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

/**
 * @swagger
 * /api/sessions/log:
 *   post:
 *     summary: Log an individual completed focus session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId, duration]
 *             properties:
 *               roomId:
 *                 type: string
 *               duration:
 *                 type: number
 *     responses:
 *       200:
 *         description: Session logged successfully
 */
// POST /api/sessions/log - log individual focus session
router.post('/log', auth, async (req, res) => {
  try {
    const { roomId, duration } = req.body;
    if (!duration) return res.status(400).json({ message: 'Duration is required' });

    await User.findByIdAndUpdate(req.user.id, { $inc: { totalStudyTime: duration } });

    const session = new Session({
      room: roomId,
      startedBy: req.user.id,
      participants: [req.user.id],
      startTime: new Date(Date.now() - duration * 1000),
      endTime: new Date(),
      duration: duration,
    });
    await session.save();

    res.json({ message: 'Session logged successfully', session });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
