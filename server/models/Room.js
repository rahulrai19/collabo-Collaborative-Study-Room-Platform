const mongoose = require('mongoose');

/**
 * Sub-schema for chat messages in a room.
 */
const messageSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  text:     String,
  sentAt:   { type: Date, default: Date.now },
});

/**
 * Sub-schema for files shared within a room.
 */
const sharedFileSchema = new mongoose.Schema({
  fileName: String,
  fileUrl:  String,
  username: String,
  isPinned: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
});

/**
 * Sub-schema for shared to-do tasks in a room.
 */
const taskSchema = new mongoose.Schema({
  text: String,
  isCompleted: { type: Boolean, default: false },
  username: String,
  createdAt: { type: Date, default: Date.now },
});

/**
 * Mongoose schema representing a Study Room.
 * Holds active members, chat history, shared files, tasks, and manages study sessions.
 * 
 * @typedef {Object} Room
 * @property {String} name - Room name
 * @property {Boolean} isPrivate - If true, requires invite or code to join
 * @property {String} inviteCode - Auto-generated 6-character hex code for private rooms
 * @property {Boolean} isActive - True if a study session is currently running
 */
const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  topic:       { type: String, default: 'General' },
  mode:        { type: String, enum: ['Study With Me', 'Study Group', '24/7 Study Hall', 'General'], default: 'General' },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedUsers:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  userLimit:   { type: Number, default: 0 },
  inviteCode:  { type: String, unique: true, sparse: true },
  isPrivate:   { type: Boolean, default: false },
  messages:    [messageSchema],
  sharedFiles: [sharedFileSchema],
  tasks:       [taskSchema],
  isActive:    { type: Boolean, default: false }, // session running?
  sessionStart:{ type: Date, default: null },
}, { timestamps: true });

// Auto-generate a 6-character invite code
roomSchema.pre('save', async function (next) {
  if (!this.inviteCode) {
    const crypto = require('crypto');
    let isUnique = false;
    while (!isUnique) {
      const code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await mongoose.models.Room.findOne({ inviteCode: code });
      if (!existing) {
        this.inviteCode = code;
        isUnique = true;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);
