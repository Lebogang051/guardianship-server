// ============================================
// FILE: guardianship-server/routes/broadcastRoutes.js
// FIXED: Shared Supabase client + Gmail TLS fix
// ============================================

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// ✅ Use shared Supabase client (no duplicates)
const supabase = require('../supabaseClient');

// Admin list
const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim())
  : [];

// Nodemailer setup (same as other routes)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false   // 🔥 Prevent Gmail SSL rejection errors
  }
});

// ============================================
// SEND BROADCAST TO ALL USERS
// ============================================

router.post('/broadcast-message', async (req, res) => {
  try {
    const { title, body, emails, adminEmail } = req.body;

    // Security: only approved admin emails can broadcast
    if (!adminEmail || !ADMIN_EMAILS.includes(adminEmail)) {
      return res.status(403).json({ error: 'Not authorized — admin email required' });
    }

    if (!title || !body || !emails || emails.length === 0) {
      return res.status(400).json({ error: 'Missing title, body, or email list' });
    }

    console.log(`📢 Broadcast initiated by admin: ${adminEmail}`);
    console.log(`   Title: ${title}`);
    console.log(`   Total recipients: ${emails.length}`);

    // Save broadcast log to DB
    const { error: dbErr } = await supabase
      .from('broadcast_messages')
      .insert([{
        admin_email: adminEmail,
        title,
        body,
        sent_to_count: emails.length,
        sent_at: new Date().toISOString()
      }]);

    if (dbErr) {
      console.error('❌ Supabase save error:', dbErr.message);
    } else {
      console.log('✅ Broadcast saved to database');
    }

    // Email template
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial; background: #f5f5f5; margin:0; padding:0; }
          .container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          }
          h2 { color: #4F46E5; margin-top: 0; }
          .meta { font-size: 12px; color: #777; margin-bottom: 16px; }
          .body { margin-top: 10px; white-space: pre-line; color: #333; }
          .footer { font-size: 12px; color: #999; margin-top: 20px; border-top: 1px solid #ececec; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>📢 GuardianshipApp Broadcast</h2>
          <div class="meta">From: ${adminEmail}</div>
          <h3>${title}</h3>
          <div class="body">${body}</div>
          <div class="footer">
            GuardianshipApp — Community Safety Network<br/>
            Thaba Nchu Community Safety System
          </div>
        </div>
      </body>
      </html>
    `;

    let sentCount = 0;
    let failedCount = 0;

    // Loop through all emails and send
    for (const email of emails) {
      try {
        await transporter.sendMail({
          from: `GuardianshipApp <${process.env.SMTP_USER}>`,
          to: email,
          subject: `📢 ${title} — GuardianshipApp`,
          html: emailHTML
        });

        console.log(`✅ Email sent: ${email}`);
        sentCount++;
      } catch (err) {
        console.error(`❌ Failed to send to ${email}:`, err.message);
        failedCount++;
      }
    }

    console.log(`📊 Broadcast summary → Sent: ${sentCount} | Failed: ${failedCount}`);

    return res.json({
      success: true,
      message: 'Broadcast completed',
      total: emails.length,
      sentCount,
      failedCount
    });

  } catch (err) {
    console.error('❌ Error in /broadcast-message:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
