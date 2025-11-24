# Dove Ministries Africa Backend

A comprehensive backend API for managing Dove Ministries Africa's content and admin functionality.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access (admin, moderator, user)
- **Content Management**: CRUD operations for sermons, devotions, events, ministries, gallery, news
- **Prayer Requests**: Manage prayer requests with follow-up tracking
- **File Upload**: Support for image and media uploads
- **Search & Filtering**: Advanced search capabilities across all content
- **Statistics**: Analytics and reporting for content performance

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File uploads
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   - Copy `.env` file and update values
   - Ensure MongoDB is running locally or update MONGODB_URI

3. **Seed Database:**
   ```bash
   node scripts/seed.js
   ```

4. **Start Server:**
   ```bash
   npm run dev  # Development with nodemon
   npm start    # Production
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Sermons
- `GET /api/sermons` - Get all sermons (with filtering)
- `GET /api/sermons/featured` - Get featured sermons
- `GET /api/sermons/:id` - Get single sermon
- `POST /api/sermons` - Create sermon (moderator+)
- `PUT /api/sermons/:id` - Update sermon (moderator+)
- `DELETE /api/sermons/:id` - Delete sermon (moderator+)

### Devotions
- `GET /api/devotions` - Get all devotions
- `GET /api/devotions/:id` - Get single devotion
- `POST /api/devotions` - Create devotion (moderator+)
- `PUT /api/devotions/:id` - Update devotion (moderator+)
- `DELETE /api/devotions/:id` - Delete devotion (moderator+)

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (moderator+)
- `PUT /api/events/:id` - Update event (moderator+)
- `DELETE /api/events/:id` - Delete event (moderator+)

### Ministries
- `GET /api/ministries` - Get all ministries
- `GET /api/ministries/:id` - Get single ministry
- `POST /api/ministries` - Create ministry (admin)
- `PUT /api/ministries/:id` - Update ministry (admin)
- `DELETE /api/ministries/:id` - Delete ministry (admin)

### Prayer Requests
- `GET /api/prayer-requests` - Get prayer requests (admin/moderator)
- `POST /api/prayer-requests` - Submit prayer request (public)
- `PUT /api/prayer-requests/:id` - Update prayer request (admin/moderator)
- `DELETE /api/prayer-requests/:id` - Delete prayer request (admin)

### Gallery
- `GET /api/gallery` - Get gallery images
- `POST /api/gallery` - Upload image (moderator+)
- `DELETE /api/gallery/:id` - Delete image (moderator+)

### News
- `GET /api/news` - Get news articles
- `GET /api/news/:id` - Get single article
- `POST /api/news` - Create news article (moderator+)
- `PUT /api/news/:id` - Update article (moderator+)
- `DELETE /api/news/:id` - Delete article (moderator+)

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Admin Dashboard

To create an admin dashboard, you can build a separate React app or add admin routes to the existing frontend. The backend provides all necessary APIs for:

- User management
- Content CRUD operations
- Analytics and statistics
- Prayer request management

## File Structure

```
backend/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Authentication middleware
├── scripts/         # Database seeding scripts
├── uploads/         # File uploads directory
├── server.js        # Main server file
├── package.json
├── .env            # Environment variables
└── README.md
```

## Security Features

- JWT authentication with expiration
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based access control

## Development

- Use `npm run dev` for development with auto-restart
- MongoDB should be running locally
- Environment variables must be configured
- API documentation can be generated with tools like Swagger

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper CORS origins
4. Configure file upload limits
5. Set up SSL/HTTPS
6. Configure rate limiting appropriately
7. Set up proper logging

## Contributing

1. Follow the existing code structure
2. Add proper validation for all inputs
3. Include error handling
4. Add appropriate authentication checks
5. Update this README for new features