require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const Track = require('./models/Track');
const connectDB = require('./config/db');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const MUSIC_DIR = path.join(__dirname, '../client/public/music');

const uploadMusicFiles = async () => {
  try {
    await connectDB();
    console.log('Connected to DB');

    // Read all mp3 files from client/public/music
    const files = fs.readdirSync(MUSIC_DIR).filter(file => file.endsWith('.mp3'));
    
    if (files.length === 0) {
      console.log('No mp3 files found in client/public/music');
      process.exit(0);
    }

    console.log(`Found ${files.length} music files to upload...`);

    for (const file of files) {
      const filePath = path.join(MUSIC_DIR, file);
      
      // We will parse a nice name from the filename
      // e.g. "leberch-ambient-deep-375261.mp3" -> "Leberch Ambient Deep"
      let name = file.replace('.mp3', '')
                     .replace(/-\d+$/, '') // remove trailing numbers
                     .split('-')
                     .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                     .join(' ');
      
      console.log(`Uploading ${file}...`);
      
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'video', // Audio files are uploaded as 'video' in cloudinary
        folder: 'collabo/music'
      });

      console.log(`Uploaded! URL: ${result.secure_url}`);

      await Track.create({
        name,
        url: result.secure_url
      });
      console.log(`Saved ${name} to DB.`);
    }

    console.log('All files uploaded and saved to DB successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during upload:', err);
    process.exit(1);
  }
};

uploadMusicFiles();
