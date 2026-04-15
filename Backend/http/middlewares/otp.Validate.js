import { verifyOtp as verifyOtpService } from "../services/otp.Validate.js";

export async function verifyOtp(req, res) {
  try {
    const data = await verifyOtpService(req.body);
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Unable to verify OTP",
    });
  }
}
