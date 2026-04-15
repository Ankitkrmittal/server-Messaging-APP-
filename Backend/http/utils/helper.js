import NodemailerHelper from 'nodemailer-otp';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();


export async function sendMail(email) {
   try {
      const helper = new NodemailerHelper(process.env.EMAIL_USER, process.env.EMAIL_PASS);

      const otp = helper.generateOtp(6);
      console.log(`Generated OTP: ${otp}`);


      await helper.sendEmail(`${email}`,'OTP-Authentication','Enter this code to Authenticate', otp)
      return {
        otp
      }
      
  
   } catch (error) {
        console.log(error);
        return error
   }
}


         