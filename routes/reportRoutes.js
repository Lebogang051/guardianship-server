import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// Email transporter (your Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /api/report-clone
router.post("/report-clone", async (req, res) => {
  try {
    const { domain, url, time } = req.body;

    console.log("Clone detected:", domain, url);

    // Email admins that someone is copying your site
    const admins = process.env.ADMIN_EMAILS.split(",");

    await transporter.sendMail({
      from: `"GuardianshipApp Security" <${process.env.SMTP_USER}>`,
      to: admins,
      subject: "🚨 Clone Warning: Someone copied your website",
      html: `
        <h2>Website Clone Detected</h2>
        <p><b>Domain:</b> ${domain}</p>
        <p><b>URL:</b> ${url}</p>
        <p><b>Time:</b> ${time}</p>
        <br>
        <p>GuardianshipApp Auto Security System</p>
      `,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Clone report error:", err);
    res.status(500).json({ error: "Failed to report clone" });
  }
});

export default router;
