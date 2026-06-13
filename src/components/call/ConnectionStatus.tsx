import { ConnectionState } from "@/hooks/useMediaSoup";
import { Loader2, Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus({ state }: { state: ConnectionState }) {
  if (state === "connecting") {
    return (
      <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-full">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-wider">Connecting</span>
      </div>
    );
  }
  
  if (state === "connected") {
    return (
      <div className="flex items-center gap-2 bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.1)]">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </div>
        <Wifi size={14} />
        <span className="text-xs font-semibold uppercase tracking-wider">Connected</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-full">
      <WifiOff size={14} />
      <span className="text-xs font-semibold uppercase tracking-wider">Disconnected</span>
    </div>
  );
}
