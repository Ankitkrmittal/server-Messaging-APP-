import { resendOtpSchema, signinSchema, signupSchema, verifyOtpSchema } from "../schemas/auth.schema.js";
import { signin, signup } from "../services/auth.service.js";
import { resendOtp, verifyOtp } from "../services/otp.Validate.js";

export async function postSignup(req,res,next){
   try {
     
    const result =  signupSchema.safeParse(req.body);
    
    if(!result.success){
        return res.status(401).json({
            error:result.error.flatten()
        })
        
    }
    
    const {email,name,password} = result.data;
    
    const  data = await signup({name,email,password});
    
    res.status(200).json({
        data
    })
   } catch (error) {
      res.status(error.status || 500).json({
        message:error.message || "Unable to signup please try again",
      })
   }

}

export async function postSignin(req,res,next) {
    const result = signinSchema.safeParse(req.body);
    if(!result.success) {
       return res.status(401).json({
        error:result.error.flatten()
       })
    }
    try {
        const {email,password} = result.data;
        const data = await signin({email,password});
        res.status(200).json({
            data
        })
    } catch (error) {
        res.status(error.status || 500).json({
            message:error.message || "Unable to login",
        })
    }
}

export async function postVerifyOtp(req,res) {
    const result = verifyOtpSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(401).json({
            error: result.error.flatten()
        });
    }

    try {
        const data = await verifyOtp(result.data);
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || "Unable to verify OTP"
        });
    }
}

export async function postResendOtp(req,res) {
    const result = resendOtpSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(401).json({
            error: result.error.flatten()
        });
    }

    try {
        const data = await resendOtp(result.data);
        return res.status(200).json({ data });
    } catch (error) {
        return res.status(error.status || 500).json({
            message: error.message || "Unable to resend OTP"
        });
    }
}

export async function getMe(req,res,next) {
    return res.status(200).json({
        user:req.user
    })
}
