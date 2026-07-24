const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { profileStorage: cloudProfileStorage, isConfigured: cloudIsConfigured } = require('../services/cloudStorage');

// Configure multer for profile picture uploads - use Cloudinary if available
let profileUpload;
if (cloudIsConfigured()) {
  profileUpload = multer({ storage: cloudProfileStorage });
} else {
  // Fallback to disk storage if Cloudinary is not configured
  const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '../uploads/profiles');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });
  profileUpload = multer({
    storage: profileStorage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit for profile pictures
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  });
}

// Passport Google OAuth configuration (only if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Google OAuth configured');
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.lastLogin = new Date();
          if (!user.profilePicture && profile.photos && profile.photos.length > 0) {
            user.profilePicture = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        const newUser = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null,
          role: 'user',
          isActive: true,
          lastLogin: new Date()
        });

        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
} else {
  console.log('⚠️  Google OAuth not configured (GOOGLE_CLIENT_ID/CLIENT_SECRET not set)');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

const router = express.Router();

// Public registration for new users
router.post('/signup', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured on the server');
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        phone,
        role: 'user'
      });
      await user.save();

      // Generate JWT token for automatic login
      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '365d' }
      );

      res.status(201).json({
        message: 'Account created successfully! You are now logged in.',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          phone: user.phone
        }
      });
    } catch (dbError) {
      console.error('Database error during registration:', dbError.message);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Register new user (admin only)
router.post('/register', [
  authenticateToken,
  requireAdmin,
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'moderator', 'user']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured on the server');
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'user', profilePicture } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      profilePicture
    });
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Debug route to test raw body
router.post('/debug', (req, res) => {
  console.log('Debug route hit');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Raw body:', req.rawBody);
  res.json({ received: req.body, headers: req.headers });
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required')
], async (req, res) => {
  try {
    // Check if JWT_SECRET is configured
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured on the server');
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // For all users, check against database
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Account not found. Please sign up to create an account.' });
      }

      // Check password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ error: 'Account is deactivated' });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '365d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          phone: user.phone
        }
      });
    } catch (dbError) {
      // Database connection error - for demo purposes, treat as account not found
      console.error('Database error during login:', dbError.message);
      return res.status(401).json({ error: 'Account not found. Please sign up to create an account.' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data based on token
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profilePicture: user.profilePicture
    };

    res.json({ user: userData });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.profilePicture) updates.profilePicture = req.body.profilePicture;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      phone: user.phone
    };

    res.json({
      message: 'Profile updated successfully',
      user: responseUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Upload profile picture
router.post('/upload-profile-picture', [
  authenticateToken,
  profileUpload.single('profilePicture')
], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Profile picture file is required' });
    }

    // Get the profile picture URL - Cloudinary returns URL in req.file.path, disk storage in req.file.filename
    const profilePictureUrl = req.file.path || `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePictureUrl },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Change password
router.put('/change-password', authenticateToken, [
  body('currentPassword').exists().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update user role/status (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, [
  body('role').optional().isIn(['admin', 'moderator', 'user']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = {};
    if (req.body.role) updates.role = req.body.role;
    if (req.body.isActive !== undefined) updates.isActive = req.body.isActive;

    // Get the target user to check if it's the protected admin
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Protect the default admin account from being demoted
    const protectedAdminEmail = 'brownjh18@gmail.com';
    if (targetUser.email === protectedAdminEmail) {
      // Check if trying to change role away from admin
      if (req.body.role && req.body.role !== 'admin') {
        return res.status(403).json({ error: 'Cannot change role of the default admin account' });
      }
      // Check if trying to deactivate the admin
      if (req.body.isActive === false) {
        return res.status(403).json({ error: 'Cannot deactivate the default admin account' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('User update error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Protect the default admin account from being deleted
    const protectedAdminEmail = 'brownjh18@gmail.com';
    if (user.email === protectedAdminEmail) {
      return res.status(403).json({ error: 'Cannot delete the default admin account' });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User delete error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// ── Watch History ─────────────────────────────────────────────────────────────

// GET /api/auth/watch-history
router.get('/watch-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('watchHistory')
      .populate('watchHistory.sermonId', 'title speaker thumbnailUrl');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const history = [...(user.watchHistory || [])].sort(
      (a, b) => new Date(b.watchedAt) - new Date(a.watchedAt)
    );
    res.json({ watchHistory: history });
  } catch (error) {
    console.error('Watch history fetch error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/auth/watch-history  – add or update an entry
router.post('/watch-history', authenticateToken, [
  body('sermonId').optional().isMongoId().withMessage('Invalid sermon ID'),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('speaker').optional().trim(),
  body('duration').optional().trim(),
  body('watchedDuration').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { sermonId, title, speaker, duration, watchedDuration } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (sermonId) {
      const existing = user.watchHistory.find(
        (h) => h.sermonId && h.sermonId.toString() === sermonId
      );
      if (existing) {
        if (watchedDuration) existing.watchedDuration = watchedDuration;
        existing.watchedAt = new Date();
      } else {
        user.watchHistory.push({ sermonId, title, speaker, duration, watchedDuration });
      }
    } else {
      user.watchHistory.push({ title, speaker, duration, watchedDuration });
    }

    await user.save();
    res.json({ message: 'Watch history updated', watchHistory: user.watchHistory });
  } catch (error) {
    console.error('Watch history update error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// DELETE /api/auth/watch-history/:entryId  – remove one entry
router.delete('/watch-history/:entryId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = user.watchHistory.length;
    user.watchHistory = user.watchHistory.filter(
      (h) => h._id.toString() !== req.params.entryId
    );
    if (user.watchHistory.length === before) {
      return res.status(404).json({ error: 'Watch history entry not found' });
    }

    await user.save();
    res.json({ message: 'Entry removed from watch history' });
  } catch (error) {
    console.error('Watch history delete error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// DELETE /api/auth/watch-history  – clear all watch history
router.delete('/watch-history', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $set: { watchHistory: [] } });
    res.json({ message: 'Watch history cleared' });
  } catch (error) {
    console.error('Watch history clear error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// ── Reading History ────────────────────────────────────────────────────────────

// GET /api/auth/reading-history
router.get('/reading-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('readingHistory')
      .populate('readingHistory.devotionId', 'title scripture thumbnailUrl');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const history = [...(user.readingHistory || [])].sort(
      (a, b) => new Date(b.readAt) - new Date(a.readAt)
    );
    res.json({ readingHistory: history });
  } catch (error) {
    console.error('Reading history fetch error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// POST /api/auth/reading-history  – add or update an entry
router.post('/reading-history', authenticateToken, [
  body('devotionId').optional().isMongoId().withMessage('Invalid devotion ID'),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('scripture').optional().trim(),
  body('readTime').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { devotionId, title, scripture, readTime } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (devotionId) {
      const existing = user.readingHistory.find(
        (h) => h.devotionId && h.devotionId.toString() === devotionId
      );
      if (existing) {
        existing.readAt = new Date();
      } else {
        user.readingHistory.push({ devotionId, title, scripture, readTime });
      }
    } else {
      user.readingHistory.push({ title, scripture, readTime });
    }

    await user.save();
    res.json({ message: 'Reading history updated', readingHistory: user.readingHistory });
  } catch (error) {
    console.error('Reading history update error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// DELETE /api/auth/reading-history/:entryId  – remove one entry
router.delete('/reading-history/:entryId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const before = user.readingHistory.length;
    user.readingHistory = user.readingHistory.filter(
      (h) => h._id.toString() !== req.params.entryId
    );
    if (user.readingHistory.length === before) {
      return res.status(404).json({ error: 'Reading history entry not found' });
    }

    await user.save();
    res.json({ message: 'Entry removed from reading history' });
  } catch (error) {
    console.error('Reading history delete error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// DELETE /api/auth/reading-history  – clear all reading history
router.delete('/reading-history', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $set: { readingHistory: [] } });
    res.json({ message: 'Reading history cleared' });
  } catch (error) {
    console.error('Reading history clear error:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Google OAuth routes - only if configured
router.get('/google', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(400).json({ error: 'Google OAuth is not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  async (req, res) => {
    try {
      // Generate JWT token for the authenticated user
      const token = jwt.sign(
        {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '365d' }
      );

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePicture: req.user.profilePicture,
        phone: req.user.phone
      }))}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/signin?error=auth_failed');
    }
  }
);

module.exports = router;
