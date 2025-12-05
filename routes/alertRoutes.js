// ============================================
// FILE: guardianship-server/routes/alertRoutes.js
// UPDATED: Email notifications instead of CallMeBot
// ============================================

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// ✅ Use shared Supabase client
const supabase = require('../supabaseClient');

// Configure email - with certificate fix
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// ============================================
// SEND ALERT + EMAIL NOTIFICATIONS
// ============================================

router.post('/notify-alert', async (req, res) => {
  try {
    const { alert } = req.body;

    if (!alert) {
      return res.status(400).json({ error: 'No alert data provided' });
    }

    console.log('🚨 EMERGENCY ALERT RECEIVED:');
    console.log('   Name:', alert.name);
    console.log('   Phone:', alert.phone);
    console.log('   Location:', alert.location);
    console.log('   Lat/Lng:', alert.latitude, alert.longitude);
    console.log('   Maps:', alert.maps_link);
    console.log('   Time:', alert.time);
    console.log('   📸 Photo URL:', alert.photo);
    console.log('   Contacts:', alert.emergency_contacts);
    console.log('---');

    // Fetch approved users for email notifications
    console.log('📧 Fetching approved users...');
    const { data: allUsers, error } = await supabase
      .from('users')
      .select('email, name')
      .eq('status', 'approved');

    if (error) {
      console.error('Supabase error:', error.message);
    }

    if (!allUsers || allUsers.length === 0) {
      console.log('⚠️ No approved users found');
    } else {
      console.log(`📧 ${allUsers.length} users will be notified`);

      // Build HTML email
      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
        <style>
          body { font-family: Arial; background: #f5f5f5; }
          .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; }
          .header { background: #dc2626; color: #fff; padding: 20px; border-radius: 8px; text-align:center; }
          .photo { width: 120px; height:120px; border-radius:50%; border:3px solid #667eea; object-fit: cover; }
          .button { background:#667eea; color:white; padding:12px 20px; text-decoration:none; border-radius:8px; display:inline-block; }
        </style>
        </head>
        <body>
        <div class="container">
          <div class="header">
            <h2>🚨 EMERGENCY ALERT</h2>
            <p>Someone in your community needs help</p>
          </div>

          <div style="text-align:center;margin-top:20px;">
            ${alert.photo ? `<img src="${alert.photo}" class="photo">` : ''}
            <h3>${alert.name}</h3>
            <p><strong>Phone:</strong> ${alert.phone}</p>
            <p><strong>Location:</strong> ${alert.location}</p>
            <p><strong>Time:</strong> ${new Date(alert.time).toLocaleString()}</p>
          </div>

          <p><strong>GPS:</strong> ${alert.latitude}, ${alert.longitude}</p>

          <div style="text-align:center;margin:30px 0;">
            <a href="${alert.maps_link}" class="button" target="_blank">View on Google Maps</a>
          </div>

          <p style="color:#888;text-align:center;font-size:12px;">
            GuardianshipApp — Thaba Nchu Community Safety Network
          </p>
        </div>
        </body>
        </html>
      `;

      // Send emails one by one
      let sent = 0;
      let failed = 0;

      for (const user of allUsers) {
        try {
          await transporter.sendMail({
            from: `GuardianshipApp Alert <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: `🚨 EMERGENCY ALERT — ${alert.name} needs help!`,
            html: emailHTML
          });
          console.log(`✅ Email sent to ${user.email}`);
          sent++;
          await new Promise(res => setTimeout(res, 500));
        } catch (err) {
          console.error(`❌ Failed to send email to ${user.email}:`, err.message);
          failed++;
        }
      }

      console.log(`📊 Email Results → Sent: ${sent}, Failed: ${failed}`);
    }

    res.json({
      success: true,
      message: 'Alert processed and notifications sent.',
      alertId: alert.id
    });

  } catch (err) {
    console.error('❌ /notify-alert ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

