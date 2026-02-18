# Forum Application

A full-featured, production-ready forum application with a robust admin dashboard for managing content, users, categories, and forum operations.

**✨ Features:**
- 🔐 Secure user authentication with JWT
- 📝 Full forum functionality (posts, comments, categories)
- 👨‍💼 Comprehensive admin dashboard
- 🛡️ Production-grade security (rate limiting, input validation, CORS)
- 🐳 Docker & Docker Compose ready
- 📊 Health monitoring and logging
- 🚀 Deploy to production in minutes
- 📱 Responsive design with Tailwind CSS

## Quick Links

- 🚀 [Quick Start to Production](QUICKSTART_PRODUCTION.md) - Deploy in 20 minutes
- 📖 [Full Deployment Guide](DEPLOYMENT.md) - Complete setup instructions
- 🔌 [API Documentation](API.md) - All endpoints documented
- ⚙️ [Production Operations Guide](PRODUCTION.md) - Monitoring, backups, troubleshooting

## Project Structure

```
forum/
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, validation, security
│   │   └── utils/         # Helpers, logger
│   ├── Dockerfile         # Production Docker image
│   └── package.json       # Dependencies
├── client/                # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand state management
│   │   ├── utils/         # API client
│   │   └── App.js         # Main component
│   ├── Dockerfile         # Production Docker image
│   └── package.json       # Dependencies
├── docker-compose.yml     # Full stack orchestration
├── scripts/               # Utility scripts
│   ├── setup-production.sh
│   ├── backup-db.sh
│   ├── update.sh
│   └── nginx.conf
└── documentation files   # README, DEPLOYMENT, API, PRODUCTION
```

## Features

### Core Forum Features
- **User Authentication** - Secure JWT-based authentication
- **Categories** - Organize posts into categories with moderation
- **Posts** - Create, edit, delete forum posts with markdown support
- **Comments** - Reply to posts with nested comments
- **User Profiles** - User bios, avatars, reputation system
- **Search & Filtering** - Find posts by category, tags, and keywords

### Admin Dashboard
- **Dashboard Statistics** - Overview of users, posts, comments, and activity
- **User Management** - View, edit, ban, and manage user roles
- **Content Moderation** - Approve/reject posts and comments
- **Category Management** - Create and manage forum categories
- **Moderator Assignment** - Assign moderators to categories

## Getting Started

### Local Development (5 minutes)

```bash
# Clone and setup backend
cd forum/server
npm install
cp .env.example .env
# Edit .env with local settings
npm run dev

# In another terminal, setup frontend
cd forum/client
npm install
cp .env.example .env
npm start
```

Access at: `http://localhost:3000`

### Production Deployment (20 minutes)

See [QUICKSTART_PRODUCTION.md](QUICKSTART_PRODUCTION.md) for step-by-step instructions.

TL;DR:
```bash
# 1. Get a VPS (Ubuntu 22.04, 2GB+ RAM)
# 2. SSH in and clone repository
git clone <your-repo> /app/forum
cd /app/forum

# 3. Setup and deploy
bash scripts/setup-production.sh
nano .env  # Update with your domain
docker-compose up -d

# 4. Setup SSL
sudo certbot certonly --standalone -d yourdomain.com
# Copy nginx.conf, update domain, restart

# 5. Update DNS and you're done!
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Posts
- `GET /api/posts` - Get posts with pagination
- `GET /api/posts/:id` - Get post detail
- `POST /api/posts` - Create post (authenticated)
- `PUT /api/posts/:id` - Update post (author or admin)
- `DELETE /api/posts/:id` - Delete post (author or admin)

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `POST /api/comments` - Create comment (authenticated)
- `PUT /api/comments/:id` - Update comment (author or admin)
- `DELETE /api/comments/:id` - Delete comment (author or admin)

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics (admin only)
- `GET /api/admin/users` - Get all users with pagination (admin only)
- `GET /api/admin/users/:id` - Get user details (admin only)
- `PUT /api/admin/users/:id` - Update user (admin only)
- `POST /api/admin/users/:id/ban` - Ban user (admin only)
- `POST /api/admin/users/:id/unban` - Unban user (admin only)
- `GET /api/admin/posts/unapproved` - Get unapproved posts (admin only)
- `POST /api/admin/posts/:id/approve` - Approve post (admin only)
- `POST /api/admin/posts/:id/reject` - Reject post (admin only)

## User Roles

1. **User** - Regular forum member
   - Create posts and comments
   - Edit own posts and comments
   - View forum content
   - Update profile

2. **Moderator** - Category-specific moderation
   - All user permissions
   - Approve/reject posts in assigned categories
   - Manage comments

3. **Admin** - Full system control
   - All permissions
   - Manage users and roles
   - Global content moderation
   - Category management
   - System statistics

## Database Schema

### Users Table
- id (UUID, primary key)
- username (unique, required)
- email (unique, required)
- password (hashed, required)
- displayName (optional)
- bio (optional)
- avatar (optional URL)
- role (user/moderator/admin)
- isActive, isBanned, reputation

### Categories Table
- id (UUID, primary key)
- name (unique, required)
- slug (unique)
- description (optional)
- icon, color (optional)
- displayOrder, postCount

### Posts Table
- id (UUID, primary key)
- title, slug, content (required)
- categoryId, userId (foreign keys)
- views, likes, isPinned, isApproved
- tags (array)

### Comments Table
- id (UUID, primary key)
- content (required)
- postId, userId (foreign keys)
- likes, isApproved

### Moderators Table
- id (UUID, primary key)
- userId, categoryId (foreign keys)
- permissions (array of strings)

## Development

### Running Both Services
In separate terminals:

```bash
# Terminal 1 - Backend
cd forum/server
npm run dev

# Terminal 2 - Frontend
cd forum/client
npm start
```

### Building for Production

Backend:
```bash
cd forum/server
npm run build  # if applicable
```

Frontend:
```bash
cd forum/client
npm run build
```

## Security Considerations

- All passwords are hashed with bcrypt (10 salt rounds)
- JWT tokens expire after 7 days (configurable)
- Admin routes require admin role authentication
- User data is validated on both client and server
- CORS is configured for development

## Future Enhancements

- Real-time notifications with WebSockets
- Advanced search with Elasticsearch
- Email notifications
- User reputation and badges system
- Post voting system
- Advanced analytics
- Two-factor authentication
- API rate limiting

## License

MIT
