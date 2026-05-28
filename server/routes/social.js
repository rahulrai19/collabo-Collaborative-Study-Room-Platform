const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) return res.json([]);
    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.user.id } // exclude self
    }).select('username avatar totalStudyTime');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error searching users' });
  }
});

// Get friends & pending requests
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friends', 'username avatar totalStudyTime')
      .populate('pendingRequests', 'username avatar totalStudyTime')
      .populate('sentRequests', 'username avatar totalStudyTime');
    res.json({
      friends: user.friends,
      pendingRequests: user.pendingRequests,
      sentRequests: user.sentRequests
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching friends' });
  }
});

// Send friend request
router.post('/request/:id', auth, async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ message: 'Cannot request yourself' });
    const targetUser = await User.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    if (user.friends.includes(targetUser._id)) return res.status(400).json({ message: 'Already friends' });
    if (user.sentRequests.includes(targetUser._id)) return res.status(400).json({ message: 'Request already sent' });
    
    // Add to target's pending and user's sent
    targetUser.pendingRequests.push(user._id);
    user.sentRequests.push(targetUser._id);
    
    await targetUser.save();
    await user.save();
    
    // In a real app we'd trigger a socket event here
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending request' });
  }
});

// Accept friend request
router.post('/accept/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    // Remove from pending
    user.pendingRequests = user.pendingRequests.filter(id => id.toString() !== targetUser._id.toString());
    targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== user._id.toString());
    
    // Add to friends
    if (!user.friends.includes(targetUser._id)) user.friends.push(targetUser._id);
    if (!targetUser.friends.includes(user._id)) targetUser.friends.push(user._id);
    
    await user.save();
    await targetUser.save();
    
    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Error accepting request' });
  }
});

// Reject/Cancel request
router.post('/reject/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    // Remove from all arrays just in case
    user.pendingRequests = user.pendingRequests.filter(id => id.toString() !== targetUser._id.toString());
    user.sentRequests = user.sentRequests.filter(id => id.toString() !== targetUser._id.toString());
    
    targetUser.pendingRequests = targetUser.pendingRequests.filter(id => id.toString() !== user._id.toString());
    targetUser.sentRequests = targetUser.sentRequests.filter(id => id.toString() !== user._id.toString());
    
    await user.save();
    await targetUser.save();
    
    res.json({ message: 'Request removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error handling request' });
  }
});

// Remove friend
router.post('/remove/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) return res.status(404).json({ message: 'User not found' });
    
    // Remove from friends arrays
    user.friends = user.friends.filter(id => id.toString() !== targetUser._id.toString());
    targetUser.friends = targetUser.friends.filter(id => id.toString() !== user._id.toString());
    
    await user.save();
    await targetUser.save();
    
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing friend' });
  }
});

module.exports = router;
