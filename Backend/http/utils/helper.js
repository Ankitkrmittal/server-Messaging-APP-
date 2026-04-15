import nodemailer from "nodemailer";
import dotenv from "dotenv";
import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Some deploy targets do not have outbound IPv6 routing.
// Prefer IPv4 so SMTP connections to Gmail do not fail with ENETUNREACH.
dns.setDefaultResultOrder("ipv4first");

function generateOtp(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER;
}

function getTransporter() {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    const err = new Error("Email service is not configured. Set EMAIL_USER and EMAIL_PASS in Backend/.env.");
    err.status = 500;
    throw err;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      servername: "smtp.gmail.com",
    },
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

function getAlternateTransporter() {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      servername: "smtp.gmail.com",
    },
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

function isRetryableSmtpError(error) {
  const message = error?.message || "";

  return [
    "ENETUNREACH",
    "ECONNECTION",
    "ETIMEDOUT",
    "ESOCKET",
    "ECONNRESET",
    "EHOSTUNREACH",
  ].some((code) => message.includes(code) || error?.code === code);
}

async function sendWithSmtp({ email, otp }) {
  const transporter = getTransporter();
  const mailOptions = {
    from: getFromAddress(),
    to: email,
    subject: "OTP Authentication",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `<p>Your OTP is <strong>${otp}</strong>.</p><p>It expires in 5 minutes.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    if (!isRetryableSmtpError(error)) {
      throw error;
    }

    const fallbackTransporter = getAlternateTransporter();
    await fallbackTransporter.sendMail(mailOptions);
  }
}

export async function sendMail(email) {
  const otp = generateOtp(6);

  try {
    await sendWithSmtp({ email, otp });

    return { otp };
  } catch (error) {
    const err = new Error(error?.message || "Unable to send OTP email");
    err.status = 500;
    throw err;
  }
}


         
