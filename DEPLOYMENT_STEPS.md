# Step-by-Step Cloud Deployment Guide

## Step 1: Create MongoDB Atlas Account (Database)

### 1.1 Sign Up
1. Go to https://www.mongodb.com/atlas
2. Click **"Try Free"** or **"Sign Up"**
3. Sign up with Google Account or email
4. Verify your email address

### 1.2 Create Cluster
1. After login, click **"Create a Cluster"**
2. Choose **"M0"** (Free tier) - Shared RAM, no credit card required
3. Select your preferred cloud provider:
   - **Google Cloud** (recommended for Africa/Kampala) - lowest latency
   - Or AWS/Azure
4. Choose the region closest to you (e.g., `eu-west-1` Ireland or `us-east-1`)
5. Click **"Create Cluster"** (takes 1-3 minutes)

### 1.3 Create Database User
1. Click **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Create user:
   - **Username**: `dove_admin`
   - **Password**: Click "Autogenerate secure password" - SAVE THIS!
   - **Database User Privileges**: "Atlas admin"
4. Click **"Add User"**

### 1.4 Configure Network Access
1. Click **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Click **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Click **"Drivers"**
4. Copy the connection string:
   ```
   mongodb+srv://dove_admin:<password>@cluster0.xxxxx.mongodb.net/dove-ministries?retryWrites=true&w=majority
   ```
5. Replace `<password>` with the password you saved earlier

---

## Step 2: Create Cloudinary Account (File Storage)

### 2.1 Sign Up
1. Go to https://cloudinary.com
2. Click **"Sign Up Free"**
3. Sign up with Google Account or email
4. Verify your email address

### 2.2 Get Your Credentials
1. After login, you'll see your **Cloud Name** at the top
2. Click the **Settings icon** (gear) → **"Account Details"**
3. Scroll down to **"API Credentials"**
4. Copy:
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz` - SAVE THIS!

---

## Step 3: Deploy Backend to Render

### 3.1 Push Code to GitHub
1. Go to https://github.com
2. Create a new repository (e.g., `dove-ministries-backend`)
3. Push your backend code:
   ```bash
   cd backend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/dove-ministries-backend.git
   git push -u origin main
   ```

### 3.2 Create Render Account
1. Go to https://render.com
2. Click **"Sign Up"**
3. Sign up with GitHub (easiest)
4. Authorize Render to access your GitHub

### 3.3 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Find and connect your `dove-ministries-backend` repository
3. Configure:
   - **Name**: `dove-ministries-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: **Free** (no credit card required)

### 3.4 Add Environment Variables
Scroll down to **"Environment Variables"** and add these:

```
# Required
MONGODB_URI=mongodb+srv://dove_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/dove-ministries?retryWrites=true&w=majority
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-here
CORS_ORIGIN=*

# Optional (for production)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important**: Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.5 Deploy
1. Click **"Create Web Service"**
2. Wait 2-5 minutes for build
3. Check logs for errors
4. Your backend will be live at:
   ```
   https://dove-ministries-backend.onrender.com
   ```

---

## Step 4: Connect Frontend to Backend

### 4.1 Create Frontend .env File
1. In your DMA frontend directory, create a file named `.env`
2. Add:
   ```
   VITE_API_URL=https://dove-ministries-backend.onrender.com/api
   ```

### 4.2 Deploy Frontend (Optional - Render or Vercel)

**Option A: Deploy to Render (Same as backend)**
1. Create new web service in Render
2. Connect your frontend repository
3. Build command: `npm install && npm run build`
4. Start command: `npm run preview`
5. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

**Option B: Deploy to Vercel (Faster)**
1. Go to https://vercel.com
2. Import your GitHub repository
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy

---

## Step 5: Test Your Deployment

### 5.1 Health Check
Visit: `https://your-backend.onrender.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 5.2 Test API in Browser
Visit: `https://your-backend.onrender.com/api/sermons`

Expected response:
```json
{
  "sermons": [],
  "pagination": { ... }
}
```

---

## Step 6: Migrate Existing Data (Optional)

If you have data in your local MongoDB:

### 6.1 Export Local Data
```bash
mongodump --db dove-ministries --out ./backup
```

### 6.2 Import to MongoDB Atlas
```bash
mongorestore --uri="mongodb+srv://dove_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/dove-ministries" ./backup/dove-ministries
```

---

## Troubleshooting

### Error: "MongoDB connection failed"
- Check your IP address is allowed in MongoDB Atlas Network Access
- Verify the connection string is correct
- Ensure password doesn't contain special characters (or URL-encode them)

### Error: "CORS policy"
- Add your frontend domain to `CORS_ORIGIN` environment variable
- Use `*` for testing (not recommended for production)

### Error: "Cloudinary not configured"
- Add Cloudinary credentials to Render environment variables
- Restart the service

### App is slow / sleeping
- Render free tier puts apps to sleep after 15 minutes of inactivity
- First request after sleep may take 30-60 seconds
- Consider upgrading to paid plan for production

---

## Cost Summary

| Service | Free Tier | Cost After Free |
|---------|-----------|-----------------|
| MongoDB Atlas | 512 MB storage | $0.08/GB/month |
| Render | 750 hours compute | $7/month |
| Cloudinary | 25 GB storage/bandwidth | Pay-as-you-go |

**Total: $0/month for small churches** ✅
