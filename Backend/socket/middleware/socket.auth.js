import { PrismaClient } from "@prisma/client";
import { configDotenv } from "dotenv";
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();
configDotenv();

export async function socketAuth(socket,next) {
    try {
        const token  = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
        if(!token) throw new Error("token missing")
        
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const userId = decoded.id;
        const user = await prisma.user.findUnique({
            where:{id:userId || " "},
            select:{id:true,email:true,name:true},
        });
        if(!user) throw new Error("user not found")

        socket.user=user;
        next()
    } catch (err) {
        console.error("Socket auth failed:", err.message);
        next(new Error("Unauthorized"));
    }
}