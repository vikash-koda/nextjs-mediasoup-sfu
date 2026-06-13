import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local" });

import { Server } from "socket.io";
import { createServer } from "http";
import * as mediasoup from "mediasoup";
import { createWorker, getWorker } from "./mediasoup/worker";
import { config } from "./mediasoup/config";
import dbConnect from "../src/lib/mongodb";
import { Session } from "../src/models/Session";
import { Message } from "../src/models/Message";

dbConnect().catch(console.error);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

interface Peer {
  socketId: string;
  sendTransport?: mediasoup.types.WebRtcTransport;
  recvTransport?: mediasoup.types.WebRtcTransport;
  producers: Map<string, mediasoup.types.Producer>;
  consumers: Map<string, mediasoup.types.Consumer>;
}

interface Room {
  router: mediasoup.types.Router;
  peers: Map<string, Peer>;
}

const rooms = new Map<string, Room>();

const getOrCreateRoom = async (roomId: string) => {
  if (rooms.has(roomId)) {
    return rooms.get(roomId)!;
  }
  const worker = getWorker();
  const router = await worker.createRouter({ mediaCodecs: config.router.mediaCodecs });
  const room: Room = { router, peers: new Map() };
  rooms.set(roomId, room);
  return room;
};

const createWebRtcTransport = async (router: mediasoup.types.Router) => {
  const { listenIps, initialAvailableOutgoingBitrate, enableUdp, enableTcp, preferUdp } = config.webRtcTransport;
  const transport = await router.createWebRtcTransport({
    listenIps,
    enableUdp,
    enableTcp,
    preferUdp,
    initialAvailableOutgoingBitrate
  } as any);
  
  await transport.setMaxIncomingBitrate(1500000);
  return transport;
};

const endSessionInDB = async (sessionId: string) => {
  try {
    await Session.findOneAndUpdate(
      { sessionId },
      { status: 'ended', endedAt: new Date() }
    );
    console.log(`[DB] Session ${sessionId} marked as ended.`);
  } catch (e) {
    console.error(`[DB] Failed to end session ${sessionId}`, e);
  }
};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", async ({ roomId }, callback) => {
    socket.join(roomId);
    const room = await getOrCreateRoom(roomId);
    room.peers.set(socket.id, {
      socketId: socket.id,
      producers: new Map(),
      consumers: new Map()
    });

    socket.to(roomId).emit("new-peer", socket.id);
    
    room.peers.forEach((peer, peerId) => {
      if (peerId !== socket.id) {
        peer.producers.forEach((producer) => {
          socket.emit("new-producer", { producerId: producer.id, peerId });
        });
      }
    });

    callback({ rtpCapabilities: room.router.rtpCapabilities });
  });

  socket.on("createWebRtcTransport", async ({ roomId, direction }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return callback({ error: "Room not found" });
    const peer = room.peers.get(socket.id);
    if (!peer) return callback({ error: "Peer not found" });

    try {
      const transport = await createWebRtcTransport(room.router);
      
      transport.on("dtlsstatechange", dtlsState => {
        if (dtlsState === "closed") transport.close();
      });

      if (direction === "send") peer.sendTransport = transport;
      else peer.recvTransport = transport;

      callback({
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters
        }
      });
    } catch (err: any) {
      callback({ error: err.message });
    }
  });

  socket.on("connectWebRtcTransport", async ({ roomId, transportId, dtlsParameters }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(socket.id);
    if (!peer) return;

    const transport = peer.sendTransport?.id === transportId ? peer.sendTransport : peer.recvTransport;
    if (!transport) return callback({ error: "Transport not found" });

    await transport.connect({ dtlsParameters });
    callback({});
  });

  socket.on("produce", async ({ roomId, transportId, kind, rtpParameters, appData }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(socket.id);
    if (!peer || !peer.sendTransport) return;

    const producer = await peer.sendTransport.produce({ kind, rtpParameters, appData });
    peer.producers.set(producer.id, producer);

    producer.on("transportclose", () => {
      producer.close();
      peer.producers.delete(producer.id);
    });

    callback({ id: producer.id });
    socket.to(roomId).emit("new-producer", { producerId: producer.id, peerId: socket.id, appData });
  });

  socket.on("close-producer", ({ roomId, producerId }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(socket.id);
    if (!peer) return;

    const producer = peer.producers.get(producerId);
    if (producer) {
      producer.close();
      peer.producers.delete(producerId);
      socket.to(roomId).emit("producer-closed", { producerId });
    }
  });

  socket.on("start-screen-share", async (roomId) => {
    socket.to(roomId).emit("screen-share-started", { peerId: socket.id });
    
    // Log to session history
    try {
      const room = rooms.get(roomId);
      if (room) {
        const peer = room.peers.get(socket.id);
        const name = peer ? (peer as any).name || "A participant" : "A participant";
        const newMessage = await Message.create({
          sessionId: roomId,
          senderRole: "system",
          senderName: "System",
          message: `${name} started sharing their screen.`,
          timestamp: new Date()
        });
        io.to(roomId).emit("receive-message", newMessage);
        io.to("admin").emit("dashboard-update");
      }
    } catch(e) {}
  });

  socket.on("stop-screen-share", async (roomId) => {
    socket.to(roomId).emit("screen-share-stopped", { peerId: socket.id });

    // Log to session history
    try {
      const room = rooms.get(roomId);
      if (room) {
        const peer = room.peers.get(socket.id);
        const name = peer ? (peer as any).name || "A participant" : "A participant";
        const newMessage = await Message.create({
          sessionId: roomId,
          senderRole: "system",
          senderName: "System",
          message: `${name} stopped sharing their screen.`,
          timestamp: new Date()
        });
        io.to(roomId).emit("receive-message", newMessage);
        io.to("admin").emit("dashboard-update");
      }
    } catch(e) {}
  });

  socket.on("consume", async ({ roomId, producerId, rtpCapabilities }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(socket.id);
    if (!peer || !peer.recvTransport) return;

    try {
      if (!room.router.canConsume({ producerId, rtpCapabilities })) {
        return callback({ error: "Cannot consume" });
      }

      const consumer = await peer.recvTransport.consume({
        producerId,
        rtpCapabilities,
        paused: true
      });

      peer.consumers.set(consumer.id, consumer);

      consumer.on("transportclose", () => {
        peer.consumers.delete(consumer.id);
      });

      consumer.on("producerclose", () => {
        peer.consumers.delete(consumer.id);
        socket.emit("producer-closed", { producerId });
      });

      callback({
        params: {
          id: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters
        }
      });
    } catch (err: any) {
      callback({ error: err.message });
    }
  });

  socket.on("resume", async ({ roomId, consumerId }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const peer = room.peers.get(socket.id);
    if (!peer) return;

    const consumer = peer.consumers.get(consumerId);
    if (!consumer) return;

    await consumer.resume();
    callback({});
  });

  const handleLeaveRoom = async (socketId: string, roomId: string) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const peer = room.peers.get(socketId);
    if (peer) {
      peer.producers.forEach(p => p.close());
      peer.consumers.forEach(c => c.close());
      peer.sendTransport?.close();
      peer.recvTransport?.close();
      room.peers.delete(socketId);
      io.to(roomId).emit("peer-closed", socketId);
    }

    if (room.peers.size === 0) {
      room.router.close();
      rooms.delete(roomId);
      console.log(`Room ${roomId} deleted. Freeing router.`);
      await endSessionInDB(roomId);
    }
  };

  socket.on("leave-room", async ({ roomId }) => {
    socket.leave(roomId);
    await handleLeaveRoom(socket.id, roomId);
  });

  socket.on("end-call", async ({ roomId }) => {
    socket.to(roomId).emit("end-call");
    const room = rooms.get(roomId);
    if (room) {
      room.peers.forEach((peer, peerId) => {
        const s = io.sockets.sockets.get(peerId);
        if (s) s.leave(roomId);
      });
      room.router.close();
      rooms.delete(roomId);
    }
    await endSessionInDB(roomId);
    io.to("admin").emit("dashboard-update");
  });

  socket.on("send-message", async (data) => {
    const { roomId, senderRole, senderName, message } = data;
    try {
      const newMessage = await Message.create({
        sessionId: roomId,
        senderRole,
        senderName,
        message,
        timestamp: new Date()
      });
      io.to(roomId).emit("receive-message", newMessage);
      io.to("admin").emit("dashboard-update");
    } catch (e) {
      console.error("[CHAT_SAVE_ERROR] Failed to save message:", e);
    }
  });

  socket.on("send-file", (sharedFile) => {
    io.to(sharedFile.sessionId).emit("receive-file", sharedFile);
    io.to("admin").emit("dashboard-update");
  });

  socket.on("admin-force-end-session", async (roomId) => {
    io.to(roomId).emit("session-force-ended");
    
    // Teardown MediaSoup
    const room = rooms.get(roomId);
    if (room) {
      room.peers.forEach((peer, peerId) => {
        const s = io.sockets.sockets.get(peerId);
        if (s) s.leave(roomId);
      });
      room.router.close(); // Automatically closes all transports, producers, and consumers
      rooms.delete(roomId);
    }
    
    await endSessionInDB(roomId);
    io.to("admin").emit("dashboard-update");
  });

  socket.on("end-session", (roomId) => {
    io.to(roomId).emit("session-ended");
    io.to("admin").emit("dashboard-update");
  });

  socket.on("disconnect", async () => {
    console.log("Client disconnected:", socket.id);
    for (const roomId of rooms.keys()) {
      const room = rooms.get(roomId);
      if (room?.peers.has(socket.id)) {
        await handleLeaveRoom(socket.id, roomId);
      }
    }
  });
});

createWorker().then(() => {
  const PORT = process.env.SOCKET_PORT || 3001;
  httpServer.listen(PORT, () => {
    console.log(`MediaSoup Socket.IO server running on port ${PORT}`);
  });
});
