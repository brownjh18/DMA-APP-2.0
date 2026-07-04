const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.WEBSOCKET_PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 
  'mongodb+srv://dove_admin:kQt3f0wk2abekE5x@cluster1.xxt8zzi.mongodb.net/?appName=Cluster1';

const allowedOrigins = [
  'https://dovechurchapp.vercel.app',
  'https://dove-church-frontend.vercel.app',
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:3000',
  'capacitor://localhost',
  'ionic://localhost'
];

const server = http.createServer();

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === '*') {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ WebSocket server connected to MongoDB');
    setupChangeStreams();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    setTimeout(connectDB, 5000);
  }
}

function setupChangeStreams() {
  const Sermon = require('./models/Sermon');
  const Devotion = require('./models/Devotion');
  const Event = require('./models/Event');
  const Ministry = require('./models/Ministry');

  Sermon.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    console.log(`📡 Change detected for Sermon: ${change.operationType}`);
    const doc = change.fullDocument || {};
    
    // Separate events by type field (sermon vs podcast)
    if (change.operationType === 'insert') {
      if (doc.type === 'podcast') {
        io.emit('podcast:created', { podcast: doc });
      } else {
        io.emit('sermon:created', { sermon: doc });
      }
    } else if (change.operationType === 'update' || change.operationType === 'replace') {
      if (doc.type === 'podcast') {
        io.emit('podcast:updated', { podcast: doc });
      } else {
        io.emit('sermon:updated', { sermon: doc });
      }
    } else if (change.operationType === 'delete') {
      // For deletes, check if we can determine type from cached state or skip
      io.emit('sermon:deleted', { id: change.documentKey._id });
    }
  });

  Devotion.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    console.log(`📡 Change detected for Devotion: ${change.operationType}`);
    if (change.operationType === 'insert') {
      io.emit('devotion:created', { devotion: change.fullDocument });
    } else if (change.operationType === 'update' || change.operationType === 'replace') {
      io.emit('devotion:updated', { devotion: change.fullDocument });
    } else if (change.operationType === 'delete') {
      io.emit('devotion:deleted', { id: change.documentKey._id });
    }
  });

  Event.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    console.log(`📡 Change detected for Event: ${change.operationType}`);
    if (change.operationType === 'insert') {
      io.emit('event:created', { event: change.fullDocument });
    } else if (change.operationType === 'update' || change.operationType === 'replace') {
      io.emit('event:updated', { event: change.fullDocument });
    } else if (change.operationType === 'delete') {
      io.emit('event:deleted', { id: change.documentKey._id });
    }
  });

  Ministry.watch([], { fullDocument: 'updateLookup' }).on('change', (change) => {
    console.log(`📡 Change detected for Ministry: ${change.operationType}`);
    if (change.operationType === 'insert') {
      io.emit('ministry:created', { ministry: change.fullDocument });
    } else if (change.operationType === 'update' || change.operationType === 'replace') {
      io.emit('ministry:updated', { ministry: change.fullDocument });
    } else if (change.operationType === 'delete') {
      io.emit('ministry:deleted', { id: change.documentKey._id });
    }
  });

  console.log('📡 Change streams set up for real-time notifications');
}

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Client disconnected:', socket.id, reason);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
  console.log(`🔌 Socket.io enabled for real-time updates`);
});

connectDB();

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  mongoose.connection.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { io, server };