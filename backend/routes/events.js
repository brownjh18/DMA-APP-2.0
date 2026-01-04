const express = require('express');
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

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
      published
    } = req.query;

    const query = {};
    if (published !== 'all') {
      query.isPublished = published === 'true' || published === undefined ? true : false;
    }

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
  requireAdmin,
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('date').isISO8601().withMessage('Valid date required'),
  body('location').trim().isLength({ min: 1 }).withMessage('Location is required'),
  body('time').optional().trim(),
  body('endDate').optional().isISO8601().withMessage('Valid end date required'),
  body('category').optional().isIn(['conference', 'service', 'workshop', 'youth', 'children', 'evangelism', 'intercessions', 'worship', 'community', 'other']),
  body('speaker').optional().trim(),
  body('imageUrl').optional().custom((value) => {
    if (!value) return true; // Allow empty
    if (value.startsWith('/uploads/')) return true; // Allow relative URLs
    // For full URLs, validate format
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(value)) {
      throw new Error('Valid image URL required');
    }
    return true;
  }),
  body('maxAttendees').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true; // Allow null, undefined, or empty
    if (typeof value === 'number' && value >= 1) return true; // Allow positive integers
    if (typeof value === 'string' && value.trim() === '') return true; // Allow empty strings
    throw new Error('Max attendees must be a positive number or empty');
  }),
  body('contactEmail').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Valid contact email required');
    }
    return true;
  }),
  body('contactPhone').optional().trim(),
  body('registrationRequired').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'boolean') return true;
    throw new Error('registrationRequired must be a boolean');
  }),
  body('isPublished').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'boolean') return true;
    throw new Error('isPublished must be a boolean');
  }),
  body('isFeatured').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'boolean') return true;
    throw new Error('isFeatured must be a boolean');
  }),
  body('tags').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value)) return true;
    throw new Error('tags must be an array');
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Event update validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const eventData = {
      ...req.body,
      createdBy: req.user.id.startsWith('demo-') ? '507f1f77bcf86cd799439011' : req.user.id
    };

    const event = new Event(eventData);
    await event.save();

    await event.populate('createdBy', 'name');

    // Create notifications for all users about the new event
    try {
      await notificationService.createContentNotification(
        'event',
        event._id,
        `New Event: ${event.title}`,
        `Join us for "${event.title}" on ${new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${event.location}.`,
        {
          url: `/event/${event._id}`,
          date: event.date,
          location: event.location,
          time: event.time
        }
      );
    } catch (notificationError) {
      console.error('Error creating event notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

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
  requireAdmin,
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('description').optional().trim().isLength({ min: 1 }).withMessage('Description cannot be empty'),
  body('date').optional().custom((value) => {
    if (!value || value.trim() === '') {
      throw new Error('Valid date required');
    }
    // Validate as YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      throw new Error('Valid date required (YYYY-MM-DD)');
    }
    return true;
  }),
  body('time').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true; // Allow null, undefined, or empty
    if (typeof value === 'string' && value.trim().length > 0) return true; // Allow non-empty strings
    throw new Error('Time must be a valid string or empty');
  }),
  body('endDate').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true; // Allow null, undefined, or empty
    // For non-empty values, validate as ISO8601 date
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      throw new Error('Valid end date required (YYYY-MM-DD)');
    }
    return true;
  }),
  body('location').optional().trim().isLength({ min: 1 }).withMessage('Location cannot be empty'),
  body('speaker').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true; // Allow null, undefined, or empty
    if (typeof value === 'string' && value.trim().length > 0) return true; // Allow non-empty strings
    throw new Error('Speaker must be a valid string or empty');
  }),
  body('contactPhone').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true; // Allow null, undefined, or empty
    if (typeof value === 'string' && value.trim().length > 0) return true; // Allow non-empty strings
    throw new Error('Contact phone must be a valid string or empty');
  }),
  body('imageUrl').optional().custom((value) => {
    if (!value) return true; // Allow empty
    if (value.startsWith('/uploads/')) return true; // Allow relative URLs
    // For full URLs, validate format
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(value)) {
      throw new Error('Valid image URL required');
    }
    return true;
  }),
  body('maxAttendees').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true; // Allow null, undefined, or empty
    if (typeof value === 'number' && value >= 1) return true; // Allow positive integers
    if (typeof value === 'string' && value.trim() === '') return true; // Allow empty strings
    throw new Error('Max attendees must be a positive number or empty');
  }),
  body('contactEmail').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Valid contact email required');
    }
    return true;
  }),
  body('isPublished').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'boolean') return true;
    throw new Error('isPublished must be a boolean');
  }),
  body('isFeatured').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'boolean') return true;
    throw new Error('isFeatured must be a boolean');
  }),
  body('registrationRequired').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'boolean') return true;
    throw new Error('registrationRequired must be a boolean');
  }),
  body('tags').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (Array.isArray(value)) return true;
    throw new Error('tags must be an array');
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Event update validation errors:', errors.array());
      console.log('Request body that caused errors:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Updating event', req.params.id, 'with data:', req.body);

    // Get the old event to check if it was just published
    const oldEvent = await Event.findById(req.params.id);

    // Convert date strings to Date objects
    const updateData = { ...req.body };
    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');
    console.log('Updated event result:', event);

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

// Delete event (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
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