import {  PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


 import 'dotenv/config'
import { sendMail } from "../utils/helper.js";
export async function signup({email,name,password}) {
     let existing = await prisma.user.findUnique({
        where:{email}
     })
     if(existing) {
        let err = new Error("User Already exist please Login");
        err.status =401;
        throw err;

     }

     try {
        const salt = await bcrypt.genSalt(10);
        const hashPassword =await  bcrypt.hash(password,salt);

        const mailResponse = await sendMail(email);
        const otp = mailResponse?.otp;

        if (!otp) {
            let err = new Error("Unable to send OTP email");
            err.status = 500;
            throw err;
        }

        await prisma.user.create({
           data:{
            email,
            name,
            OTP:otp,
            OTPExpires: new Date(Date.now() + 5 * 60 * 1000), // 5 min
            isVerified: false,
            otpAttempts: 0,
            password:hashPassword

           }
           
        })

        return {
            message: "Signup successful. Verify the OTP sent to your email.",
            requiresVerification: true,
            email
        }
     } catch (error) {
        throw error;
     }
}

export async function signin({email,password}) {
    let user = await prisma.user.findUnique({
        where:{email}
    })
    if(!user) {
        let err= new Error("Invalid Email");
        err.status = 401;
        throw err;
    }
    try {
        const validate = await bcrypt.compare(password,user.password);
        if(!validate) {
            let err = new Error("Invalid login credientials");
            err.status = 401;
            throw err;
        }
        if (!user.isVerified) {
            let err = new Error("Email is not verified. Please verify OTP first.");
            err.status = 403;
            throw err;
        }
        let token = jwt.sign({name:user.name,email,id:user.id},process.env.JWT_SECRET);
        return {
            user:{
                id:user.id,
                name:user.name,
                email:user.email
            },
            token
        }
    } catch (error) {
        throw error;
    }
}
