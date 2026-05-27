const router = require('express').Router();
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/rooms - list all public rooms + rooms user is member of
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false },
        { members: req.user.id },
        { owner: req.user.id },
      ],
    })
      .populate('owner', 'username')
      .populate('members', 'username')
      .select('-messages')
      .sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/rooms/:id - get single room with messages
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('owner', 'username')
      .populate('members', 'username');
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Check access for private rooms
    const isMember = room.members.some(m => m._id.toString() === req.user.id);
    const isOwner = room.owner._id.toString() === req.user.id;
    if (room.isPrivate && !isMember && !isOwner)
      return res.status(403).json({ message: 'Access denied' });

    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms - create room
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, topic, isPrivate, mode, userLimit } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name is required' });

    const room = new Room({
      name,
      description,
      topic,
      mode: mode || 'General',
      isPrivate: isPrivate || false,
      userLimit: Number(userLimit) || 0,
      owner: req.user.id,
      members: [req.user.id],
    });
    await room.save();
    await room.populate('owner', 'username');
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/rooms/:id - update room (owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const { name, description, topic, isPrivate, mode, userLimit } = req.body;
    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (topic) room.topic = topic;
    if (mode) room.mode = mode;
    if (isPrivate !== undefined) room.isPrivate = isPrivate;
    if (userLimit !== undefined) room.userLimit = Number(userLimit);

    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/rooms/:id - delete room (owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });
    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.isPrivate) {
      const isInvited = room.invitedUsers.some(u => u.toString() === req.user.id);
      const isMember = room.members.some(m => m.toString() === req.user.id);
      if (!isInvited && !isMember)
        return res.status(403).json({ message: 'You need an invitation to join this room' });
    }

    if (!room.members.includes(req.user.id)) {
      if (room.userLimit > 0 && room.members.length >= room.userLimit) {
        return res.status(403).json({ message: 'Room is full' });
      }
      room.members.push(req.user.id);
      await room.save();
    }
    res.json({ message: 'Joined room', roomId: room._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() === req.user.id)
      return res.status(400).json({ message: 'Owner cannot leave. Delete the room instead.' });

    room.members = room.members.filter(m => m.toString() !== req.user.id);
    await room.save();
    res.json({ message: 'Left room' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms/join/code - join using an invite code
router.post('/join/code', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Invite code is required' });

    const room = await Room.findOne({ inviteCode: code.toUpperCase() });
    if (!room) return res.status(404).json({ message: 'Invalid invite code' });

    if (!room.members.includes(req.user.id)) {
      if (room.userLimit > 0 && room.members.length >= room.userLimit) {
        return res.status(403).json({ message: 'Room is full' });
      }
      room.members.push(req.user.id);
      await room.save();
    }
    
    res.json({ message: 'Joined room successfully', roomId: room._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms/:id/invite - invite user by username
router.post('/:id/invite', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id)
      return res.status(403).json({ message: 'Only the owner can invite users' });

    const { username } = req.body;
    const invitedUser = await User.findOne({ username });
    if (!invitedUser) return res.status(404).json({ message: 'User not found' });

    if (!room.invitedUsers.includes(invitedUser._id)) {
      room.invitedUsers.push(invitedUser._id);
      await room.save();
    }
    res.json({ message: `${username} has been invited` });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/rooms/:id/files - Upload file to Cloudinary and save to room
router.post('/:id/files', auth, upload.single('file'), async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    const isMember = room.members.some(m => m.toString() === req.user.id);
    const isOwner = room.owner.toString() === req.user.id;
    if (!isMember && !isOwner) return res.status(403).json({ message: 'Access denied' });

    if (!req.file) return res.status(400).json({ message: 'No file provided' });

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'auto',
      folder: 'collabo_study_files',
    });

    const newFile = {
      fileName: req.file.originalname,
      fileUrl: result.secure_url,
      username: req.user.username,
      isPinned: false
    };

    room.sharedFiles.push(newFile);
    await room.save();
    
    // We get the actual file object created with an _id
    const savedFile = room.sharedFiles[room.sharedFiles.length - 1];
    res.json(savedFile);
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// PUT /api/rooms/:id/files/:fileId/pin - Toggle pin status
router.put('/:id/files/:fileId/pin', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user.id) 
      return res.status(403).json({ message: 'Only owner can pin files' });

    const file = room.sharedFiles.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.isPinned = !file.isPinned;
    await room.save();

    res.json(file);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
