const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true' || true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

router.post('/approve-user', async (req, res) => {
  try {
    const { userId, adminEmail } = req.body;
    if (!userId || !adminEmail) return res.status(400).json({ error: 'Missing userId or adminEmail' });

    const { error } = await supabase.from('users').update({ status: 'approved' }).eq('id', userId);

    if (error) throw error;

    // fetch user to get email
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();

    // send approved email
    if (user && user.email) {
      try {
        await transporter.sendMail({
          from: `"GuardianshipApp" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'Your GuardianshipApp account is approved',
          html: `<p>Hi ${user.name || ''},</p><p>Your account has been approved by ${adminEmail}. You can now login.</p>`
        });
      } catch (err) {
        console.warn('Approval email failed', err.message || err);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('approve-user error', err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

module.exports = router;
