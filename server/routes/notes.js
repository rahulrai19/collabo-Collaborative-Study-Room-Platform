const router = require('express').Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const auth = require('../middleware/auth');
const Note = require('../models/Note');
const User = require('../models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const upload = multer({ storage: multer.memoryStorage() });

// GET all notes
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find()
      .select('-fileData')
      .populate('uploader', 'username avatar')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notes' });
  }
});

// POST a new note
router.post('/', auth, upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, year } = req.body;
    if (!title || !description || !category || !year || !req.file) {
      return res.status(400).json({ message: 'All fields and file are required' });
    }

    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'raw';

    const note = new Note({
      title,
      description,
      category,
      year,
      fileName: req.file.originalname,
      fileType,
      fileData: req.file.buffer,
      fileContentType: req.file.mimetype,
      uploader: req.user.id
    });
    
    note.fileUrl = `/api/notes/${note._id}/file`;
    await note.save();

    // Reward uploader with 2 credits
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { notesDownloadCredits: 2 }
    });

    await note.populate('uploader', 'username avatar');
    
    const noteResponse = note.toObject();
    delete noteResponse.fileData; // Don't send massive buffer back to client
    
    res.status(201).json(noteResponse);
  } catch (err) {
    res.status(500).json({ message: 'Error uploading note', error: err.message });
  }
});

// POST download a note (consumes credit if not already owned)
router.post('/:id/download', auth, async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findById(noteId);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const user = await User.findById(req.user.id);
    const isUploader = note.uploader.toString() === user._id.toString();
    const hasDownloadedBefore = user.downloadedNotes.includes(noteId);

    // If they own it or already paid for it, free access
    if (isUploader || hasDownloadedBefore) {
      return res.json({ fileUrl: note.fileUrl, fileName: note.fileName });
    }

    // Otherwise check credits
    if (user.notesDownloadCredits <= 0) {
      return res.status(403).json({ message: 'Not enough download credits. Upload a note to get +2 credits!' });
    }

    // Deduct credit, add to downloaded, increment note downloads
    user.notesDownloadCredits -= 1;
    user.downloadedNotes.push(noteId);
    await user.save();

    note.downloads += 1;
    await note.save();

    res.json({ fileUrl: note.fileUrl, fileName: note.fileName, creditsLeft: user.notesDownloadCredits });
  } catch (err) {
    res.status(500).json({ message: 'Error downloading note', error: err.message });
  }
});

// GET file data for a note
router.get('/:id/file', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).select('fileData fileContentType fileName');
    if (!note || !note.fileData) return res.status(404).json({ message: 'File not found' });

    res.set('Content-Type', note.fileContentType);
    res.set('Content-Disposition', `inline; filename="${note.fileName}"`);
    res.send(note.fileData);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching file' });
  }
});

// DELETE a note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Only uploader can delete
    if (note.uploader.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this note' });
    }

    await note.deleteOne();
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting note', error: err.message });
  }
});

module.exports = router;
