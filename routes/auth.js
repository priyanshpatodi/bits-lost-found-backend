import { Router } from "express";
import { isValidBitsEmail } from "../utils/emailValidator.js";

const router = Router();

function generateMockOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post("/verify-email", (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isValidBitsEmail(normalizedEmail)) {
    return res.status(403).json({
      success: false,
      message:
        "Only BITS Pilani email addresses are allowed (@bits-pilani.ac.in or campus subdomains).",
    });
  }

  const otp = generateMockOtp();

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully (mock).",
    email: normalizedEmail,
    otp,
  });
});

export default router;
