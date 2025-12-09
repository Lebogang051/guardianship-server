const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const nodemailer = require('nodemailer');

require('dotenv').config();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);

// Configure Nodemailer transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Helper: send mail
async function sendMail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"GuardianshipApp" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error('Mail error to', to, err.message || err);
    return false;
  }
}

router.post('/notify-alert', async (req, res) => {
  try {
    const { alert } = req.body;
    if (!alert) return res.status(400).json({ error: 'Missing alert object' });

    // Build email HTML
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; max-width:600px;padding:16px;background:#fff;border-radius:8px;">
        <h2 style="color:#dc2626">EMERGENCY ALERT</h2>
        <p><strong>${alert.name || 'Unknown'}</strong> needs help.</p>
        <p><strong>Location:</strong> ${alert.location || 'Unknown'}<br/>
           <strong>GPS:</strong> ${alert.latitude}, ${alert.longitude}<br/>
           <strong>Time:</strong> ${new Date(alert.time).toLocaleString()}</p>

        ${alert.photo ? `<div style="margin:12px 0;"><img src="${alert.photo}" style="max-width:100%;border-radius:8px" /></div>` : ''}

        ${Array.isArray(alert.emergency_contacts) && alert.emergency_contacts.length ? `
          <div style="background:#f3f4f6;padding:12px;border-radius:8px;margin-top:12px;">
            <strong>Emergency Contacts:</strong><br/>
            ${alert.emergency_contacts.map(c => `${c.name || ''} (${c.relation || ''}) • ${c.phone || ''} ${c.email ? '• ' + c.email : ''}`).join('<br/>')}
          </div>
        ` : ''}

        <p style="margin-top:12px;">
          <a href="${alert.maps_link}" style="background:#667eea;color:#fff;padding:10px 14px;border-radius:8px;text-decoration:none;">Open in Maps</a>
        </p>

        <hr/>
        <small>GuardianshipApp — Community Safety</small>
      </div>
    `;

    // 1) Get approved users from Supabase
    const { data: approvedUsers, error: usersErr } = await supabase
      .from('users')
      .select('email,name')
      .eq('status', 'approved');

    if (usersErr) {
      console.error('Error fetching approved users:', usersErr);
    }

    // Build list of recipients: admins + approved users + emergency contacts (if email present)
    const recipients = new Set();
    ADMIN_EMAILS.forEach(e => recipients.add(e));
    (approvedUsers || []).forEach(u => u.email && recipients.add(u.email));

    // Add emergency contact emails if provided
    (alert.emergency_contacts || []).forEach(c => {
      if (c.email) recipients.add(c.email);
    });

    const recipientsArray = [...recipients];

    // Send emails in batches (simple sequential to avoid SMTP throttle)
    let success = 0;
    for (const to of recipientsArray) {
      const ok = await sendMail(to, `EMERGENCY ALERT - ${alert.name || 'Someone needs help'}`, emailHTML);
      if (ok) success++;
    }

    // Optionally, save a record to 'alerts' table for audit (if you want server to keep a copy)
    try {
      await supabase.from('alerts_log').insert([{
        name: alert.name || null,
        phone: alert.phone || null,
        latitude: alert.latitude || null,
        longitude: alert.longitude || null,
        location: alert.location || null,
        photo: alert.photo || null,
        time: alert.time || new Date().toISOString(),
        raw: alert
      }]);
    } catch (err) {
      // If table doesn't exist, ignore
      console.warn('alerts_log insert failed (ok to ignore if table missing).', err.message || err);
    }

    return res.json({ success: true, emailed: success, totalTargets: recipientsArray.length });
  } catch (err) {
    console.error('notify-alert error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;
