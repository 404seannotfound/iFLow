# iFlow Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Frontend (Port 5173)                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  Pages   │  │Components│  │  Stores  │            │ │
│  │  │  - Home  │  │ - Layout │  │  - Auth  │            │ │
│  │  │  - Login │  │ - Cards  │  │          │            │ │
│  │  │  - Loop  │  │          │  │          │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  │                                                         │ │
│  │  Vite + React Router + TailwindCSS + Zustand          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │ (Axios)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVER LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Express.js Backend (Port 3000)              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  Routes  │  │Middleware│  │ Database │            │ │
│  │  │  - Auth  │  │  - Auth  │  │   Pool   │            │ │
│  │  │  - Users │  │  - CORS  │  │          │            │ │
│  │  │  - Hubs  │  │  - Valid │  │          │            │ │
│  │  │  - Events│  │          │  │          │            │ │
│  │  │  - Videos│  │          │  │          │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  │                                                         │ │
│  │  JWT Auth + bcrypt + express-validator                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            │ (pg driver)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PostgreSQL Database                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐            │ │
│  │  │  Users   │  │  Hubs    │  │  Events  │            │ │
│  │  │  Videos  │  │  Posts   │  │Messages  │            │ │
│  │  │Marketplace│  │ Training │  │  Subs   │            │ │
│  │  └──────────┘  └──────────┘  └──────────┘            │ │
│  │                                                         │ │
│  │  21 Tables + Indexes + Triggers + Constraints          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow
```
User → Register/Login Page → POST /api/auth/login
                                      ↓
                              Verify credentials
                                      ↓
                              Generate JWT token
                                      ↓
                              Store in Zustand + localStorage
                                      ↓
                              Attach to all API requests
```

### Content Creation Flow
```
User → Create Content Form → POST /api/{resource}
                                      ↓
                              Validate JWT token
                                      ↓
                              Validate input data
                                      ↓
                              Insert into PostgreSQL
                                      ↓
                              Return created resource
                                      ↓
                              Update UI state
```

## API Architecture

### RESTful Endpoints Pattern
```
/api/auth/*          - Authentication (public)
/api/users/*         - User management (mixed)
/api/hubs/*          - Hub operations (mixed)
/api/events/*        - Event management (mixed)
/api/videos/*        - Video operations (mixed)
/api/posts/*         - Community posts (mixed)
/api/marketplace/*   - Marketplace (mixed)
/api/messages/*      - Direct messaging (protected)
```

### Authentication Middleware
```
Request → Check Authorization header
              ↓
         Extract JWT token
              ↓
         Verify token signature
              ↓
         Decode user info
              ↓
         Attach to req.user
              ↓
         Continue to route handler
```

## Database Schema Overview

### Core Entities
```
users (authentication & profiles)
  ├── user_links (external links)
  ├── verification_badges (instructor, organizer, etc.)
  └── tip_links (payment methods)

hubs (communities)
  ├── hub_members (membership)
  └── hub_fundraisers (fundraising campaigns)

events (scheduling)
  ├── event_instructors (who's teaching)
  ├── event_prop_tags (what props)
  ├── event_rsvps (attendance)
  └── event_conflicts (scheduling issues)

videos (The Loop)
  ├── video_prop_tags (categorization)
  ├── video_likes (engagement)
  ├── video_views (analytics)
  └── video_annotations (learning tools)

training_plans (skill development)
  └── training_plan_videos (saved content)

posts (community feed)
  └── post_likes (engagement)

stories (24h ephemeral)
  └── story_views (analytics)

threads (discussions)
  └── comments (nested discussions)
      └── comment_likes (engagement)

conversations (messaging)
  ├── conversation_participants (who's in)
  └── messages (message history)

marketplace_listings (props for sale)
  └── marketplace_prop_tags (categorization)

creator_tiers (monetization)
  ├── subscriptions (user subscriptions)
  └── video_purchases (one-time purchases)

prop_tags (taxonomy)
  - Used across videos, events, marketplace

notifications (user alerts)
```

## State Management

### Frontend State (Zustand)
```javascript
authStore
  ├── user (current user object)
  ├── token (JWT token)
  ├── login() (authentication)
  ├── register() (account creation)
  ├── logout() (clear session)
  └── verifyToken() (validate session)
```

### Server State (TanStack Query)
```javascript
// Future implementation for:
- Caching API responses
- Automatic refetching
- Optimistic updates
- Background synchronization
```

## Security Architecture

### Authentication
- JWT tokens with 7-day expiration
- bcrypt password hashing (10 rounds)
- Token stored in localStorage
- Automatic token refresh on app load

### Authorization
- Middleware checks JWT on protected routes
- Role-based access control (RBAC)
- Hub-specific permissions

### Data Protection
- Parameterized SQL queries (prevent injection)
- Input validation with express-validator
- CORS configuration
- Helmet.js security headers
- Environment variable protection

## Deployment Architecture (Render.com)

```
┌─────────────────────────────────────────┐
│         Render.com Platform             │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Web Service (iflow-web)         │ │
│  │   - Node.js runtime               │ │
│  │   - Auto-scaling                  │ │
│  │   - Health checks                 │ │
│  │   - SSL/TLS (automatic)           │ │
│  │   - CDN (static assets)           │ │
│  └───────────────────────────────────┘ │
│              │                          │
│              │ Internal Network         │
│              ▼                          │
│  ┌───────────────────────────────────┐ │
│  │   PostgreSQL Database             │ │
│  │   - Managed service               │ │
│  │   - Automatic backups             │ │
│  │   - Connection pooling            │ │
│  │   - SSL connections               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Performance Optimizations

### Database
- Indexed columns for fast queries
- Connection pooling (max 20 connections)
- Efficient JOIN operations
- Pagination on list endpoints

### Frontend
- Code splitting with Vite
- Lazy loading of routes
- Optimized bundle size
- CSS purging with Tailwind

### Backend
- Compression middleware
- Response caching headers
- Efficient query patterns
- Transaction support for complex operations

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- JWT tokens (no server-side sessions)
- Database connection pooling
- Ready for load balancer

### Vertical Scaling
- Efficient database queries
- Indexed lookups
- Minimal N+1 query problems
- Optimized data structures

### Future Enhancements
- Redis caching layer
- CDN for media files
- Database read replicas
- Message queue (Bull/RabbitMQ)
- WebSocket server (Socket.io)

## Monitoring & Observability

### Health Checks
- `/api/health` endpoint
- Database connection status
- Environment verification

### Logging
- Morgan HTTP request logging
- Console logging for development
- Error stack traces (dev only)

### Future Monitoring
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Analytics (Plausible/Google Analytics)
- Database query monitoring

## Development Workflow

```
Local Development
  ├── npm run dev (concurrent mode)
  │   ├── Backend: nodemon (auto-restart)
  │   └── Frontend: Vite (HMR)
  │
Production Build
  ├── npm run build (Vite build)
  │   ├── Bundle optimization
  │   ├── Asset minification
  │   └── CSS purging
  │
Deployment
  └── npm start (production server)
      ├── Serve static files
      └── API endpoints
```

## Technology Decisions

### Why React?
- Component-based architecture
- Large ecosystem
- Excellent developer experience
- Strong community support

### Why PostgreSQL?
- ACID compliance
- Complex queries support
- JSON support for flexibility
- Proven scalability

### Why Express?
- Minimal and flexible
- Middleware ecosystem
- Well-documented
- Industry standard

### Why Vite?
- Fast HMR
- Modern build tool
- Optimized production builds
- Better DX than webpack

### Why TailwindCSS?
- Utility-first approach
- Rapid prototyping
- Consistent design system
- Small production bundle

### Why Render.com?
- Simple deployment
- Automatic SSL
- PostgreSQL included
- Free tier available
- Git-based deployments

## Extension Points

### Adding New Features
1. Create database tables in `schema.sql`
2. Add API routes in `server/routes/`
3. Create frontend pages in `src/pages/`
4. Update navigation in `Layout.jsx`

### Adding Authentication Providers
- Extend `server/routes/auth.js`
- Add OAuth strategies
- Update frontend login flow

### Adding File Uploads
- Integrate AWS S3 or Cloudinary
- Add multer middleware
- Update video/image endpoints

### Adding Real-time Features
- Add Socket.io server
- Create WebSocket handlers
- Update frontend with socket client

---

This architecture is designed to be:
- **Maintainable**: Clear separation of concerns
- **Scalable**: Ready for growth
- **Secure**: Industry best practices
- **Extensible**: Easy to add features
- **Production-ready**: Deployment configured
