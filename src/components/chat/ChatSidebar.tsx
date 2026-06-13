"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { ChatMessage, IMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { MessageSquare } from "lucide-react";

interface ChatSidebarProps {
  sessionId: string;
  currentUserRole: "agent" | "customer";
  currentUserName: string;
}

export function ChatSidebar({ sessionId, currentUserRole, currentUserName }: ChatSidebarProps) {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    const fetchAndMergeHistory = async () => {
      try {
        const res = await fetch(`/api/messages/${sessionId}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(prev => {
            const merged = [...data.messages, ...prev];
            const unique = merged.filter((msg, index, self) =>
              index === self.findIndex((t) => (
                t.timestamp === msg.timestamp &&
                t.senderName === msg.senderName &&
                t.message === msg.message
              ))
            );
            return unique.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          });
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchAndMergeHistory();

    const handleReceiveMessage = (newMessage: IMessage) => {
      if (newMessage.sessionId === sessionId) {
        setMessages(prev => {
          const exists = prev.find((t) => 
            t.timestamp === newMessage.timestamp &&
            t.senderName === newMessage.senderName &&
            t.message === newMessage.message
          );
          if (exists) return prev;
          return [...prev, newMessage];
        });
      }
    };

    const handleConnect = () => {
      fetchAndMergeHistory();
    };

    const handleReceiveFile = (newFile: any) => {
      if (newFile.sessionId === sessionId) {
        setMessages(prev => {
          const exists = prev.find((t) => t._id === newFile._id);
          if (exists) return prev;
          // Normalize to IMessage format
          const fileMessage: IMessage = {
            _id: newFile._id,
            sessionId: newFile.sessionId,
            senderRole: newFile.senderRole,
            senderName: newFile.senderName,
            timestamp: newFile.uploadedAt,
            fileName: newFile.fileName,
            fileType: newFile.fileType,
            fileSize: newFile.fileSize,
            fileUrl: newFile.fileUrl
          };
          return [...prev, fileMessage];
        });
      }
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("receive-file", handleReceiveFile);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
      socket.off("receive-file", handleReceiveFile);
      socket.off("connect", handleConnect);
    };
  }, [sessionId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    
    // Send to socket
    socket.emit("send-message", {
      roomId: sessionId,
      senderRole: currentUserRole,
      senderName: currentUserName,
      message: text
    });
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    formData.append("senderRole", currentUserRole);
    formData.append("senderName", currentUserName);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Upload failed");
    }

    const data = await res.json();
    socket.emit("send-file", data.file);
  };

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col shrink-0">
      <div className="h-16 border-b border-border flex items-center px-4 gap-2 shrink-0 bg-card">
        <MessageSquare size={18} className="text-accent" />
        <h2 className="font-semibold text-foreground">Session Chat</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 mt-20">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-2">
              <MessageSquare size={24} className="text-gray-500" />
            </div>
            <p className="text-gray-400 font-medium">Chat is empty</p>
            <p className="text-sm text-gray-500 px-4">
              Messages sent during this session will appear here.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <ChatMessage 
              key={msg._id || i} 
              message={msg} 
              isMe={msg.senderName === currentUserName && msg.senderRole === currentUserRole} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-background/50">
        <ChatInput onSend={handleSendMessage} onFileUpload={handleFileUpload} />
      </div>
    </div>
  );
}
