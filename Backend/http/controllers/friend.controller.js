import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export async function sendFriendRequest(req,res) {
    console.log(req.body);
    const {email} = req.body;
    console.log(email)
    const senderId = req.user.id;
    // const {senderId} = req.body;
    
    const receiver = await prisma.user.findUnique({
        where:{email}
    });
    if(!receiver) {
        return res.status(404).json({msg:"user not found"});
    }

    if(receiver.id == senderId) {
        return res.status(400).json({msg:"you cannot add yourself"});

    }

    const [user1Id,user2Id] = [senderId,receiver.id].sort();
    const alreadyFriends = await prisma.friend.findUnique({
        where:{
            user1Id_user2Id:{user1Id,user2Id}
        }
    })
    if(alreadyFriends){
        return res.status(400).json({msg:"Already friends"})
    }
    const existngRequest = await prisma.friendRequest.findFirst({
        where:{
            senderId,
            receiverId:receiver.id,
            status:"PENDING"
        }
    });
    if(existngRequest) {
        return res.status(400).json({msg:"Request Already sent"});

    }
    await prisma.friendRequest.create({
        data:{
            senderId,
            receiverId:receiver.id
        }
    });
    return res.status(200).json({ msg: "Friend request sent" });
} 


export async function acceptFriendRequest(req,res) {
    try {
        const userId = req.user.id;
       // const {userId} = req.body;
        const {requestId}  = req.body;
        const request = await prisma.friendRequest.findUnique({
            where:{id:requestId}
        });
        if(!request) {
            return res.status(404).json({msg:"Request not found"});
        }
        if(request.receiverId !== userId){
            return res.status(403).json({msg:"Not authorized"})
        }
        await prisma.friendRequest.update({
            where:{id:requestId},
            data:{status:"ACCEPTED"}
        });
        const [user1Id,user2Id]= [request.senderId,request.receiverId].sort();
        await prisma.friend.create({
            data:{user1Id,user2Id}
        });
        res.json({msg:"Friend added successfully"});

    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }

}

export async function rejectFriendRequest(req,res) {
    try {
        const userId = req.user.id;
        const {requestId} = req.body;
        const request = await prisma.friendRequest.findUnique({
            where:{id:requestId}
        });
        if(!request) {
            return res.status(404).json({msg:"Request not found"});

        }
        if(request.status != "PENDING") {
            return res.status(404).json({msg:"cannot reject request"})
        }
        if(request.receiverId !== userId) {
            return res.status(403).json({msg:"unauthorized"})
        }
        await prisma.friendRequest.update({
            where:{id:requestId},
            data:{status:"REJECTED"}
        });
        res.json({msg:"Request rejected"})
    } catch (error) {
        console.log(error)
        res.status(500).json({msg:"failed"})
    }
}

export async function getIncomingRequest(req,res) {
    const userId= req.user.id;
    //const {userId} = req.body;
    const request = await prisma.friendRequest.findMany({
        where:{
            receiverId:userId,
            status:"PENDING"
        },
        include:{
            sender:{
                select:{
                    id:true,
                    email:true,
                    name:true
                }
            }
        }
        
    });
     res.json(request)
}

export async function getSentRequest(req,res) {
    console.log("now executing backend ")
    console.log(req.user)
    const userId = req.user.id;
    // const {userId} = req.body;
    const requests = await prisma.friendRequest.findMany({
        where:{
            senderId:userId,
            status:"PENDING"
        },
        include:{
              receiver:{
                select:{
                    id:true,
                    email:true,
                    name:true
                }
              }
        }
    })
    res.json(requests);
}

export async function getFriends(req,res) {
    try {
        const userId = req.user.id;
        //const {userId} = req.body
        const friends = await prisma.friend.findMany({
            where:{
                OR:[
                    {user1Id:userId},
                    {user2Id:userId}
                ]
            },
            include:{
                user1:true,
                user2:true
            }
        });
        const formatted = friends.map(f => {
            return f.user1Id === userId ? f.user2 : f.user1;
        });

        res.json(formatted);
    } catch (error) {
        res.status(500).json(error)
    }
}
