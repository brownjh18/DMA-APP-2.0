# Cloud Deployment Configuration for Dove Ministries Backend
# Follow this guide to deploy your backend to cloud servers

## Recommended Cloud Platforms

### 1. Backend Hosting (Free Tier Available)
- **Render** (Recommended) - Easy deployment, free tier available
- **Railway** - Simple deployment, good free tier
- **Fly.io** - Good for global deployment
- **Heroku** - Classic choice, free tier recently limited

### 2. Database (Cloud MongoDB)
- **MongoDB Atlas** - Official cloud MongoDB, free tier available
- **MongoDB Atlas Free Tier**: 512 MB storage, shared cluster

### 3. File Storage (Cloud Storage)
- **Cloudinary** - Best for images/videos, free tier available
- **AWS S3** - Enterprise-grade, free tier for 12 months
- **UploadThing** - Simple file uploads for Next.js/React

## Quick Start: Deploy to Render + MongoDB Atlas

### Step 1: Set up MongoDB Atlas (Cloud Database)

1. Go to https://www.mongodb.com/atlas/database
2. Create a free account
3. Create a free cluster (M0 tier)
4. Set up username and password for database access
5. Add IP address: `0.0.0.0/0` (allows access from anywhere)
6. Create a database named: `dove-ministries`
7. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dove-ministries?retryWrites=true&w=majority
   ```

### Step 2: Deploy Backend to Render

1. Go to https://render.com
2. Create a free account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables: Add variables from section below

### Step 3: Environment Variables (Add these to Render)

```env
# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dove-ministries?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=production
PORT=10000

# Authentication (Generate secure random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Google OAuth (Optional - for Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# CORS (Your frontend URL)
CORS_ORIGIN=https://your-frontend-domain.com
```

### Step 4: Update Frontend API URL

In your DMA frontend, update the API base URL:
- File: `DMA/src/config/api.js` or similar
- Change from `http://localhost:5000` to your Render URL

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `NODE_ENV` | Yes | Set to `production` for production |
| `PORT` | No | Port number (Render uses 10000 by default) |
| `JWT_SECRET` | Yes | Secret key for JWT tokens (min 32 characters) |
| `JWT_EXPIRES_IN` | No | Token expiration time (default: 7d) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |
| `CORS_ORIGIN` | No | Frontend URL for CORS (default: allows all) |

## Troubleshooting Common Issues

### 1. MongoDB Connection Failed
- Check that your IP address is allowed in MongoDB Atlas Network Access
- Verify the connection string is correct
- Ensure database user has proper permissions

### 2. CORS Errors
- Add your frontend domain to `CORS_ORIGIN` environment variable
- Or update server.js to allow your domain

### 3. File Uploads Not Working
- Render has ephemeral file system - use cloud storage
- See "Cloud File Storage" section below

### 4. Application Crashes on Startup
- Check logs in Render dashboard
- Ensure all environment variables are set
- Verify MongoDB Atlas cluster is running

## Cloud File Storage Setup (Required for Production)

Since Render has ephemeral file system, you need cloud storage for uploads.

### Option A: Cloudinary (Recommended for Media)

1. Go to https://cloudinary.com
2. Create free account
3. Get your credentials:
   - Cloud Name
   - API Key
   - API Secret

4. Install Cloudinary:
```bash
npm install cloudinary multer-storage-cloudinary
```

5. Update server.js to use Cloudinary:
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dove-ministries',
    allowed_formats: ['jpg', 'png', 'mp4', 'webm']
  }
});
```

6. Add environment variables:
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Option B: AWS S3

1. Create AWS account at https://aws.amazon.com
2. Create S3 bucket
3. Get IAM credentials (Access Key ID and Secret Access Key)
4. Install AWS SDK:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Free Tier Limits

### MongoDB Atlas Free Tier
- 512 MB storage
- Shared cluster (resources shared with other users)
- Good for development and small production apps

### Render Free Tier
- 750 hours/month compute time
- Sleeps after 15 minutes of inactivity
- Good for development/small apps

### Cloudinary Free Tier
- 25 GB storage
- 25 GB bandwidth/month
- 25,000 transformations/month
- Sufficient for most churches

## Moving from Local to Cloud

1. Export local database:
```bash
mongodump --db dove-ministries --out ./backup
```

2. Import to MongoDB Atlas:
```bash
mongorestore --uri="your-mongodb-atlas-uri" ./backup/dove-ministries
```

3. Update environment variables on Render with new values

4. Test your deployed application

## Security Best Practices

1. **Never commit `.env` files to GitHub**
2. **Use strong, unique passwords**
3. **Enable MongoDB Atlas Network Security**
4. **Use HTTPS in production**
5. **Regularly rotate JWT secrets**
6. **Monitor usage and costs**

## Monitoring and Logs

- **Render Dashboard**: View logs, metrics, and restart services
- **MongoDB Atlas**: Monitor database performance and connections
- **Application Logs**: Check for errors in Render logs section

## Support Resources

- Render Documentation: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Cloudinary Documentation: https://cloudinary.com/documentation
