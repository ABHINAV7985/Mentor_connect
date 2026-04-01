const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const router  = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, institution, designation, expertise, bio, experience } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ success: false, message: 'name, email, password and role are required.' });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({
      name, email, password, role,
      institution: institution || '',
      designation: designation || '',
      expertise:   Array.isArray(expertise) ? expertise : (expertise ? expertise.split(',').map(s => s.trim()) : []),
      bio:         bio         || '',
      experience:  experience  || '',
      available:   true,
      sessions:    0,
      rating:      0,
      projects:    0
    });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        institution: user.institution,
        designation: user.designation,
        expertise:   user.expertise,
        bio:         user.bio,
        available:   user.available
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id:          user._id,
        name:        user.name,
        email:       user.email,
        role:        user.role,
        institution: user.institution,
        designation: user.designation,
        expertise:   user.expertise,
        bio:         user.bio,
        available:   user.available
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
