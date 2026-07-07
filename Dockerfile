FROM node:20-alpine

WORKDIR /app

# Copy everything first
COPY . .

# Install backend dependencies
RUN npm ci --omit=dev

# Install frontend dependencies and build
RUN cd DMA && npm ci && npm run build

ENV CLOUDINARY_CLOUD_NAME=durchmyhd
ENV CLOUDINARY_API_KEY=385354589753143
ENV CLOUDINARY_API_SECRET=F8THR1gRfU7AHKXX77c8MHzHG1c

EXPOSE 8080

CMD ["node", "--max-http-header-size=65536", "server.js"]
