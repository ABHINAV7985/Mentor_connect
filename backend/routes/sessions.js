// =============================================
//  Drona-a-charya | Sessions Route (with email)
//  backend/routes/sessions.js  ← REPLACE this file
// =============================================

const express  = require('express');
const Session  = require('../models/Session');
const User     = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  sendSessionRequestToMentor,
  sendSessionConfirmationToStudent,
  sendSessionStatusUpdate,
} = require('../utils/email');

const router = express.Router();


// ─────────────────────────────────────────────
//  POST /api/sessions  — student books a session
// ─────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { mentorId, slot, message } = req.body;
    if (!mentorId)
      return res.status(400).json({ success: false, message: 'mentorId is required.' });

    // fetch mentor details for email
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'mentor')
      return res.status(404).json({ success: false, message: 'Mentor not found.' });

    // save session to MongoDB
    const session = await Session.create({
      mentor:       mentorId,
      student:      req.user._id,
      studentEmail: req.user.email,
      slot:         slot    || 'TBD',
      message:      message || '',
    });

    // ── fire emails (non-blocking — don't await so response is instant) ──
    const student = req.user;

    sendSessionRequestToMentor({ mentor, student, session })
      .then(() => console.log(`Email sent to mentor: ${mentor.email}`))
      .catch(err => console.error('Mentor email failed:', err.message));

    sendSessionConfirmationToStudent({ mentor, student, session })
      .then(() => console.log(`Confirmation sent to student: ${student.email}`))
      .catch(err => console.error('Student email failed:', err.message));

    const populated = await session.populate('mentor', 'name designation institution');
    res.status(201).json({
      success: true,
      message: `Session request sent! Emails dispatched to ${mentor.email} and ${student.email}.`,
      data: populated,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ─────────────────────────────────────────────
//  GET /api/sessions/my  — get current user's sessions
// ─────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'mentor'
      ? { mentor: req.user._id }
      : { student: req.user._id };

    const sessions = await Session.find(filter)
      .populate('mentor',  'name designation institution email')
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ─────────────────────────────────────────────
//  PATCH /api/sessions/:id  — mentor updates status
//  Sends email to student on confirmed / cancelled
// ─────────────────────────────────────────────
router.patch('/:id', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowed.join(', ')}` });

    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('mentor',  'name designation institution email')
     .populate('student', 'name email');

    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found.' });

    // send email when mentor confirms or cancels
    if (['confirmed', 'cancelled', 'completed'].includes(status)) {
      sendSessionStatusUpdate({
        mentor:  session.mentor,
        student: session.student,
        session,
      })
        .then(() => console.log(`Status update email sent to: ${session.student.email}`))
        .catch(err => console.error('Status email failed:', err.message));
    }

    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;