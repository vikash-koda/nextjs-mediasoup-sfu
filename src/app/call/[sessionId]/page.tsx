"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, MessageSquare, ArrowRight } from "lucide-react";
import { useMediaSoup } from "@/hooks/useMediaSoup";
import { VideoPlayer } from "@/components/call/VideoPlayer";
import { CallControls } from "@/components/call/CallControls";
import { ConnectionStatus } from "@/components/call/ConnectionStatus";
import { ChatSidebar } from "@/components/chat/ChatSidebar";

export default function CallRoom({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [role, setRole] = useState<"agent" | "customer">("customer");
  const [name, setName] = useState<string>("Guest");

  useEffect(() => {
    setRole((sessionStorage.getItem('chatRole') as "agent" | "customer") || "customer");
    setName(sessionStorage.getItem('chatName') || "Guest");
  }, []);
  
  const { 
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
  } = useMediaSoup(sessionId);

  const handleEndCall = async () => {
    endCall();
    
    // Update session status in DB
    try {
      await fetch("/api/sessions/end", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
    } catch (e) {
      console.error("Failed to update session status on end call", e);
    }
    
    router.push("/agent");
  };

  const handleToggleScreenShare = () => {
    if (screenShareStream) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const activeScreenShare = screenShareStream || remoteScreenShareStream;

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden text-foreground">
      {/* Top Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-lg text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Video Support</h1>
          <span className="text-sm text-gray-500 font-mono ml-2 border border-border px-2 py-1 rounded bg-secondary">
            {sessionId}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ConnectionStatus state={connectionState} />
          <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-gray-400">
            <Users size={16} /> <span className="text-sm font-medium">{remoteStream ? '2' : '1'} Participant{remoteStream ? 's' : ''}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Video Area */}
        <div className="flex-1 p-6 flex flex-col gap-6 relative">
          
          {activeScreenShare ? (
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex-1 relative overflow-hidden rounded-2xl border-2 border-accent">
                <VideoPlayer stream={activeScreenShare} label="Screen Share" />
              </div>
              <div className="h-48 flex gap-4 shrink-0">
                <div className="flex-1 relative overflow-hidden rounded-2xl bg-card border border-border">
                  <VideoPlayer stream={remoteStream} label="Remote Participant" />
                </div>
                <div className="flex-1 relative overflow-hidden rounded-2xl bg-card border border-border">
                  <VideoPlayer stream={localStream} isLocal label="You" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 relative overflow-hidden rounded-2xl">
                <VideoPlayer stream={remoteStream} label="Remote Participant" />
              </div>

              <div className="absolute bottom-28 right-12 w-64 aspect-video bg-card rounded-xl border border-border shadow-2xl overflow-hidden z-30 transition-transform hover:scale-105 duration-300">
                <VideoPlayer stream={localStream} isLocal label="You" />
              </div>
            </>
          )}

          <CallControls 
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            isScreenSharing={!!screenShareStream}
            onToggleAudio={toggleAudio}
            onToggleVideo={toggleVideo}
            onToggleScreenShare={handleToggleScreenShare}
            onEndCall={handleEndCall}
          />
        </div>

        <ChatSidebar sessionId={sessionId} currentUserRole={role} currentUserName={name} />

      </div>
    </div>
  );
}
