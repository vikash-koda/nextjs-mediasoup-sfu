import { useEffect, useRef } from "react";
import { Users, User } from "lucide-react";

interface VideoPlayerProps {
  stream: MediaStream | null;
  isLocal?: boolean;
  label: string;
}

export function VideoPlayer({ stream, isLocal = false, label }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-secondary rounded-2xl overflow-hidden border border-border shadow-lg flex items-center justify-center">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-gray-500">
          {isLocal ? <User size={48} className="mb-2 opacity-50" /> : <Users size={64} className="mb-4 opacity-50" />}
          <p className="font-medium text-sm">Waiting for video...</p>
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-20">
        <span className="bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg text-sm font-medium border border-border shadow-sm">
          {label}
        </span>
      </div>
    </div>
  );
}
