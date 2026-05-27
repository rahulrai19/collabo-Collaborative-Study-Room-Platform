const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  room:      { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startTime: { type: Date, required: true },
  endTime:   { type: Date, default: null },
  duration:  { type: Number, default: 0 }, // in seconds
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
