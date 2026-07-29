FROM node:20-alpine

WORKDIR /app

# Copy everything first
COPY . .

# Install backend dependencies
RUN npm ci --omit=dev

# Install frontend dependencies and build
RUN cd DMA && npm ci --legacy-peer-deps && npm run build

EXPOSE 10000

CMD ["node", "--max-http-header-size=65536", "server.js"]
