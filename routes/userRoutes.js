// ============================================
// FILE: guardianship-server/routes/userRoutes.js
// ============================================

const express = require('express');
const router = express.Router();
require('dotenv').config();

// ✅ Use the shared Supabase client
const supabase = require('../supabaseClient');

// Approve a pending user (admin only)
router.post('/approve-user', async (req, res) => {
  try {
    const { userId, adminEmail } = req.body;

    if (!userId || !adminEmail) {
      return res.status(400).json({ error: 'Missing userId or adminEmail' });
    }

    const ADMIN_EMAILS = process.env.ADMIN_EMAILS.split(',').map(e => e.trim());
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return res.status(403).json({ error: 'Not authorized - admin email required' });
    }

    // Update user status to 'approved'
    const { data, error } = await supabase
      .from('users')
      .update({ status: 'approved' })
      .eq('id', userId)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    console.log(`✅ User ${userId} approved by ${adminEmail}`);

    res.json({
      success: true,
      message: 'User approved successfully',
      user: data[0]
    });

  } catch (err) {
    console.error('Error in /api/approve-user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all pending users (admin only)
router.post('/get-pending-users', async (req, res) => {
  try {
    const { adminEmail } = req.body;

    const ADMIN_EMAILS = process.env.ADMIN_EMAILS.split(',').map(e => e.trim());
    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'pending');

    if (error) return res.status(400).json({ error: error.message });

    res.json({
      success: true,
      users: data
    });

  } catch (err) {
    console.error('Error in /api/get-pending-users:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
