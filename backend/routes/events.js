const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { authenticateToken, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      upcoming,
      published = true
    } = req.query;

    const query = { isPublished: published };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) {
      query.category = category;
    }
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort({ date: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(query);

    res.json({
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get upcoming events
router.get('/upcoming', async (req, res) => {
  try {
    const events = await Event.find({
      isPublished: true,
      date: { $gte: new Date() }
    })
      .populate('createdBy', 'name')
      .sort({ date: 1 })
      .limit(10);

    res.json({ events });
  } catch (error) {
    console.error('Upcoming events fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create event (moderator+)
router.post('/', [
  authenticateToken,
  requireModerator,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('time').optional().trim(),
  body('endDate').optional().isISO8601().withMessage('Valid end date required'),
  body('category').optional().isIn(['conference', 'service', 'workshop', 'youth', 'children', 'evangelism', 'intercessions', 'worship', 'community', 'other']),
  body('speaker').optional().trim(),
  body('imageUrl').optional().isURL().withMessage('Valid image URL required'),
  body('maxAttendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be positive'),
  body('contactEmail').optional().isEmail().withMessage('Valid contact email required'),
  body('contactPhone').optional().trim(),
  body('registrationRequired').optional().isBoolean(),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean(),
  body('tags').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const eventData = {
      ...req.body,
      createdBy: req.user.id
    };

    const event = new Event(eventData);
    await event.save();

    await event.populate('createdBy', 'name');

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update event (moderator+)
router.put('/:id', [
  authenticateToken,
  requireModerator,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
  body('imageUrl').optional().isURL().withMessage('Valid image URL required'),
  body('maxAttendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be positive'),
  body('contactEmail').optional().isEmail().withMessage('Valid contact email required'),
  body('isPublished').optional().isBoolean(),
  body('isFeatured').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event (moderator+)
router.delete('/:id', authenticateToken, requireModerator, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register for event (public)
router.post('/:id/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.registrationRequired) {
      return res.status(400).json({ error: 'Registration not required for this event' });
    }

    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is fully booked' });
    }

    event.currentAttendees += 1;
    await event.save();

    res.json({
      message: 'Successfully registered for event',
      event: {
        title: event.title,
        date: event.date,
        location: event.location
      }
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;