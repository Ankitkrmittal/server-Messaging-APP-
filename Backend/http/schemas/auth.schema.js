import * as z from 'zod';

export const signupSchema = z.object({
    email:z
          .string()
          .trim()
           .toLowerCase()
           .email("invalid email format"),
   password:z
            .string()
            .min(4,"password must contains minimum of 4 characters")
            .max(32,"password should be of max 32 characters"),
name:z
      .string()
      .trim()
      .min(2,"name should be minimum of 4 characters") 
      .max(16,"name should be of max 16 characters") 
})
export const signinSchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format"),
    password: z
        .string()
        .trim()
        .min(4, "Password must be at least 4 characters long")
        .max(64, "Password too long"),
});

export const verifyOtpSchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format"),
    otp: z
        .string()
        .trim()
        .length(6, "OTP must be 6 digits"),
});

export const resendOtpSchema = z.object({
    email: z.string().trim().toLowerCase().email("Invalid email format"),
});
