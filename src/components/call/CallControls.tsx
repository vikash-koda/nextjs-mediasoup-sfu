import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, MonitorX } from "lucide-react";

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing?: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onEndCall: () => void;
}

export function CallControls({ isMuted, isVideoOff, isScreenSharing, onToggleAudio, onToggleVideo, onToggleScreenShare, onEndCall }: CallControlsProps) {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-card/90 backdrop-blur-md px-8 py-4 rounded-full border border-border shadow-2xl z-40 transition-all hover:bg-card">
      <button 
        onClick={onToggleAudio}
        className={`p-4 rounded-full transition-all duration-300 ${isMuted ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-secondary text-white hover:bg-secondary/80'}`}
        title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      
      <button 
        onClick={onToggleVideo}
        className={`p-4 rounded-full transition-all duration-300 ${isVideoOff ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-secondary text-white hover:bg-secondary/80'}`}
        title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
      >
        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
      </button>

      {onToggleScreenShare && (
        <button 
          onClick={onToggleScreenShare}
          className={`p-4 rounded-full transition-all duration-300 ${isScreenSharing ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-secondary text-white hover:bg-secondary/80'}`}
          title={isScreenSharing ? "Stop Sharing Screen" : "Share Screen"}
        >
          {isScreenSharing ? <MonitorX size={24} /> : <MonitorUp size={24} />}
        </button>
      )}
      
      <button 
        onClick={onEndCall}
        className="p-4 rounded-full bg-destructive text-white hover:bg-red-600 transition-all duration-300 shadow-lg shadow-destructive/20 ml-4"
        title="End Call"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
}
