import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function generateOtp(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function getTransporter() {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    const err = new Error("Email service is not configured. Set EMAIL_USER and EMAIL_PASS in Backend/.env.");
    err.status = 500;
    throw err;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

export async function sendMail(email) {
  const otp = generateOtp(6);
  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Authentication",
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
      html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`,
    });

    return { otp };
  } catch (error) {
    const err = new Error(error?.message || "Unable to send OTP email");
    err.status = 500;
    throw err;
  }
}


         
