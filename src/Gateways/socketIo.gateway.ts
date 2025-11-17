import { Server as httpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../Utils";
import { UserModel } from "../DB/Models";
import { ChatInitiation } from "../Modules/Chat/chat";

export const connectedSockets = new Map<string, string[]>(); // Key: userId, Value: socketIds
let io: Server | null = null;

// Socket Authentication
async function socketAuthentication(socket: Socket, next: Function) {
  const token = socket.handshake.auth.authorization;
  const decodedData = verifyToken(
    token,
    process.env.JWT_ACCESS_SECRET as string
  );
  // socket.data = { userId: decodedData._id };

  // Fetch Full User Data
  const user = await UserModel.findById(decodedData._id).select(
    "_id firstName lastName email role"
  );
  if (!user) return next(new Error("User not found"));

  // Attach User Info To Socket
  socket.data.user = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };

  const userTabs = connectedSockets.get(socket.data.userId);
  if (!userTabs) {
    connectedSockets.set(socket.data.userId, [socket.id]);
  } else {
    userTabs.push(socket.id);
  }

  socket.emit("connected", { user: socket.data.user });

  next();
}

// Socket Disconnection
function socketDisconnection(socket: Socket) {
  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    let userTabs = connectedSockets.get(userId);
    if (userTabs && userTabs.length) {
      userTabs = userTabs.filter((tab) => tab !== socket.id);
      if (!userTabs.length) {
        connectedSockets.delete(userId);
      }
    }
    socket.broadcast.emit("disconnect_user", { userId, socketId: socket.id });
  });
}

// Socket Initializer
export const ioInitializer = (server: httpServer) => {
  io = new Server(server, { cors: { origin: "*" } });

  io.use(socketAuthentication);

  io.on("connection", (socket: Socket) => {
    ChatInitiation(socket);
    socketDisconnection(socket);
  });
};

// Get Socket IO Instance
export const getIo = () => {
  try {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
  } catch (error) {
    console.log(error);
  }
};
