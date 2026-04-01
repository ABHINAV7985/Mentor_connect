// =============================================
//  Drona-a-charya | Email Utility (Nodemailer)
//  backend/utils/email.js
// =============================================

const nodemailer = require('nodemailer');

// ── create transporter (Gmail SMTP) ──
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,   // App Password from Google (not your login password)
  },
});

// ── verify connection on startup ──
transporter.verify((err, success) => {
  if (err) console.warn('Email transporter warning:', err.message);
  else     console.log('Email service ready:', process.env.EMAIL_USER);
});


// ─────────────────────────────────────────────
//  TEMPLATE HELPERS
// ─────────────────────────────────────────────
const BASE_STYLES = `
  body { margin:0; padding:0; background:#F1EFE8; font-family:'Segoe UI',Arial,sans-serif; }
  .wrapper { max-width:560px; margin:32px auto; background:#ffffff; border-radius:16px; overflow:hidden; }
  .header  { background:#04342C; padding:28px 32px 24px; }
  .logo    { font-size:20px; font-weight:700; color:#ffffff; letter-spacing:-0.3px; }
  .badge   { display:inline-block; background:#1D9E75; color:#fff; font-size:11px;
             font-weight:600; padding:3px 10px; border-radius:20px; margin-top:6px; }
  .body    { padding:28px 32px; }
  .title   { font-size:20px; font-weight:700; color:#1a1a1a; margin:0 0 8px; }
  .sub     { font-size:14px; color:#6b7280; margin:0 0 24px; line-height:1.6; }
  .info-box{ background:#F1EFE8; border-radius:10px; padding:16px 20px; margin-bottom:20px; }
  .row     { display:flex; justify-content:space-between; padding:6px 0;
             border-bottom:1px solid #E5E3DB; font-size:13px; }
  .row:last-child { border-bottom:none; }
  .lbl     { color:#888780; }
  .val     { color:#1a1a1a; font-weight:500; }
  .btn     { display:inline-block; background:#1D9E75; color:#ffffff !important;
             font-size:14px; font-weight:600; padding:13px 28px; border-radius:10px;
             text-decoration:none; margin:4px 0 20px; }
  .msg-box { background:#E6F1FB; border-left:3px solid #378ADD; border-radius:0 8px 8px 0;
             padding:12px 16px; margin-bottom:20px; font-size:13px; color:#0C447C; line-height:1.6; }
  .footer  { background:#F8F7F4; padding:18px 32px; font-size:11px; color:#9ca3af; text-align:center; }
  .status-pending   { background:#FAEEDA; color:#633806; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
  .status-confirmed { background:#E1F5EE; color:#085041; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
  .status-cancelled { background:#FCEBEB; color:#791F1F; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600; }
`;

function wrap(content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <style>${BASE_STYLES}</style></head><body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Drona-a-charya</div>
      <span class="badge">Drone Innovation Platform</span>
    </div>
    ${content}
    <div class="footer">
      This email was sent by Drona-a-charya &bull; Do not reply directly to this email
    </div>
  </div></body></html>`;
}


// ─────────────────────────────────────────────
//  1. EMAIL TO MENTOR — new session request
// ─────────────────────────────────────────────
async function sendSessionRequestToMentor({ mentor, student, session }) {
  const msgBlock = session.message
    ? `<div class="msg-box"><strong>Message from student:</strong><br/>${session.message}</div>`
    : '';

  const html = wrap(`
    <div class="body">
      <p class="title">New session request</p>
      <p class="sub">Hi ${mentor.name}, a student wants to connect with you on Drona-a-charya.</p>

      <div class="info-box">
        <div class="row"><span class="lbl">Student</span>     <span class="val">${student.name}</span></div>
        <div class="row"><span class="lbl">Email</span>        <span class="val">${student.email}</span></div>
        <div class="row"><span class="lbl">Requested slot</span><span class="val">${session.slot || 'Flexible'}</span></div>
        <div class="row"><span class="lbl">Status</span>       <span class="val"><span class="status-pending">Pending</span></span></div>
      </div>

      ${msgBlock}

      <p style="font-size:13px;color:#6b7280;margin-bottom:16px;">
        Log in to Drona-a-charya to confirm or cancel this session request.
      </p>

      <a href="http://localhost:3000" class="btn">View on Drona-a-charya</a>

      <p style="font-size:12px;color:#9ca3af;margin:0">
        If you did not expect this email, someone may have found your mentor profile.
        No action needed — just ignore it.
      </p>
    </div>`);

  return transporter.sendMail({
    from:    `"Drona-a-charya" <${process.env.EMAIL_USER}>`,
    to:      mentor.email,
    subject: `Session request from ${student.name} — Drona-a-charya`,
    html,
  });
}


// ─────────────────────────────────────────────
//  2. EMAIL TO STUDENT — request confirmation
// ─────────────────────────────────────────────
async function sendSessionConfirmationToStudent({ mentor, student, session }) {
  const html = wrap(`
    <div class="body">
      <p class="title">Your session request was sent!</p>
      <p class="sub">Hi ${student.name}, your request has been sent to ${mentor.name}. You'll hear back soon.</p>

      <div class="info-box">
        <div class="row"><span class="lbl">Mentor</span>       <span class="val">${mentor.name}</span></div>
        <div class="row"><span class="lbl">Role</span>          <span class="val">${[mentor.designation, mentor.institution].filter(Boolean).join(' · ') || 'Drone Expert'}</span></div>
        <div class="row"><span class="lbl">Requested slot</span><span class="val">${session.slot || 'Flexible'}</span></div>
        <div class="row"><span class="lbl">Status</span>        <span class="val"><span class="status-pending">Pending mentor approval</span></span></div>
      </div>

      <p style="font-size:13px;color:#6b7280;margin-bottom:16px;">
        We'll notify you by email when the mentor confirms or suggests a different time.
      </p>

      <a href="http://localhost:3000" class="btn">Back to Drona-a-charya</a>
    </div>`);

  return transporter.sendMail({
    from:    `"Drona-a-charya" <${process.env.EMAIL_USER}>`,
    to:      student.email,
    subject: `Session request sent to ${mentor.name} — Drona-a-charya`,
    html,
  });
}


// ─────────────────────────────────────────────
//  3. EMAIL TO STUDENT — mentor confirmed
// ─────────────────────────────────────────────
async function sendSessionStatusUpdate({ mentor, student, session }) {
  const isConfirmed = session.status === 'confirmed';
  const isCancelled = session.status === 'cancelled';

  const titleMap = {
    confirmed: 'Your session is confirmed!',
    cancelled: 'Session request declined',
    completed: 'Session completed',
  };
  const subMap = {
    confirmed: `Great news! ${mentor.name} has confirmed your session.`,
    cancelled: `${mentor.name} is unable to take this session. Try booking another slot.`,
    completed: `Your session with ${mentor.name} has been marked as completed.`,
  };

  const html = wrap(`
    <div class="body">
      <p class="title">${titleMap[session.status] || 'Session update'}</p>
      <p class="sub">${subMap[session.status] || ''}</p>

      <div class="info-box">
        <div class="row"><span class="lbl">Mentor</span> <span class="val">${mentor.name}</span></div>
        <div class="row"><span class="lbl">Slot</span>   <span class="val">${session.slot || 'TBD'}</span></div>
        <div class="row"><span class="lbl">Status</span> <span class="val"><span class="status-${session.status}">${session.status}</span></span></div>
      </div>

      ${isConfirmed ? `<p style="font-size:13px;color:#085041;background:#E1F5EE;padding:12px 16px;border-radius:8px;margin-bottom:20px;">
        Please be on time and prepared with your questions or project details.
      </p>` : ''}

      ${isCancelled ? `<p style="font-size:13px;color:#6b7280;margin-bottom:16px;">
        Don't worry — you can browse other available mentors and send a new request.
      </p>` : ''}

      <a href="http://localhost:3000" class="btn">Go to Drona-a-charya</a>
    </div>`);

  return transporter.sendMail({
    from:    `"Drona-a-charya" <${process.env.EMAIL_USER}>`,
    to:      student.email,
    subject: `${titleMap[session.status] || 'Session update'} — Drona-a-charya`,
    html,
  });
}


module.exports = {
  sendSessionRequestToMentor,
  sendSessionConfirmationToStudent,
  sendSessionStatusUpdate,
};