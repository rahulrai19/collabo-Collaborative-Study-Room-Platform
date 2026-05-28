const router = require('express').Router();
const User = require('../models/User');
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// GET /api/users/search?username=xxx
router.get('/search', auth, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json([]);
    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user.id },
    }).select('username _id').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/leaderboard - top users by study time
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const users = await User.find()
      .select('username totalStudyTime avatar')
      .sort({ totalStudyTime: -1 })
      .limit(10);
      
    // Fetch session counts for these top 10 users
    const userIds = users.map(u => u._id);
    const sessionCounts = await Session.aggregate([
      { $unwind: '$participants' },
      { $match: { participants: { $in: userIds } } },
      { $group: { _id: '$participants', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    sessionCounts.forEach(s => countMap[s._id.toString()] = s.count);

    const result = users.map(u => ({
      ...u.toObject(),
      totalSessions: countMap[u._id.toString()] || 0
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
