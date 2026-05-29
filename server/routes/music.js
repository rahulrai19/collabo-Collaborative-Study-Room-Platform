const express = require('express');
const router = express.Router();
const Track = require('../models/Track');

// GET /api/music - Fetch all music tracks
router.get('/', async (req, res) => {
  try {
    const tracks = await Track.find().sort({ createdAt: 1 });
    res.json(tracks);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
