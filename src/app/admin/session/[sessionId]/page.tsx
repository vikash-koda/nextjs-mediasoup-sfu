"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Users, MessageSquare, FileText, Loader2, AlertCircle, Video, PowerOff, ShieldAlert, Activity, MonitorUp } from "lucide-react";
import { format, differenceInMinutes, differenceInSeconds } from "date-fns";
import { getSocket } from "@/lib/socket";

interface SessionDetails {
  session: {
    sessionId: string;
    status: string;
    customerName?: string;
    createdAt: string;
    startedAt?: string;
    endedAt?: string;
  };
  messageCount: number;
  fileCount: number;
}

interface IMessage {
  _id: string;
  senderRole: "agent" | "customer" | "system";
  senderName: string;
  message?: string;
  timestamp: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
}

export default function AdminSessionDetails({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [detailsRes, chatRes] = await Promise.all([
        fetch(`/api/admin/session/${sessionId}`),
        fetch(`/api/messages/${sessionId}`)
      ]);

      if (!detailsRes.ok) throw new Error("Failed to load session details");
      const detailsData = await detailsRes.json();
      setDetails(detailsData);

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setMessages(chatData.messages || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const socket = getSocket();
    socket.emit("join-admin");
    socket.on("dashboard-update", fetchData);

    return () => {
      socket.off("dashboard-update", fetchData);
    };
  }, [sessionId]);

  const handleEndSession = async () => {
    if (!confirm("Are you sure you want to forcibly end this session?")) return;
    try {
      const socket = getSocket();
      socket.emit("admin-force-end-session", sessionId);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error || !details) return (
    <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4 text-destructive">
      <AlertCircle className="w-12 h-12" />
      <p>{error || "Session not found"}</p>
    </div>
  );

  const { session, messageCount, fileCount } = details;

  const durationStr = () => {
    if (!session.startedAt) return "Not started";
    const end = session.endedAt ? new Date(session.endedAt) : new Date();
    const start = new Date(session.startedAt);
    const mins = differenceInMinutes(end, start);
    const secs = differenceInSeconds(end, start) % 60;
    return `${mins}m ${secs}s`;
  };

  const sharedFiles = messages.filter(m => m.fileUrl);

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 rounded-lg bg-secondary hover:bg-opacity-80 transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary flex items-center gap-2">
                Session Overview
              </h1>
              <p className="text-gray-400 mt-1 font-mono text-sm">{sessionId}</p>
            </div>
          </div>
          {session.status !== 'ended' && (
            <button onClick={handleEndSession} className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md hover:bg-destructive hover:text-white transition flex items-center gap-2">
              <PowerOff size={18} /> Force End Session
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <ShieldAlert className="text-accent" size={20} />
                <h2 className="text-xl font-semibold">Metadata</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2"><Clock size={16}/> Status</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    session.status === 'active' ? 'bg-green-500/10 text-green-400' : 
                    session.status === 'ended' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {session.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2"><Users size={16}/> Customer</span>
                  <span className="font-medium">{session.customerName || 'Waiting...'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2"><Clock size={16}/> Created</span>
                  <span className="font-medium text-sm">{format(new Date(session.createdAt), "MMM d, h:mm:ss a")}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-2"><Clock size={16}/> Duration</span>
                  <span className="font-medium text-sm font-mono">{durationStr()}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Activity className="text-accent" size={20} />
                <h2 className="text-xl font-semibold">Stats</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <MessageSquare className="mx-auto mb-2 text-purple-400" size={24} />
                  <p className="text-2xl font-bold">{messageCount}</p>
                  <p className="text-xs text-gray-400">Messages</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <FileText className="mx-auto mb-2 text-orange-400" size={24} />
                  <p className="text-2xl font-bold">{fileCount}</p>
                  <p className="text-xs text-gray-400">Shared Files</p>
                </div>
                {messages.filter(m => m.senderRole === 'system' && m.message?.includes('sharing their screen')).pop()?.message?.includes('started') ? (
                  <div className="col-span-2 p-4 bg-accent/20 rounded-lg text-center border border-accent/30 animate-pulse">
                    <MonitorUp className="mx-auto mb-2 text-accent" size={24} />
                    <p className="text-lg font-medium text-accent">Screen Sharing Active</p>
                    <p className="text-xs text-accent/70">A participant is currently sharing their screen</p>
                  </div>
                ) : (
                  <div className="col-span-2 p-4 bg-secondary/30 rounded-lg text-center">
                    <Video className="mx-auto mb-2 text-blue-400" size={24} />
                    <p className="text-lg font-medium text-gray-300">Recording Disabled</p>
                    <p className="text-xs text-gray-500">Video not recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 glass-card overflow-hidden flex flex-col h-[800px]">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center gap-2">
              <MessageSquare className="text-accent" size={20} />
              <h2 className="text-xl font-semibold">Live Transcript</h2>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-gray-500 italic">
                  No messages recorded yet.
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isAgent = msg.senderRole === 'agent';
                  const isSystem = msg.senderRole === 'system';
                  const isFile = !!msg.fileUrl;
                  
                  if (isSystem) {
                    return (
                      <div key={msg._id || i} className="flex justify-center my-2">
                        <span className="bg-secondary/50 text-gray-400 text-xs px-3 py-1 rounded-full text-center">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg._id || i} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-gray-500 mb-1 px-1">
                        {msg.senderName} ({msg.senderRole}) • {format(new Date(msg.timestamp), "h:mm:ss a")}
                      </span>
                      {isFile ? (
                        <div className={`px-4 py-2 rounded-lg max-w-[80%] text-sm shadow-md border ${
                          isAgent ? "bg-primary/20 border-primary/30" : "bg-secondary border-border"
                        }`}>
                          📎 <strong>{msg.fileName}</strong> uploaded.
                          <br/>
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline text-xs mt-1 inline-block">View File</a>
                        </div>
                      ) : (
                        <div className={`px-4 py-3 rounded-lg max-w-[80%] text-sm shadow-md ${
                          isAgent ? "bg-primary text-white rounded-br-none" : "bg-secondary text-gray-200 rounded-bl-none"
                        }`}>
                          {msg.message}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
