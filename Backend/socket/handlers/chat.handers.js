import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function getOrCreateConversation(userAId,userBId) {
    const [a,b] = [userAId,userBId].sort();
    let conv = await prisma.directConversation.findUnique({
        where:{
            userAId_userBId:{
                userAId:a,
                userBId:b
            }
        }
    })
    if(!conv) {
        conv = await prisma.directConversation.create({
            data:{
                userAId:a,
                userBId:b
            }
        })
    }
    return conv || null;
}

export default function(socket,io) {
    socket.on("chat:send",async (payload,cb)=>{
        try {
            const receiverEmail = payload?.receiverEmail?.trim().toLowerCase();
            let receiverId = payload?.receiverId;
            const text = payload?.text?.trim();

            if(!text || (!receiverEmail && !receiverId)) {
                return cb?.({
                    ok:false,
                    error:"Receiver email and message are required"
                });
            }

            const userId = socket.user.id;

            if(receiverEmail) {
                const receiver = await prisma.user.findUnique({
                    where:{
                        email:receiverEmail
                    },
                    select:{
                        id:true
                    }
                });

                if(!receiver) {
                    return cb?.({
                        ok:false,
                        error:"No user found with that email"
                    });
                }

                receiverId = receiver.id;
            }

            if(receiverId === userId) {
                return cb?.({
                    ok:false,
                    error:"You cannot send a message to yourself"
                });
            }

            let conv = await getOrCreateConversation(userId,receiverId);
            let message = await prisma.message.create({
                data:{
                    conversationId:conv.id,
                    text,
                    senderId:userId
                },
                include:{
                    sender:{
                        select:{
                            id:true,
                            name:true,
                            email:true
                        }
                    }
                }
            })
            io.to(`user:${userId}`).emit("chat:new",message);
            io.to(`user:${receiverId}`).emit("chat:new",message);
            cb?.({
                ok:true,
                message
            })
        } catch (error) {
            console.log(error)
            cb?.({
                ok:false,
                error
            })
        }
    
    })
}
