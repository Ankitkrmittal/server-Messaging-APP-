import { Router } from "express";
import { getMe, postResendOtp, postSignin, postSignup, postVerifyOtp } from "../controllers/auth.controller.js";
import requireAuth from "../middlewares/requireAuth.js";

const router = Router();
 
router.post('/signup',postSignup)
router.post('/verify-otp',postVerifyOtp)
router.post('/resend-otp',postResendOtp)
router.post('/signin',postSignin);
router.get('/me',requireAuth,getMe)

export default router
