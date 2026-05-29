<div align="center">
  <br />
    <img src="./client/public/favicon.png" alt="Collabo Logo" width="80" height="80">
  <br />
  <h1 align="center">Collabo</h1>
  <p align="center">
    <strong>A next-generation real-time collaborative study room platform.</strong>
    <br />
    Focus deeper, study smarter, and connect with peers around the world.
  </p>
  <p align="center">
    <a href="https://collabo-room.vercel.app"><b>🔴 View Live Demo</b></a>
  </p>
</div>

<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#-about-the-project">About The Project</a></li>
    <li><a href="#-key-features">Key Features</a></li>
    <li><a href="#-tech-stack">Tech Stack</a></li>
    <li><a href="#-getting-started">Getting Started</a></li>
    <li><a href="#-api-endpoints">API Endpoints</a></li>
  </ol>
</details>

## 🚀 About The Project

Collabo is a highly interactive, beautifully designed virtual study platform built to keep you productive. Whether you need a private room to cram with friends, or a 24/7 public study hall to stay accountable, Collabo provides the ultimate environment to track your time, listen to ambient focus music, and eliminate distractions.


![alt text](Resource/Screenshots/ss.png)

## ✨ Key Features

### 👥 Real-Time Collaboration
See exactly who is studying with you, right now. 
- **Live Members Panel:** Slide-out panel to view who is currently focusing or taking a break.
- **Global Chat:** Real-time socket-based messaging within your room.

![alt text](Resource/Screenshots/image-1.png)


### 🔒 Private & Public Study Rooms
Create dedicated environments for any type of study session:
- **Public Study Halls:** Meet new people and study together.
- **Private Rooms:** Lock rooms with a passcode or invite-only links.
- **Invite System:** Easily invite friends by their username or share a 6-digit room code.

![alt text](Resource/Screenshots/image.png)


### 🎯 Deep Focus Mode & Distraction Tracking
Eliminate procrastination with the **Deep Focus Mode**. When enabled, the app enters fullscreen and tracks your tab-switches and window minimizes.
- Auto-punishes distractions with a 3-strike system.
- Alerts you when you leave the study tab.

![alt text](Resource/Screenshots/image-2.png)
![alt text](Resource/Screenshots/image-4.png)
![alt text](Resource/Screenshots/image-3.png)
![alt text](Resource/Screenshots/image-5.png)

### 📊 Comprehensive Activity Tracking
Your study time is precious, so we automatically log it for you.
- **Auto-Save:** Sessions are securely auto-saved to the database even if you accidentally close the tab (with a smart 5-minute minimum threshold).
- **Global Leaderboard:** Compete with other students and rank up by accumulating study hours.
- **Activity Calendar:** GitHub-style contribution graph showing your daily study habits.
![alt text](Resource/Screenshots/image-6.png)
![alt text](Resource/Screenshots/image-7.png)
### 📁 File Sharing & Shared Notes
Upload and pin study materials directly to the room for everyone to access.
- Upload PDF, Images, or Documents.
- Everyone in the room can instantly download shared resources.
![alt text](Resource/Screenshots/image-8.png)

### 🎧 Built-in Ambient Music Player
Study in the zone without leaving the app. The integrated music player streams Lofi and Ambient tracks directly from a cloud CDN (Cloudinary) to ensure zero lag.

![alt text](Resource/Screenshots/image-9.png)

### 📌 Picture-in-Picture Floating Timer
Never lose track of your study sessions when you switch tabs or applications.
- Pop out the study timer into a floating window that stays on top of all your applications.
- Features dynamic color rings indicating your current study mode and native Play/Pause controls.

![alt text](image.png)

### ✅ Shared Room Tasks
Collaborate on a real-time synchronized to-do list with everyone in the room.
- Add study goals and check them off as you complete them.
- Instantly syncs across all participants' screens.
![alt text](image-1.png)

### 📱 Responsive Mobile Layout
Study on the go! The entire platform is fully optimized for mobile devices.
- Custom slide-out menus designed for phone screens.
- Mobile-optimized deep focus tracking.
<p align="center">
  <img src="Resource/Screenshots/image-10.png" width="32%" />
  <img src="Resource/Screenshots/image-11.png" width="32%" />
  <img src="Resource/Screenshots/image-12.png" width="32%" />
</p>

### 🎨 Customizable Themes & Backgrounds
Personalize your study environment to fit your mood.
- Switch between multiple beautiful HD backgrounds (Beach, Forest, Gradient, etc.)
- Fully supported Dark Mode and Light Mode for the entire application.
![alt text](Resource/Screenshots/image-14.png)
![alt text](Resource/Screenshots/image-15.png)
![alt text](Resource/Screenshots/image-13.png)
## 🛠 Tech Stack

Collabo is built with modern web technologies to ensure a snappy, real-time experience.

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB & Mongoose |
| **Real-Time** | Socket.io (WebSockets) |
| **File Storage** | Cloudinary (CDN for Audio & Images) |

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas Account
- Cloudinary Account (for hosting music and avatars)

### 1. Clone & Install
```bash
git clone https://github.com/rahulrai19/collabo-Collaborative-Study-Room-Platform.git

cd studyroom

# Install Backend
cd server && npm install

# Install Frontend
cd ../client && npm install
```

### 2. Environment Variables

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/collabo
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:5173

# Cloudinary Setup for Media
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run the App

Start both servers in development mode:
```bash
# Terminal 1 (Backend)
cd server && npm run dev

# Terminal 2 (Frontend)
cd client && npm run dev
```
Your frontend will be available at `http://localhost:5173`.

## 🌐 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Create an account
- `POST /login` - Authenticate & receive JWT
- `GET /me` - Validate JWT session
- `POST /avatar` - Upload user profile picture

### Users (`/api/users`)
- `GET /search` - Search users by username
- `GET /leaderboard` - Fetch global leaderboard

### Social & Friends (`/api/social`)
- `GET /search` - Search for friends
- `GET /friends` - Fetch friends list
- `POST /request/:id` - Send friend request
- `POST /accept/:id` - Accept friend request
- `POST /reject/:id` - Reject friend request
- `POST /remove/:id` - Remove friend

### Rooms (`/api/rooms`)
- `GET /` - Fetch all public/accessible rooms
- `GET /:id` - Fetch room details
- `POST /` - Create a new room
- `PUT /:id` - Update room details
- `DELETE /:id` - Delete a room
- `POST /:id/join` - Join a public room
- `POST /:id/leave` - Leave a room
- `POST /join/code` - Join a private room via 6-digit code
- `POST /:id/invite` - Send invite to a user
- `POST /:id/files` - Upload shared file
- `PUT /:id/files/:fileId/pin` - Toggle pin on a shared file

### Chat (`/api/chat`)
- `GET /history/:friendId` - Get private chat history

### Feed (`/api/feed`)
- `GET /` - Get social feed
- `POST /` - Create a new feed post
- `POST /:id/like` - Like/Unlike a post
- `DELETE /:id` - Delete a post

### Notes (`/api/notes`)
- `GET /` - Fetch user notes
- `POST /` - Create/Upload a new note
- `POST /:id/download` - Track note download
- `GET /:id/file` - Get note file
- `DELETE /:id` - Delete a note

### Sessions (`/api/sessions`)
- `POST /start` - Start tracking a study session
- `POST /stop` - Stop tracking a session
- `GET /room/:roomId` - Get session stats for a room
- `GET /my` - Get logged user's sessions
- `POST /log` - Auto-log completed or partial focus sessions

### Music (`/api/music`)
- `GET /` - Fetch dynamic Cloudinary music playlist

---
<div align="center">
  <i>Built with ❤️ for focused studying.</i>
</div>
