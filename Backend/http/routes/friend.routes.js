import { Router } from "express";
import { acceptFriendRequest, getFriends, getIncomingRequest, getSentRequest, rejectFriendRequest, sendFriendRequest } from "../controllers/friend.controller.js";
const router = Router();

router.post("/send",sendFriendRequest)
router.post("/accept",acceptFriendRequest)
router.post("/reject",rejectFriendRequest)
router.get("/incoming",getIncomingRequest)
router.get('/sent',getSentRequest)
router.get('/',getFriends)
export default router;
