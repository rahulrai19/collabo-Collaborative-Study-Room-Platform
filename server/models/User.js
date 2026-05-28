const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatar:   { type: String, default: '' },
  totalStudyTime: { type: Number, default: 0 }, // in seconds
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notesDownloadCredits: { type: Number, default: 1 },
  downloadedNotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Note' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
