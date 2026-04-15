import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from "cors"
const app = express();
const server = createServer(app);
app.use(express.json())
app.use(express.urlencoded({extended:true}))

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
};

const io = new Server(server, {
  cors: corsOptions,
});
const PORT = process.env.PORT || 4444;

app.use(cors(corsOptions));
import chatHandler from "./socket/handlers/chat.handers.js"
import {socketAuth} from "./socket/middleware/socket.auth.js"
import authRoutes from "./http/routes/route.auth.js"
import requireAuth from './http/middlewares/requireAuth.js';
import userRoutes from "./http/routes/users.routes.js"
import friendRoutes from "./http/routes/friend.routes.js"

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/auth',authRoutes)
app.use('/api/user',requireAuth,userRoutes)
app.use('/api/friend',requireAuth,friendRoutes)
io.use(socketAuth)
io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);
  console.log('a user connected',socket.id);
  chatHandler(socket,io);
});
server.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`)
})
