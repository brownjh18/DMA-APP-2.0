#!/bin/bash
# DMA Church App - Oracle Cloud Deployment Script
# Run this on your Ubuntu VM after SSH access

set -e

echo "🚀 Starting DMA Church App deployment..."

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Clone the app
echo "📥 Cloning DMA Church App..."
cd /home/ubuntu
git clone https://github.com/brownjh18/DMA-APP-2.0.git
cd DMA-APP-2.0

# Install dependencies
echo "📦 Installing backend dependencies..."
npm ci --omit=dev

echo "📦 Installing frontend dependencies and building..."
cd DMA && npm ci && npm run build && cd ..

# Create environment file
echo "🔧 Creating environment file..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://dove_admin:kQt3f0wk2abekE5x@cluster1.xxt8zzi.mongodb.net/?appName=Cluster1
JWT_SECRET=bcadd09f9a63199da614ffc0e50aea4d3ebf94431e338b2fdad3b16a4d1410b0
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
CLOUDINARY_CLOUD_NAME=durchmyhd
CLOUDINARY_API_KEY=385354589753143
CLOUDINARY_API_SECRET=F8THR1gRfU7AHKXX77c8MHzHG1c
EOF

# Start app with PM2
echo "🚀 Starting app with PM2..."
pm2 start server.js --name "dove-church"
pm2 save
pm2 startup

# Configure Nginx
echo "🔧 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/dove-church > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/dove-church /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app is running at: http://$(curl -s ifconfig.me)"
echo ""
echo "To check status: pm2 status"
echo "To view logs: pm2 logs dove-church"
echo "To restart: pm2 restart dove-church"
echo ""
echo "Next steps:"
echo "1. Point your domain to this server's IP"
echo "2. Install Certbot for SSL: sudo apt install certbot python3-certbot-nginx"
echo "3. Run: sudo certbot --nginx -d yourdomain.com"
