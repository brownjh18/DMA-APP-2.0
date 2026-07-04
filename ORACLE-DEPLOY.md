# WebSocket Server (Oracle Cloud Always Free)

## Architecture

The realtime WebSocket server runs separately on Oracle Cloud Always Free to provide persistent WebSocket connections that Vercel cannot support.

```
Frontend (Vercel) → API Backend (Vercel)
                    ↓
                    DB (MongoDB Atlas)
                    ↓
Realtime Server (Oracle Cloud) ← Change Streams
```

## Setup Instructions for Oracle Cloud

### 1. Create Oracle Cloud VM
- Sign up at https://cloud.oracle.com
- Create an Always Free VM (AMD or ARM)
- Open port 4000 in the security list (Networking → Virtual Cloud Network → Security Lists)

### 2. SSH and Install Dependencies
```bash
ssh ubuntu@<your-public-ip>
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. Deploy
```bash
# Copy these files to your VM
scp websocket-server.js ubuntu@<ip>:/app/
scp websocket-package.json ubuntu@<ip>:/app/package.json
scp .env ubuntu@<ip>:/app/.env

# On the VM
cd /app
npm install
npm start  # or use pm2 for production
```

### 4. Environment Variables
Create `.env` on the VM:
```
MONGODB_URI=mongodb+srv://dove_admin:kQt3f0wk2abekE5x@cluster1.xxt8zzi.mongodb.net/?appName=Cluster1
WEBSOCKET_PORT=4000
CORS_ORIGIN=*
```

### 5. Reverse Proxy (Optional)
For production, use nginx with SSL:
```nginx
server {
    listen 443 ssl;
    server_name ws.dovechurchapp.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 6. PM2 Process Manager (Recommended)
```bash
sudo npm install -g pm2
pm2 start websocket-server.js --name ws-server
pm2 save
pm2 startup
```

## Frontend Configuration

The frontend connects to the WebSocket server via `VITE_SOCKET_URL` environment variable:
- `.env` (development)
- `vercel.json` (production)

If `VITE_SOCKET_URL` is not set or connection fails, the frontend falls back to:
1. Polling-based notifications (every 60 seconds)
2. Local notification storage

## How It Works

1. **Change Streams**: MongoDB change streams emit events on every insert/update/delete
2. **WebSocket Broadcasting**: The WS server receives change stream events and broadcasts via Socket.IO
3. **Frontend Listening**: The React app receives socket events and creates notifications

This separation allows:
- Vercel to handle API routes efficiently
- Oracle VM to maintain persistent WebSocket connections
- Both to share the same MongoDB database