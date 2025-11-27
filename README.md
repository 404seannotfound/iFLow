# 🌊 iFlow - Flow Arts Community Platform

> Unifying the flow arts world into a single, purpose-built ecosystem

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue.svg)](https://www.postgresql.org/)

## 🎯 Overview

iFlow is a comprehensive platform designed specifically for the flow arts community, replacing the fragmented ecosystem of Facebook, Instagram, and Patreon with one unified, purpose-built solution.

### Key Features

- 📅 **Event Management** - Schedule events with conflict detection and safety ratings
- 🎥 **The Loop** - Vertical video feed for skill sharing with frame-by-frame analysis
- �️ **Hub Communities** - Connect with local flow arts scenes
- 🛍️ **Marketplace** - Buy, sell, and trade props
- 📚 **Training Plans** - Save videos and track your skill development
- 💰 **Creator Economics** - Support instructors through tips and subscriptions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd iFLow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb iflow
   
   # Run schema
   psql iflow < database/schema.sql
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```
   
   This starts:
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:5173

## 📁 Project Structure

```
iFLow/
├── database/
│   └── schema.sql          # PostgreSQL database schema
├── server/
│   ├── index.js           # Express server entry point
│   ├── database/
│   │   └── db.js          # Database connection & helpers
│   ├── middleware/
│   │   └── auth.js        # Authentication middleware
│   └── routes/            # API route handlers
│       ├── auth.js
│       ├── users.js
│       ├── hubs.js
│       ├── events.js
│       ├── videos.js
│       ├── posts.js
│       ├── marketplace.js
│       └── messages.js
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main app component
│   ├── index.css          # Global styles (Tailwind)
│   ├── components/
│   │   └── Layout.jsx     # Main layout with navigation
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── TheLoop.jsx
│   │   ├── Events.jsx
│   │   ├── Hubs.jsx
│   │   ├── Marketplace.jsx
│   │   └── Profile.jsx
│   └── stores/
│       └── authStore.js   # Zustand auth state management
├── package.json
├── vite.config.js
├── tailwind.config.js
├── render.yaml            # Render.com deployment config
└── DEPLOYMENT.md          # Deployment guide

```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **TanStack Query** - Server state management
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Primary database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### DevOps
- **Render.com** - Hosting platform
- **Git** - Version control

## 🗄️ Database Schema

The application uses PostgreSQL with a comprehensive schema supporting:

- User management and authentication
- Hub communities and memberships
- Event scheduling with conflict detection
- Video content ("The Loop")
- Training plans and collections
- Community posts and discussions
- Direct messaging
- Marketplace listings
- Creator monetization (tiers, subscriptions, tips)
- Notifications

See `database/schema.sql` for the complete schema.

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/:userId` - Get user profile
- `PATCH /api/users/me` - Update own profile

### Hubs
- `GET /api/hubs` - List all hubs
- `GET /api/hubs/:hubId` - Get hub details
- `POST /api/hubs` - Create new hub
- `POST /api/hubs/:hubId/join` - Join a hub

### Events
- `GET /api/events` - List events (with filters)
- `POST /api/events` - Create event
- `POST /api/events/:eventId/rsvp` - RSVP to event

### Videos (The Loop)
- `GET /api/videos` - Get video feed
- `POST /api/videos` - Upload video
- `POST /api/videos/:videoId/like` - Like video
- `DELETE /api/videos/:videoId/like` - Unlike video

### Posts
- `GET /api/posts` - Get posts feed
- `POST /api/posts` - Create post
- `POST /api/posts/:postId/like` - Like post

### Marketplace
- `GET /api/marketplace` - List marketplace items
- `POST /api/marketplace` - Create listing

### Messages
- `GET /api/messages/conversations` - Get user's conversations
- `GET /api/messages/conversations/:id` - Get conversation messages
- `POST /api/messages/conversations/:id/messages` - Send message

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions for Render.com.

### Quick Deploy to Render

1. Push code to GitHub/GitLab
2. Connect repository to Render
3. Render auto-detects `render.yaml` and deploys both database and web service
4. Initialize database with schema
5. Your app is live! 🎉

## 🧪 Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server:dev` - Start backend only
- `npm run client:dev` - Start frontend only
- `npm run build` - Build for production
- `npm start` - Start production server

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/iflow
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:5173
```

## 📋 Roadmap

### Version 2.0 (Current)
- ✅ User authentication and profiles
- ✅ Hub communities
- ✅ Event scheduling with conflict detection
- ✅ Video feed (The Loop)
- ✅ Marketplace
- ✅ Direct messaging
- ✅ Basic monetization features

### Future Versions
- 🔄 Real-time notifications
- 🔄 Live streaming
- 🔄 Advanced video analysis tools
- 🔄 Mobile apps (iOS/Android)
- 🔄 VR/AR choreography tools
- 🔄 Automated fire-permit management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Built for flow artists, by flow artists. Special thanks to the global flow arts community for inspiration and feedback.

---

## �📘 Product Requirements Document (PRD)

### iFlow Application – Version 2.0 Scope

⸻

### 1. Product Overview

1.1 Problem Statement

The flow arts community currently depends on a fragmented array of general-purpose platforms—Facebook, Instagram, Patreon, Discord, and ad-hoc spreadsheets—to organize events, share videos, learn skills, and support instructors. These platforms are not optimized for flow arts needs, resulting in:
	•	Event conflicts and unreliable scheduling
	•	Poor discoverability of skills or local gatherings
	•	Loss of institutional knowledge (posts buried in noisy feeds)
	•	No integrated learning tools
	•	Little financial support for instructors within community platforms
	•	Fragmented identity and safety culture

⸻

1.2 Product Vision

iFlow unifies the flow arts world into a single platform:
	•	Local logistics become reliable
	•	Skill development becomes structured
	•	Creator income becomes sustainable
	•	Hubs become strong, safe, and well-organized
	•	Every prop and skill becomes searchable, learnable, and archivable

The app replaces the utility of Facebook, Instagram, and Patreon—but tailored specifically to the needs and values of the flow arts ecosystem.

⸻

1.3 Goals
	1.	Replace Facebook groups as the primary hub for logistics.
	2.	Replace Instagram as the primary tool for skill discovery and sharing.
	3.	Replace Patreon as the central creative monetization space.
	4.	Build a community-first ecosystem with safety, learning, and accessibility at the core.
	5.	Enable Hubs to organize themselves through consistent structure and reliable digital tooling.

⸻

2. User Personas

2.1 Instructor / Performer

Needs:
	•	Easy way to share skills
	•	Earn consistent income
	•	Organize classes and events
	•	Build a reputation through verified status

Pain Points:
	•	Multiplatform fragmentation
	•	Loss of students between platforms
	•	No integrated analysis tools for teaching

⸻

2.2 Hub Organizer

Needs:
	•	Event scheduling with conflict prevention
	•	Attendance tracking
	•	Hub announcements and safety notices
	•	Fundraising tools

Pain Points:
	•	Facebook’s chaotic feed
	•	No scheduling intelligence
	•	No shared safety infrastructure

⸻

2.3 Flow Student / New Spinner

Needs:
	•	Discover new moves and props
	•	Save videos into training plans
	•	Understand local events
	•	Basic communication tools

Pain Points:
	•	Instagram burying educational content
	•	No drill/analysis tools
	•	Hard to find local meetups

⸻

2.4 Marketplace User (Buyer/Seller)

Needs:
	•	A place to trade gear, props, and art
	•	Filtering by prop, hub, and distance
	•	Safe communication

⸻

3. Scope & Key Features

Organized under the three foundational pillars of the iFlow ecosystem.

⸻

Pillar 1: Local Logistics & Scheduling

3.1 Event Tools

FR-07 Event Scheduler

Requirement:
Users can create, edit, publish, and view local events.
Includes: time, date, location, instructor(s), prop tags, safety roles, and notes.

Acceptance Criteria:
	•	User can publish an event with required fields
	•	Event displays on Hub calendar and feed
	•	Users can RSVP

⸻

FR-02 Conflict Detection

Requirement:
Before publishing an event, system must auto-check for:
	•	Overlapping time at the same hub
	•	Instructor double-bookings
	•	Missing safety roles for fire events

Acceptance Criteria:
	•	Conflicts block publication
	•	Conflict warnings shown in UI
	•	Organizer provided actionable resolution steps

⸻

FR-01 Flow Rating (Event Quality Score)

Requirement:
Every event generates a quality/safety score based on:
	•	Conflict resolution history
	•	Organizer reliability (past cancellations)
	•	Safety coverage

Acceptance Criteria:
	•	Score visible on event card
	•	Score recalculates based on event history

⸻

FR-20 RSVP & Attendance Tracking

Requirement:
Users mark: Going / Interested / Not Going.
Organizers see lists for planning.

Acceptance Criteria:
	•	Accurate attendee list
	•	Organizers can export or reference attendance

⸻

3.2 Community Communication

FR-19 Pinned Hub Announcements

Requirement:
Hub organizers can pin important posts to the top of the feed.

Acceptance Criteria:
	•	Pinned posts must always appear first
	•	Only users with Hub Organizer role can pin

⸻

FR-18 Community Feed Posts

Requirement:
280-character micro-posts for daily communication.

Acceptance Criteria:
	•	Posts appear in chronological order
	•	Can include hashtags and prop tags

⸻

FR-14 Asynchronous Discussion Threads

Requirement:
Long-form discussion threads linked to:
	•	Events
	•	Marketplace posts
	•	Loop videos

Acceptance Criteria:
	•	Supports multiple comments, replies, and notifications
	•	Thread persists and is searchable

⸻

FR-11 Direct Messaging

Requirement:
Private 1:1 and small-group messaging.

Acceptance Criteria:
	•	Must send, receive, read receipts
	•	Supports images and links
	•	Secure and private

⸻

FR-15 Hub Live Stream (Reserved)

Requirement:
Placeholder for a future live streaming feature tied to a Hub.

Acceptance Criteria:
	•	UI placeholder only in this version
	•	Not functional in V2.0

⸻

⸻

Pillar 2: Skill Development & Visual Analysis

3.3 Video System

FR-04 “The Loop” Video Feed

Requirement:
Vertical short-form feed showing:
	•	Skill demos
	•	Instructor content
	•	Hub- or prop-filtered content

Acceptance Criteria:
	•	Videos autoplay on scroll
	•	Feed personalizes by prop preference
	•	Users can like, comment, and save

⸻

FR-04.1 Frame-by-Frame Analysis Tool

Requirement:
Advanced playback tools:
	•	Scrubbing
	•	Looping
	•	Slow motion
	•	On-screen annotations

Acceptance Criteria:
	•	User can pause, step through frames
	•	User can set loop in/out points
	•	Annotations save to training plans

⸻

3.4 Learning Tools

FR-05 Standardized Prop Tags

Requirement:
Consistent tag framework across:
	•	Loop
	•	Events
	•	Marketplace

Acceptance Criteria:
	•	Must support multi-select
	•	Tags must unify filtering across app

⸻

FR-21 Saved Collections / Training Plans

Requirement:
User can save Loop videos into custom folders.

Acceptance Criteria:
	•	Create, rename, delete folders
	•	Add/remove videos
	•	Videos retain annotations

⸻

3.5 Profile & Identity

FR-16 Flow Stories (24h)

Ephemeral multimedia posts.

Acceptance Criteria:
	•	Auto-expire in 24 hours
	•	View count available to poster

⸻

FR-22 Multi-Link Profiles

Requirement:
Allow users to link external sites (Etsy, Patreon, etc.)

Acceptance Criteria:
	•	Up to N links
	•	Consistent display UI

⸻

FR-17 Verification Badges

Requirement:
Badge system for:
	•	Verified Instructor
	•	Hub Organizer
	•	Performer
	•	Safety Lead

Acceptance Criteria:
	•	Badge approval workflow
	•	Badges display on profile and content

⸻

⸻

Pillar 3: Creator Economics & Marketplace

3.6 Marketplace

FR-13 Flow Marketplace

Requirement:
Hub-filtered listing system for buying, selling, and trading props.

Acceptance Criteria:
	•	Create/edit/delete listings
	•	Filter by Hub, prop, price, distance
	•	Messaging via DMs

⸻

3.7 Monetization Tools

FR-12 Instructor Tipping

Requirement:
Tip button on instructor content linking to external payments.

Acceptance Criteria:
	•	Tip button visible on all posts
	•	Links validated for safety

⸻

FR-12.1 Paywall Gating (Premium Videos)

Requirement:
Videos can be locked until a one-time purchase.

Acceptance Criteria:
	•	Locked preview blurred
	•	After purchase, permanently accessible

⸻

FR-12.3 Tiered Access Control

Requirement:
Creators define up to three subscription tiers.

Acceptance Criteria:
	•	Tier levels editable by creator
	•	Content tagged per tier
	•	System correctly checks user subscription before showing

⸻

FR-12.4 Gated Feed Visibility

Requirement:
Dedicated My Subscriptions feed showing only content user is entitled to.

Acceptance Criteria:
	•	Feed only populated with matched tiers
	•	Auto-refresh when subscription changes

⸻

FR-12.2 Hub Fundraising

Requirement:
Organizers create fundraising goals for Hub needs.

Acceptance Criteria:
	•	Funding goal description & amount
	•	Progress bar
	•	External link to payment platform

⸻

⸻

4. Non-Functional Requirements (NFRs)

NFR-01 Reliability

System uptime target: 99.5%.

NFR-02 Performance

Video feed scroll latency: < 120ms
Event load time: < 500ms

NFR-03 Security

Encrypted DMs
Role-based access controls
Payment links validated

NFR-04 Scalability

Support 10,000 Hubs globally.

NFR-05 Accessibility

WCAG 2.1 AA compliance where possible.

⸻

5. Success Metrics

Community Success KPI
	•	Event attendance ↑
	•	Safety incidents ↓
	•	Hub engagement ↑

Skill Development KPI
	•	% of Loop videos saved to training plans
	•	User retention correlated to training activity

Monetization KPI
	•	Tips per instructor per month
	•	Subscription conversion rate
	•	Marketplace transaction volume

⸻

6. Out of Scope (for V2.0)
	•	Real-time live streaming (reserved placeholder only)
	•	VR/AR choreography tools
	•	Real-time collaborative whiteboarding
	•	Automated fire-permit management

⸻

7. Appendix
	•	Complete Prop Tag Dictionary
	•	Hub Role Definitions
	•	Event Safety Guidelines