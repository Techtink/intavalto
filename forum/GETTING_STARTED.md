# Getting Started with Forum Admin Dashboard

## Overview

This document provides step-by-step instructions for setting up and running the complete forum application with admin dashboard.

## Quick Start

### 1. Backend Setup

```bash
# Navigate to server
cd forum/server

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Create PostgreSQL database
createdb forum_db

# Start backend server
npm run dev
```

The backend API will run on `http://localhost:5000/api`

### 2. Frontend Setup

```bash
# In a new terminal, navigate to client
cd forum/client

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start React development server
npm start
```

The frontend will run on `http://localhost:3000`

### 3. Admin Access

1. Navigate to `http://localhost:3000/login`
2. Use your admin credentials (set in `.env` on backend)
3. You'll be redirected to the admin dashboard

## Admin Dashboard Features

### Dashboard
- Real-time statistics: total users, posts, comments, categories
- Monitor banned users and unapproved content
- Quick overview of forum health

### User Management
- View all users with pagination
- Search and filter users
- Ban/unban users with reasons
- Manage user roles (user/moderator/admin)
- View user details and reputation

### Content Moderation
- Approve/reject pending posts
- Review flagged content
- Manage comments
- Bulk moderation actions

### Category Management
- Create new forum categories
- Edit category properties (name, description, icon, color)
- Set display order
- Enable/disable categories
- View post counts per category

## Key Admin Operations

### Create a New User
```javascript
POST /api/auth/register
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "displayName": "New User"
}
```

### Ban a User
```javascript
POST /api/admin/users/{userId}/ban
{
  "reason": "Violation of community guidelines"
}
```

### Approve a Post
```javascript
POST /api/admin/posts/{postId}/approve
```

### Create a Category
```javascript
POST /api/categories
{
  "name": "General Discussion",
  "slug": "general-discussion",
  "description": "General discussion topics",
  "icon": "💬",
  "color": "#007bff"
}
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb forum_db`

### Frontend Won't Connect to Backend
- Check backend is running on port 5000
- Verify `REACT_APP_API_URL` in client `.env`
- Check CORS settings in backend

### Authentication Issues
- Verify JWT_SECRET is set in backend `.env`
- Check token is stored in localStorage
- Clear browser cache and try again

## Next Steps

1. Customize the admin dashboard UI
2. Add more admin features (reports, analytics)
3. Implement email notifications
4. Set up automated backups
5. Configure SSL/TLS for production
6. Deploy to production environment

For detailed API documentation, see the main [README.md](README.md)
