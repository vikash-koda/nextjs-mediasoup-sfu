import { useEffect, useRef, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import * as mediasoupClient from "mediasoup-client";

export type ConnectionState = "connecting" | "connected" | "disconnected" | "failed";

export const useMediaSoup = (roomId: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [remoteScreenShareStream, setRemoteScreenShareStream] = useState<MediaStream | null>(null);

  const deviceRef = useRef<mediasoupClient.Device | null>(null);
  const sendTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  const recvTransportRef = useRef<mediasoupClient.types.Transport | null>(null);
  
  const producersRef = useRef<Map<string, mediasoupClient.types.Producer>>(new Map());
  const consumersRef = useRef<Map<string, mediasoupClient.types.Consumer>>(new Map());

  const screenProducerRef = useRef<mediasoupClient.types.Producer | null>(null);

  const remoteStreamRef = useRef(new MediaStream());
  const remoteScreenStreamRef = useRef(new MediaStream());
  const socket = getSocket();

  const producerQueue = useRef<{producerId: string, appData?: any}[]>([]);
  const isRecvReady = useRef(false);

  const loadDevice = async (routerRtpCapabilities: any) => {
    try {
      const device = new mediasoupClient.Device();
      await device.load({ routerRtpCapabilities });
      deviceRef.current = device;
      return device;
    } catch (error) {
      console.error("Failed to load device", error);
      throw error;
    }
  };

  const consume = useCallback(async (producerId: string, appData?: any) => {
    const device = deviceRef.current;
    const recvTransport = recvTransportRef.current;
    if (!device || !recvTransport) return;

    socket.emit("consume", { roomId, producerId, rtpCapabilities: device.rtpCapabilities }, async ({ params, error }: any) => {
      if (error) return console.error("Consume error:", error);
      
      const consumer = await recvTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters,
        appData
      });

      consumersRef.current.set(consumer.id, consumer);
      
      if (appData?.source === 'screen') {
        remoteScreenStreamRef.current.addTrack(consumer.track);
        setRemoteScreenShareStream(new MediaStream(remoteScreenStreamRef.current.getTracks()));
      } else {
        remoteStreamRef.current.addTrack(consumer.track);
        setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
      }
      
      socket.emit("resume", { roomId, consumerId: consumer.id }, () => {});
    });
  }, [roomId, socket]);

  const processQueue = useCallback(() => {
    while (producerQueue.current.length > 0) {
      const item = producerQueue.current.shift();
      if (item) consume(item.producerId, item.appData);
    }
  }, [consume]);

  const initTransports = async (device: mediasoupClient.Device) => {
    // Send Transport
    socket.emit("createWebRtcTransport", { roomId, direction: "send" }, async ({ params, error }: any) => {
      if (error) return console.error(error);
      const transport = device.createSendTransport(params);
      
      transport.on("connect", ({ dtlsParameters }, callback, errback) => {
        socket.emit("connectWebRtcTransport", { roomId, transportId: transport.id, dtlsParameters }, ({ error }: any) => {
          if (error) errback(error);
          else callback();
        });
      });

      transport.on("produce", async ({ kind, rtpParameters, appData }, callback, errback) => {
        socket.emit("produce", { roomId, transportId: transport.id, kind, rtpParameters, appData }, ({ id, error }: any) => {
          if (error) errback(error);
          else callback({ id });
        });
      });

      sendTransportRef.current = transport;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          const videoProducer = await transport.produce({ track: videoTrack });
          producersRef.current.set(videoProducer.id, videoProducer);
        }
        if (audioTrack) {
          const audioProducer = await transport.produce({ track: audioTrack });
          producersRef.current.set(audioProducer.id, audioProducer);
        }
      } catch (err) {
        console.error("Failed to get local stream", err);
      }
    });

    // Recv Transport
    socket.emit("createWebRtcTransport", { roomId, direction: "recv" }, async ({ params, error }: any) => {
      if (error) return console.error(error);
      const transport = device.createRecvTransport(params);
      
      transport.on("connect", ({ dtlsParameters }, callback, errback) => {
        socket.emit("connectWebRtcTransport", { roomId, transportId: transport.id, dtlsParameters }, ({ error }: any) => {
          if (error) errback(error);
          else callback();
        });
      });

      recvTransportRef.current = transport;
      isRecvReady.current = true;
      processQueue();
    });
  };

  useEffect(() => {
    socket.emit("join-room", { roomId }, async ({ rtpCapabilities }: any) => {
      const device = await loadDevice(rtpCapabilities);
      await initTransports(device);
      setConnectionState("connected");
    });

    socket.on("new-producer", ({ producerId, appData }) => {
      if (isRecvReady.current) {
        consume(producerId, appData);
      } else {
        producerQueue.current.push({ producerId, appData } as any);
      }
    });

    socket.on("producer-closed", ({ producerId }) => {
      for (const [id, consumer] of consumersRef.current.entries()) {
        if (consumer.producerId === producerId) {
          if (consumer.appData?.source === 'screen') {
            remoteScreenStreamRef.current.removeTrack(consumer.track);
            const tracks = remoteScreenStreamRef.current.getTracks();
            setRemoteScreenShareStream(tracks.length > 0 ? new MediaStream(tracks) : null);
          } else {
            remoteStreamRef.current.removeTrack(consumer.track);
            const tracks = remoteStreamRef.current.getTracks();
            setRemoteStream(tracks.length > 0 ? new MediaStream(tracks) : null);
          }
          consumersRef.current.delete(id);
          break;
        }
      }
    });

    socket.on("end-call", () => {
      setConnectionState("disconnected");
      cleanup();
    });

    socket.on("peer-closed", () => {
      remoteStreamRef.current.getTracks().forEach(track => remoteStreamRef.current.removeTrack(track));
      setRemoteStream(null);
      remoteScreenStreamRef.current.getTracks().forEach(track => remoteScreenStreamRef.current.removeTrack(track));
      setRemoteScreenShareStream(null);
    });

    socket.on("session-force-ended", () => {
      setConnectionState("disconnected");
      cleanup();
      alert("Session ended by administrator");
      window.location.href = "/";
    });

    return () => {
      socket.emit("leave-room", { roomId });
      cleanup();
    };
  }, [roomId, consume, processQueue, socket]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!localStream.getAudioTracks()[0]?.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!localStream.getVideoTracks()[0]?.enabled);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenShareStream(stream);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && sendTransportRef.current) {
        const producer = await sendTransportRef.current.produce({ track: videoTrack, appData: { source: 'screen' } });
        screenProducerRef.current = producer;

        videoTrack.onended = () => {
          stopScreenShare();
        };
        
        socket.emit("start-screen-share", roomId);
      }
    } catch (err) {
      console.error("Screen share failed", err);
    }
  };

  const stopScreenShare = () => {
    if (screenProducerRef.current) {
      screenProducerRef.current.close();
      socket.emit("close-producer", { roomId, producerId: screenProducerRef.current.id });
      screenProducerRef.current = null;
    }
    if (screenShareStream) {
      screenShareStream.getTracks().forEach(track => track.stop());
      setScreenShareStream(null);
    }
    socket.emit("stop-screen-share", roomId);
  };

  const endCall = () => {
    stopScreenShare();
    socket.emit("end-call", { roomId });
    cleanup();
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    sendTransportRef.current?.close();
    recvTransportRef.current?.close();
    isRecvReady.current = false;
    socket.off("new-producer");
    socket.off("producer-closed");
    socket.off("end-call");
    socket.off("peer-closed");
    socket.off("session-force-ended");
    socket.off("screen-share-started");
    socket.off("screen-share-stopped");
  };

  return {
    localStream,
    remoteStream,
    screenShareStream,
    remoteScreenShareStream,
    connectionState,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    endCall
  };
};
