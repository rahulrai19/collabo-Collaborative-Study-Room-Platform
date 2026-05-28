const router = require('express').Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get message history with a specific friend
router.get('/history/:friendId', auth, async (req, res) => {
  try {
    // Verify they are friends
    const user = await User.findById(req.user.id);
    if (!user.friends.includes(req.params.friendId)) {
      return res.status(403).json({ message: 'Not friends with this user' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.friendId },
        { sender: req.params.friendId, recipient: req.user.id }
      ]
    }).sort({ createdAt: 1 }).limit(100);

    // Mark unread messages as read
    await Message.updateMany(
      { sender: req.params.friendId, recipient: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching chat history' });
  }
});

module.exports = router;
