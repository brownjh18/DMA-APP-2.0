const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure multer for profile picture uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const profileUpload = multer({
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

// Passport Google OAuth configuration
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
        lastLogin: new Date(),
        notificationPreferences: {
          sermons: true,
          podcasts: true,
          liveBroadcasts: true,
          events: true,
          ministries: true,
          devotions: true,
          saved: true
        }
      });

      await newUser.save();
      return done(null, newUser);
    } catch (error) {
      return done(error, null);
    }
  }
));

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
        role: 'user',
        notificationPreferences: {
          sermons: true,
          podcasts: true,
          liveBroadcasts: true,
          events: true,
          ministries: true,
          devotions: true,
          saved: true
        }
      });
      await user.save();

      // Generate JWT token for automatic login
      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          phone: user.phone
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
    res.status(500).json({ error: 'Server error' });
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'user' } = req.body;

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
      notificationPreferences: {
        sermons: true,
        podcasts: true,
        liveBroadcasts: true,
        events: true,
        ministries: true,
        devotions: true,
        saved: true
      }
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
    res.status(500).json({ error: 'Server error' });
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Demo authentication - accept admin credentials
    if (email === 'admin@doveministriesafrica.org' && password === 'admin123') {
      // Generate JWT token
      const token = jwt.sign(
        {
          id: 'demo-admin-id',
          name: 'Admin User',
          email: email,
          role: 'admin',
          profilePicture: '/uploads/profile-demo-admin-id-1763714358980-580467867.jpg' // Default demo profile picture
        },
        process.env.JWT_SECRET,
        { expiresIn: '365d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: 'demo-admin-id',
          name: 'Admin User',
          email: email,
          role: 'admin',
          profilePicture: '/uploads/profile-demo-admin-id-1763714358980-580467867.jpg'
        }
      });
      return;
    }

    // For all other users, check against database
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

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          phone: user.phone
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // Return demo user data based on token
    const user = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      profilePicture: req.user.profilePicture
    };

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
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

    console.log('Profile update request:', {
      userId: req.user.id,
      isDemoUser: req.user.id.startsWith('demo-'),
      requestBody: req.body,
      currentUserName: req.user.name
    });

    // For demo users, return updated data with new token
    if (req.user.id.startsWith('demo-')) {
      const updatedUser = {
        id: req.user.id,
        name: req.body.name || req.user.name,
        email: req.user.email,
        role: req.user.role,
        phone: req.body.phone
      };

      console.log('Demo user update - using current user data:', updatedUser);

      // Generate new token with updated data
      const newToken = jwt.sign(updatedUser, process.env.JWT_SECRET, { expiresIn: '365d' });

      res.json({
        message: 'Profile updated successfully',
        token: newToken,
        user: updatedUser
      });
      return;
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;

    console.log('Database updates to apply:', updates);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Updated user from database:', user);

    const responseUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      phone: user.phone
    };

    console.log('Sending response:', responseUser);

    res.json({
      message: 'Profile updated successfully',
      user: responseUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
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

    const profilePictureUrl = `/uploads/${req.file.filename}`;

    // For demo users, return updated data with new token
    if (req.user.id.startsWith('demo-')) {
      const updatedUser = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        profilePicture: profilePictureUrl,
        phone: req.user.phone
      };

      // Generate new token with updated data
      const newToken = jwt.sign(updatedUser, process.env.JWT_SECRET, { expiresIn: '365d' });

      res.json({
        message: 'Profile picture uploaded successfully',
        token: newToken,
        user: updatedUser
      });
      return;
    }

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
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });

    // Include demo users if the current user is a demo user
    const allUsers = [...users];
    if (req.user.id.startsWith('demo-')) {
      // Add the current demo user to the list
      const demoUser = {
        _id: req.user.id,
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isActive: true, // Demo users are always active
        profilePicture: req.user.profilePicture,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      allUsers.unshift(demoUser); // Add to beginning of array
    }

    res.json({ users: allUsers });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Server error' });
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

    // Handle demo users (non-MongoDB ObjectId IDs)
    if (req.params.id.startsWith('demo-')) {
      // For demo users, return a mock response since they don't exist in the database
      const mockUser = {
        _id: req.params.id,
        id: req.params.id,
        name: req.params.id === 'demo-admin-id' ? 'Admin User' : 'Demo User',
        email: req.params.id === 'demo-admin-id' ? 'admin@doveministriesafrica.org' : 'demo@example.com',
        role: req.body.role || (req.params.id === 'demo-admin-id' ? 'admin' : 'user'),
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        profilePicture: req.params.id === 'demo-admin-id' ? '/uploads/profile-demo-admin-id-1763714358980-580467867.jpg' : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      res.json({
        message: 'User updated successfully',
        user: mockUser
      });
      return;
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
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('User delete error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

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
          profilePicture: req.user.profilePicture,
          phone: req.user.phone
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