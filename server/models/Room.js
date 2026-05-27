const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: String,
  text:     String,
  sentAt:   { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  topic:       { type: String, default: 'General' },
  mode:        { type: String, enum: ['Study With Me', 'Study Group', '24/7 Study Hall', 'General'], default: 'General' },
  owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedUsers:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate:   { type: Boolean, default: false },
  messages:    [messageSchema],
  isActive:    { type: Boolean, default: false }, // session running?
  sessionStart:{ type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
