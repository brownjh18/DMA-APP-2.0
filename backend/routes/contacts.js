const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get contact info (public)
router.get('/', async (req, res) => {
  try {
    const contact = await Contact.findOne({ isPublished: true }).sort({ createdAt: -1 });
    if (!contact) {
      return res.status(404).json({ message: 'Contact information not found' });
    }
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all contact info (admin only)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const contacts = await Contact.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments();

    res.json({
      contacts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalContacts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create contact info (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { churchName, address, phone, email, serviceTimes, about, mission, founders, isPublished } = req.body;

    // Check if contact info already exists
    const existingContact = await Contact.findOne();
    if (existingContact) {
      return res.status(400).json({ message: 'Contact information already exists. Use PUT to update.' });
    }

    const contactData = {
      churchName: churchName || 'Dove Ministries Africa',
      address: address || '123 Faith Street, Kampala, Uganda',
      phone: phone || '+256 123 456 789',
      email: email || 'info@doveministriesafrica.org',
      serviceTimes: serviceTimes || 'Sundays: 8:00 AM & 10:30 AM\nWednesdays: 7:00 PM',
      about: about || 'Dove Ministries Africa is a vibrant church community dedicated to spreading God\'s love and serving our community through worship, fellowship, and outreach programs.',
      mission: mission || 'To bring hope, healing, and transformation to lives through the power of God\'s love.',
      founders: founders || [
        {
          name: 'Pastor Daniel Kaggwa',
          title: 'Co-Founder & Senior Pastor',
          imageUrl: '/pastor.jpg'
        },
        {
          name: 'Erica Kaggwa',
          title: 'Co-Founder & Ministry Leader',
          imageUrl: '/mommy-erica.jpg'
        }
      ],
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user.id.startsWith('demo-') ? '507f1f77bcf86cd799439011' : req.user.id
    };

    const contact = new Contact(contactData);
    await contact.save();

    res.status(201).json({
      message: 'Contact information created successfully',
      contact
    });
  } catch (error) {
    console.error('Error creating contact info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contact info (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { churchName, address, phone, email, serviceTimes, about, mission, founders, isPublished } = req.body;

    const updateData = {};
    if (churchName !== undefined) updateData.churchName = churchName;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (serviceTimes !== undefined) updateData.serviceTimes = serviceTimes;
    if (about !== undefined) updateData.about = about;
    if (mission !== undefined) updateData.mission = mission;
    if (founders !== undefined) updateData.founders = founders;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact information not found' });
    }

    res.json({
      message: 'Contact information updated successfully',
      contact
    });
  } catch (error) {
    console.error('Error updating contact info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete contact info (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact information not found' });
    }

    res.json({ message: 'Contact information deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact info:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;