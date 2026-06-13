"use client";

import { useRouter } from "next/navigation";
import { UserCog, Users, ShieldAlert, CheckCircle2, Server, MessageSquare, FileText, ShieldCheck, MonitorPlay, Zap } from "lucide-react";

export default function JudgePortal() {
  const router = useRouter();

  const handleSwitchRole = (role: "agent" | "customer", redirectPath: string) => {
    // Clear old state just in case
    sessionStorage.clear();
    
    // Set new role
    sessionStorage.setItem("role", role);
    document.cookie = `role=${role}; path=/`;

    // Redirect
    router.push(redirectPath);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-4xl w-full space-y-12 z-10">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary drop-shadow-sm">
            Judge Access Portal
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Welcome to the AtomQuest Hackathon Demo. Select a role below to instantly authenticate and explore the platform.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Agent Card */}
          <button 
            onClick={() => handleSwitchRole("agent", "/agent")}
            className="group glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
              <UserCog size={40} />
            </div>
            <h2 className="text-2xl font-bold">Support Agent</h2>
            <p className="text-gray-400 text-sm flex-1">
              Create video sessions, generate invite links, and assist customers in real-time.
            </p>
            <span className="text-primary text-sm font-medium pt-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              Launch Portal &rarr;
            </span>
          </button>

          {/* Customer Card */}
          <button 
            onClick={() => handleSwitchRole("customer", "/")}
            className="group glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-accent/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-4 bg-accent/10 rounded-full text-accent group-hover:scale-110 transition-transform">
              <Users size={40} />
            </div>
            <h2 className="text-2xl font-bold">Customer</h2>
            <p className="text-gray-400 text-sm flex-1">
              Access the waiting room and join active support calls using an invite link.
            </p>
            <span className="text-accent text-sm font-medium pt-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              Launch Portal &rarr;
            </span>
          </button>

          {/* Admin Card */}
          <button 
            onClick={() => handleSwitchRole("agent", "/admin")}
            className="group glass-card p-8 flex flex-col items-center text-center space-y-4 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-4 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform">
              <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-bold">Administrator</h2>
            <p className="text-gray-400 text-sm flex-1">
              View real-time system analytics, live sessions, and force-terminate calls.
            </p>
            <span className="text-primary text-sm font-medium pt-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              Launch Portal &rarr;
            </span>
          </button>

        </div>

        {/* Instructions */}
        <div className="glass-card p-8 mt-12 bg-secondary/20">
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-primary" /> Suggested Evaluation Flow
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-gray-500 font-mono">STEP 1</div>
              <div className="font-medium">Click "Support Agent"</div>
              <p className="text-sm text-gray-400">Launch the Agent portal to start your journey.</p>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 font-mono">STEP 2</div>
              <div className="font-medium">Create a Session</div>
              <p className="text-sm text-gray-400">Generate a unique WebRTC session token.</p>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 font-mono">STEP 3</div>
              <div className="font-medium">Copy Invite Link</div>
              <p className="text-sm text-gray-400">
                For the best test, open the link on a <strong>Mobile Device</strong> connected to the same Wi-Fi using your laptop's local IP address (e.g., <code className="bg-background px-1 py-0.5 rounded text-accent">http://192.168.x.x:3000</code>). 
                <em>Note: Hardware cameras often block dual-access from multiple tabs on the same computer.</em>
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 font-mono">STEP 4</div>
              <div className="font-medium">Join as Customer</div>
              <p className="text-sm text-gray-400">Enter your name and join the active call room.</p>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 font-mono">STEP 5</div>
              <div className="font-medium">Test Real-Time Features</div>
              <p className="text-sm text-gray-400">Test Video, Audio, Chat, and File Uploads seamlessly.</p>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 font-mono">STEP 6</div>
              <div className="font-medium">Open Admin Dashboard</div>
              <p className="text-sm text-gray-400">Switch to Administrator and force-end the active session.</p>
            </div>
          </div>
        </div>

        {/* Architecture Highlight */}
        <div className="glass-card p-8 mt-6 bg-primary/5 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
          <h3 className="text-2xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
            Enterprise-Grade Custom Architecture
          </h3>
          <p className="text-gray-400 mb-6 max-w-3xl">
            This project does <strong>not</strong> rely on simple P2P WebRTC or third-party managed video services like Twilio. It features a fully custom-built backend infrastructure capable of handling scalable enterprise workloads.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border transition-all hover:bg-secondary/50">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><Server size={24}/></div>
              <div>
                <h4 className="font-bold text-white mb-1">Custom SFU Server</h4>
                <p className="text-xs text-gray-400">MediaSoup handles WebRTC Selective Forwarding, exactly like Zoom and Google Meet, allowing for scalable multi-party video.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border transition-all hover:bg-secondary/50">
              <div className="p-3 bg-accent/10 rounded-lg text-accent"><MessageSquare size={24}/></div>
              <div>
                <h4 className="font-bold text-white mb-1">Custom Signaling</h4>
                <p className="text-xs text-gray-400">Socket.IO powers the real-time handshakes, instant chat messaging, and global dashboard analytics.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border transition-all hover:bg-secondary/50">
              <div className="p-3 bg-primary/20 rounded-lg text-primary"><FileText size={24}/></div>
              <div>
                <h4 className="font-bold text-white mb-1">Cloud Persistence</h4>
                <p className="text-xs text-gray-400">MongoDB seamlessly stores all chat history and analytics, while Cloudinary powers the persistent file sharing.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border transition-all hover:bg-secondary/50">
              <div className="p-3 bg-accent/20 rounded-lg text-accent"><ShieldCheck size={24}/></div>
              <div>
                <h4 className="font-bold text-white mb-1">Role-Based Security</h4>
                <p className="text-xs text-gray-400">Next.js Edge Middleware dynamically intercepts and blocks unauthorized routing based on strict persona guards.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border transition-all hover:bg-secondary/50">
              <div className="p-3 bg-primary/10 rounded-lg text-primary"><MonitorPlay size={24}/></div>
              <div>
                <h4 className="font-bold text-white mb-1">Multi-Track Pipelines</h4>
                <p className="text-xs text-gray-400">Simultaneous video and screen-share pipelines are cleanly segregated via WebRTC appData headers.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border transition-all hover:bg-secondary/50">
              <div className="p-3 bg-accent/10 rounded-lg text-accent"><Zap size={24}/></div>
              <div>
                <h4 className="font-bold text-white mb-1">Real-Time Dashboards</h4>
                <p className="text-xs text-gray-400">MongoDB $lookup aggregations combined with Socket.IO global broadcasts ensure zero-latency analytics.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
