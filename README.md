# StudyRoom — Collaborative Study Platform

A real-time collaborative study room platform where users can create virtual study rooms, invite participants, track study sessions, and collaborate via live chat.

## 🔗 Live Demo

- **Frontend:** [https://studyroom-app.vercel.app](https://studyroom-app.vercel.app) ← update after deploy
- **Backend API:** [https://studyroom-api.onrender.com](https://studyroom-api.onrender.com) ← update after deploy

## ✨ Features Implemented

- **Authentication** — Register, login with JWT (7-day tokens)
- **Study Rooms** — Create public/private rooms, join, leave, delete
- **Invite System** — Room owners can invite users by username to private rooms
- **Session Timer** — Start/stop study sessions with real-time elapsed timer
- **Real-time Chat** — Live room chat using Socket.io (messages persisted to DB)
- **Online Presence** — See who's currently in the room in real-time
- **Activity Dashboard** — Personal stats: total study time, recent sessions, rooms
- **Leaderboard** — Top 10 users ranked by total study time
- **Session History** — Per-room and per-user session history with durations

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Real-time | Socket.io (WebSockets) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

## 📁 Project Structure

```
studyroom/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── pages/           # LoginPage, RegisterPage, DashboardPage, RoomsPage, RoomPage, LeaderboardPage
│   │   ├── components/      # Layout, UI components
│   │   ├── context/         # AuthContext (global user state)
│   │   └── lib/             # api.js (axios), socket.js (socket.io client)
│   └── .env.example
└── server/                  # Express backend
    ├── models/              # User, Room, Session (Mongoose schemas)
    ├── routes/              # auth, rooms, sessions, users
    ├── middleware/          # JWT auth middleware
    ├── socket/              # Socket.io event handlers
    └── .env.example
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/studyroom.git
cd studyroom
```

### 2. Backend setup
```bash
cd server
npm install
cp .env.example .env
# Fill in your .env values (see below)
npm run dev
```

**Server `.env`:**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/studyroom
JWT_SECRET=your_random_secret_here
CLIENT_URL=http://localhost:5173
```

### 3. Frontend setup
```bash
cd client
npm install
cp .env.example .env
# .env already set for local dev
npm run dev
```

Frontend runs at `http://localhost:5173`

## 🌐 Deployment

### MongoDB Atlas
1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Add database user and whitelist `0.0.0.0/0`
3. Copy the connection string to server `.env`

### Backend → Render
1. Push code to GitHub
2. New Web Service on [render.com](https://render.com)
3. Root directory: `server`
4. Build: `npm install` | Start: `node index.js`
5. Add environment variables in Render dashboard

### Frontend → Vercel
1. New project on [vercel.com](https://vercel.com)
2. Root directory: `client`
3. Add env vars: `VITE_API_URL` and `VITE_SOCKET_URL` pointing to Render URL
4. Deploy

## 📡 API Endpoints

```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login
GET    /api/auth/me              Get current user

GET    /api/rooms                List all accessible rooms
POST   /api/rooms                Create room
GET    /api/rooms/:id            Get room with messages
PUT    /api/rooms/:id            Update room (owner)
DELETE /api/rooms/:id            Delete room (owner)
POST   /api/rooms/:id/join       Join room
POST   /api/rooms/:id/leave      Leave room
POST   /api/rooms/:id/invite     Invite user by username

POST   /api/sessions/start       Start a study session
POST   /api/sessions/stop        Stop session & save duration
GET    /api/sessions/my          Current user's session history
GET    /api/sessions/room/:id    Room's session history

GET    /api/users/search         Search users by username
GET    /api/users/leaderboard    Top 10 by study time
```

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join a room channel |
| `leave_room` | Client → Server | Leave a room channel |
| `send_message` | Client → Server | Send chat message |
| `receive_message` | Server → Client | Broadcast new message |
| `session_started` | Client → Server | Notify session start |
| `session_stopped` | Client → Server | Notify session stop |
| `session_update` | Server → Client | Session state changed |
| `presence_update` | Server → Client | Online users list |
| `user_joined` | Server → Client | Someone joined |
| `user_left` | Server → Client | Someone left |
