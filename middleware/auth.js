const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('No token provided in request');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    console.log('Token verified successfully, user:', user);
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  console.log('requireAdmin middleware - user:', req.user);
  if (!req.user || !req.user.role) {
    console.log('No user or role found');
    return res.status(403).json({ error: 'Admin role required. Your account may not have admin privileges.' });
  }
  if (req.user.role !== 'admin') {
    console.log('User role is not admin:', req.user.role);
    return res.status(403).json({ error: 'Admin access required. Your current role is: ' + req.user.role });
  }
  console.log('Admin access granted');
  next();
};

// Middleware to check if user is moderator or admin
const requireModerator = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
    return res.status(403).json({ error: 'Moderator or admin access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireModerator
};