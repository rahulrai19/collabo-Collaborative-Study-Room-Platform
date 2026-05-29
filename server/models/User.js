const mongoose = require('mongoose');

/**
 * Mongoose schema representing a User in the Collabo platform.
 * Handles authentication, social connections, study statistics, and credits.
 * 
 * @typedef {Object} User
 * @property {String} username - Unique handle for the user
 * @property {String} email - Unique email for authentication
 * @property {String} password - Bcrypt hashed password
 * @property {String} avatar - URL to Cloudinary hosted avatar image
 * @property {Number} totalStudyTime - Cumulative study time across all sessions (in seconds)
 * @property {Array<ObjectId>} friends - Array of confirmed friend user references
 * @property {Array<ObjectId>} pendingRequests - Inbound friend requests
 * @property {Array<ObjectId>} sentRequests - Outbound friend requests
 * @property {Number} notesDownloadCredits - System economy: credits available to download others' notes
 * @property {Array<ObjectId>} downloadedNotes - Array of note references the user has already unlocked
 */
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
