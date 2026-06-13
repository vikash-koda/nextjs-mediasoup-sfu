"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Loader2, AlertCircle, Paperclip, Download, FileText } from "lucide-react";
import { format } from "date-fns";

interface IMessage {
  _id: string;
  senderRole: "agent" | "customer";
  senderName: string;
  message?: string;
  timestamp: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileUrl?: string;
}

export default function SessionChatHistory({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/messages/${sessionId}`);
        const data = await res.json();
        if (res.ok) {
          setMessages(data.messages || []);
        } else {
          setError(data.error || "Failed to load chat history");
        }
      } catch (err) {
        setError("Failed to fetch chat history");
      } finally {
        setLoading(false);
      }
    };
    fetchChat();
  }, [sessionId]);

  const sharedFiles = messages.filter(m => m.fileUrl);

  return (
    <div className="min-h-screen p-8 text-foreground bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/history" className="p-2 rounded-lg bg-secondary hover:bg-opacity-80 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Chat Transcript</h1>
            <p className="text-gray-400 mt-1 font-mono text-sm">Session: {sessionId}</p>
          </div>
        </div>

        <div className="glass-card overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/30">
            <div className="flex items-center gap-2">
              <MessageSquare className="text-accent" size={20} />
              <h2 className="text-xl font-semibold">Message History</h2>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="px-3 py-1 rounded bg-primary/20 text-primary border border-primary/30">
                Agent: {messages.find(m => m.senderRole === 'agent')?.senderName || 'Support Agent'}
              </div>
              <div className="px-3 py-1 rounded bg-secondary text-gray-300 border border-border">
                Customer: {messages.find(m => m.senderRole === 'customer')?.senderName || 'Unknown'}
              </div>
              <div className="text-sm font-medium bg-secondary px-3 py-1 rounded-full text-gray-300 ml-4">
                {messages.length} Messages
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 text-destructive space-y-4">
                <AlertCircle size={48} />
                <p>{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
                <MessageSquare size={48} />
                <p>No messages were sent during this session.</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isAgent = msg.senderRole === 'agent';
                const isFile = !!msg.fileUrl;
                const isImage = msg.fileType?.startsWith("image/");
                
                return (
                  <div key={msg._id || i} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-gray-500 mb-1 px-1">
                      {msg.senderName} ({msg.senderRole}) • {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                    </span>
                    {isFile ? (
                      <div className={`p-1 rounded-lg max-w-[80%] border shadow-md ${
                        isAgent ? "bg-primary/10 border-primary/20 rounded-br-none" : "bg-secondary border-border rounded-bl-none"
                      }`}>
                        {isImage ? (
                          <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md cursor-zoom-in">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.fileUrl} alt={msg.fileName} className="max-h-48 object-cover hover:opacity-90 transition" />
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 p-3">
                            <div className="p-2 bg-background rounded-md text-accent">
                              {msg.fileType === "application/pdf" ? <FileText size={24} /> : <Download size={24} />}
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className="text-sm font-medium text-foreground truncate" title={msg.fileName}>{msg.fileName}</p>
                            </div>
                            <a href={msg.fileUrl} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-background text-gray-400 hover:text-white transition" title="Download">
                              <Download size={18} />
                            </a>
                          </div>
                        )}
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

        {sharedFiles.length > 0 && (
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border flex items-center gap-2 bg-secondary/30">
              <Paperclip className="text-accent" size={20} />
              <h2 className="text-xl font-semibold">Shared Files</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {sharedFiles.map((file, i) => (
                <div key={file._id || i} className="flex items-center gap-4 p-4 rounded-lg bg-secondary border border-border hover:bg-secondary/80 transition">
                  <div className="p-3 bg-background rounded-md text-accent shrink-0">
                    {file.fileType?.startsWith("image/") ? <FileText size={24} /> : file.fileType === "application/pdf" ? <FileText size={24} /> : <Paperclip size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">Uploaded by {file.senderName} • {format(new Date(file.timestamp), "MMM d, h:mm a")}</p>
                  </div>
                  <a href={file.fileUrl} target="_blank" rel="noreferrer" className="shrink-0 p-2 bg-primary hover:bg-blue-600 text-white rounded-md transition text-sm font-medium">
                    {file.fileType?.startsWith("image/") ? "Preview" : "Open"}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
