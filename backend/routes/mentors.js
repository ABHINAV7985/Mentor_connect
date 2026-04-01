const express  = require('express');
const User     = require('../models/User');
const { protect } = require('../middleware/auth');
const router   = express.Router();

// GET /api/mentors  — protected, returns all mentor users from MongoDB
router.get('/', protect, async (req, res) => {
  try {
    const query = { role: 'mentor' };
    if (req.query.tag)       query.expertise = { $in: [req.query.tag] };
    if (req.query.available) query.available = req.query.available === 'true';

    const mentors = await User.find(query).select('-password');
    res.json({ success: true, count: mentors.length, data: mentors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/mentors/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' }).select('-password');
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found.' });
    res.json({ success: true, data: mentor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
