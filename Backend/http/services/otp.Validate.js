import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import "dotenv/config";

import { sendMail } from "../utils/helper.js";

const prisma = new PrismaClient();

function buildAuthPayload(user) {
  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    token,
  };
}

export async function verifyOtp({ email, otp }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (user.isVerified) {
    return {
      message: "Email already verified",
      ...buildAuthPayload(user),
    };
  }

  if (user.otpAttempts >= 5) {
    const err = new Error("Too many OTP attempts. Please request a new OTP.");
    err.status = 429;
    throw err;
  }

  if (!user.OTP || !user.OTPExpires) {
    const err = new Error("OTP not found. Please request a new OTP.");
    err.status = 400;
    throw err;
  }

  if (user.OTPExpires < new Date()) {
    const err = new Error("OTP expired. Please request a new OTP.");
    err.status = 400;
    throw err;
  }

  if (user.OTP !== otp) {
    await prisma.user.update({
      where: { email },
      data: {
        otpAttempts: {
          increment: 1,
        },
      },
    });

    const err = new Error("Invalid OTP");
    err.status = 400;
    throw err;
  }

  const verifiedUser = await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      OTP: null,
      OTPExpires: null,
      otpAttempts: 0,
    },
  });

  return {
    message: "Account verified successfully",
    ...buildAuthPayload(verifiedUser),
  };
}

export async function resendOtp({ email }) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (user.isVerified) {
    const err = new Error("Email is already verified");
    err.status = 400;
    throw err;
  }

  const mailResponse = await sendMail(email);
  const otp = mailResponse?.otp;

  if (!otp) {
    const err = new Error("Unable to send OTP email");
    err.status = 500;
    throw err;
  }

  await prisma.user.update({
    where: { email },
    data: {
      OTP: otp,
      OTPExpires: new Date(Date.now() + 5 * 60 * 1000),
      otpAttempts: 0,
    },
  });

  return {
    message: "OTP sent successfully",
  };
}
