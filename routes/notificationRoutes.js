const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/send-alert-notifications', async (req, res) => {
  try {
    const { alert } = req.body;

    if (!alert) {
      return res.status(400).json({ error: 'No alert data provided' });
    }

    console.log('📧 Preparing email notifications for alert:', alert.name);

    const { data: users } = await supabase
      .from('users')
      .select('email, name')
      .eq('status', 'approved');

    if (!users || users.length === 0) {
      console.log('❌ No users to notify');
      return res.status(400).json({ error: 'No approved users found' });
    }

    console.log(`📧 Sending emails to ${users.length} users`);

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 10px; }
          .alert-header { background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .alert-header h2 { margin: 0; font-size: 24px; }
          .info-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
          .info-box strong { color: #667eea; }
          .button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0; }
          .footer { color: #666; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="alert-header">
            <h2>EMERGENCY ALERT</h2>
            <p style="margin: 10px 0 0 0;">Someone in your community needs help</p>
          </div>

          <h3>${alert.name} needs help!</h3>

          <div class="info-box">
            <strong>Location:</strong> ${alert.location}<br>
            <strong>Phone:</strong> ${alert.phone}<br>
            <strong>Time:</strong> ${new Date(alert.time).toLocaleString()}<br>
            <strong>GPS:</strong> ${alert.latitude}, ${alert.longitude}
          </div>

          ${alert.emergency_contacts && alert.emergency_contacts.length > 0 ? `
            <div class="info-box">
              <strong>Emergency Contacts:</strong><br>
              ${alert.emergency_contacts.map(c => `
                ${c.name} (${c.relation}): ${c.phone}<br>
              `).join('')}
            </div>
          ` : ''}

          <p>
            <a href="${alert.maps_link}" target="_blank" class="button">
              View on Maps
            </a>
          </p>

          <div style="background: #ffe0e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>If you know this person or see them, please respond immediately!</strong>
          </div>

          <div class="footer">
            <p>GuardianshipApp - Community Safety Network</p>
            <p>Thaba Nchu Community Safety System</p>
            <p>Support: +27 71 704 0345</p>
          </div>
        </div>
      </body>
      </html>
    `;

    let successCount = 0;

    for (const user of users) {
      try {
        await transporter.sendMail({
          from: `GuardianshipApp <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `EMERGENCY ALERT - ${alert.name} needs help!`,
          html: emailHTML
        });
        console.log(`✅ Email sent to ${user.email}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to send to ${user.email}:`, err.message);
      }
    }

    console.log(`📊 Result: ${successCount} emails sent`);

    res.json({
      success: true,
      sentCount: successCount,
      totalUsers: users.length
    });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;