# API Documentation

## Authentication

All API requests (except `/api/auth/register` and `/api/auth/login`) require JWT token in Authorization header.

```
Authorization: Bearer <token>
```

## Response Format

All endpoints return JSON responses with consistent structure:

```json
{
  "data": {},
  "message": "Success message",
  "status": 200
}
```

Error responses:
```json
{
  "message": "Error message",
  "status": 400,
  "errors": []
}
```

## Base URL
```
https://yourdomain.com/api
```

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "displayName": "John Doe"
}

Response 201:
{
  "message": "User created successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

Validation:
- Username: 3-20 chars, alphanumeric + underscore
- Email: valid email format
- Password: min 8 chars, uppercase + lowercase + numbers
- Display Name: max 50 chars

### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response 200:
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user",
    "avatar": "url"
  }
}
```

Rate Limit: 5 attempts per 15 minutes

## User Endpoints

### Get User Profile
```
GET /users/:id
Authorization: Bearer <token>

Response 200:
{
  "id": "uuid",
  "username": "john_doe",
  "email": "john@example.com",
  "displayName": "John Doe",
  "bio": "I love forums",
  "avatar": "avatar_url",
  "role": "user",
  "reputation": 100,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Update User Profile
```
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Updated Name",
  "bio": "New bio",
  "avatar": "avatar_url"
}

Response 200:
{
  "message": "Profile updated",
  "user": { ... }
}
```

## Category Endpoints

### Get All Categories
```
GET /categories

Response 200:
[
  {
    "id": "uuid",
    "name": "General Discussion",
    "slug": "general-discussion",
    "description": "General topics",
    "icon": "💬",
    "color": "#007bff",
    "isActive": true,
    "displayOrder": 1,
    "postCount": 50
  }
]
```

### Create Category (Admin Only)
```
POST /categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "icon": "📌",
  "color": "#28a745"
}

Response 201:
{
  "message": "Category created",
  "category": { ... }
}
```

### Update Category (Admin Only)
```
PUT /categories/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "displayOrder": 2,
  "isActive": true
}

Response 200:
{
  "message": "Category updated",
  "category": { ... }
}
```

### Delete Category (Admin Only)
```
DELETE /categories/:id
Authorization: Bearer <token>

Response 200:
{
  "message": "Category deleted"
}
```

## Post Endpoints

### Get Posts
```
GET /posts?page=1&limit=10&categoryId=uuid

Response 200:
{
  "posts": [
    {
      "id": "uuid",
      "title": "Post Title",
      "slug": "post-title",
      "content": "Post content",
      "categoryId": "uuid",
      "userId": "uuid",
      "views": 150,
      "likes": 25,
      "isPinned": false,
      "isApproved": true,
      "tags": ["tag1", "tag2"],
      "User": {
        "id": "uuid",
        "username": "author",
        "avatar": "avatar_url"
      },
      "Category": {
        "name": "General"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 100,
  "pages": 10
}
```

### Get Post Detail
```
GET /posts/:id

Response 200:
{
  "id": "uuid",
  "title": "Post Title",
  "content": "Post content",
  "views": 151,
  "User": { ... },
  "Category": { ... },
  "Comments": [ ... ]
}
```

### Create Post
```
POST /posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Interesting Discussion",
  "content": "This is the post content with at least 20 characters",
  "categoryId": "uuid",
  "tags": ["tag1", "tag2"]
}

Response 201:
{
  "message": "Post created",
  "post": { ... }
}
```

Rate Limit: 10 posts per hour

### Update Post
```
PUT /posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["newtag"]
}

Response 200:
{
  "message": "Post updated",
  "post": { ... }
}
```

### Delete Post
```
DELETE /posts/:id
Authorization: Bearer <token>

Response 200:
{
  "message": "Post deleted"
}
```

## Comment Endpoints

### Get Post Comments
```
GET /comments/post/:postId

Response 200:
[
  {
    "id": "uuid",
    "content": "Great post!",
    "postId": "uuid",
    "userId": "uuid",
    "likes": 5,
    "User": {
      "username": "commenter",
      "avatar": "url"
    },
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### Create Comment
```
POST /comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This is a comment (1-5000 chars)",
  "postId": "uuid"
}

Response 201:
{
  "message": "Comment created",
  "comment": { ... }
}
```

### Update Comment
```
PUT /comments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Updated comment"
}

Response 200:
{
  "message": "Comment updated",
  "comment": { ... }
}
```

### Delete Comment
```
DELETE /comments/:id
Authorization: Bearer <token>

Response 200:
{
  "message": "Comment deleted"
}
```

## Admin Endpoints

All admin endpoints require `role: admin`

### Dashboard Stats
```
GET /admin/dashboard/stats
Authorization: Bearer <admin-token>

Response 200:
{
  "totalUsers": 150,
  "totalPosts": 500,
  "totalComments": 2000,
  "totalCategories": 5,
  "bannedUsers": 3,
  "unapprovedPosts": 2,
  "timestamp": "2024-01-15T10:00:00Z"
}
```

### Get All Users
```
GET /admin/users?page=1&limit=10&role=user&isBanned=false
Authorization: Bearer <admin-token>

Response 200:
{
  "users": [ ... ],
  "total": 150,
  "pages": 15
}
```

### Ban User
```
POST /admin/users/:userId/ban
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Spam and harassment"
}

Response 200:
{
  "message": "User banned",
  "user": { ... }
}
```

### Unban User
```
POST /admin/users/:userId/unban
Authorization: Bearer <admin-token>

Response 200:
{
  "message": "User unbanned",
  "user": { ... }
}
```

### Get Unapproved Posts
```
GET /admin/posts/unapproved
Authorization: Bearer <admin-token>

Response 200:
[
  {
    "id": "uuid",
    "title": "Post to review",
    "content": "...",
    "User": { ... },
    "Category": { ... }
  }
]
```

### Approve Post
```
POST /admin/posts/:postId/approve
Authorization: Bearer <admin-token>

Response 200:
{
  "message": "Post approved",
  "post": { ... }
}
```

### Reject Post
```
POST /admin/posts/:postId/reject
Authorization: Bearer <admin-token>

Response 200:
{
  "message": "Post rejected and deleted"
}
```

## Health Check Endpoint

### Check Service Health
```
GET /health

Response 200:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 3600,
  "environment": "production",
  "database": "connected"
}
```

## Error Codes

| Code | Message | Action |
|------|---------|--------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Check request format/validation |
| 401 | Unauthorized | Provide valid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded, retry later |
| 500 | Server Error | Server error, contact support |
| 503 | Service Unavailable | Service down, try again later |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| POST /auth/register | 3 per hour |
| POST /auth/login | 5 per 15 minutes |
| POST /posts | 10 per hour |
| All other endpoints | 100 per 15 minutes |

## Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (secure httpOnly cookie or secure storage)
3. **Include timestamp** in requests for debugging
4. **Implement exponential backoff** for retries
5. **Cache responses** where appropriate
6. **Monitor rate limits** and respect them
7. **Keep tokens fresh** and refresh before expiration
8. **Validate responses** on client side

## Testing API

### Using cURL
```bash
# Register
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"SecurePass123"}'

# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'

# Get user
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://yourdomain.com/api/users/USER_ID
```

### Using Postman
Import the collection: [postman-collection.json](./postman-collection.json)

## Webhooks (Future Feature)

Webhook support for real-time events will be coming soon. Subscribe to updates.
