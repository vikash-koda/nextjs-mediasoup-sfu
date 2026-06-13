"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Phone, MessageSquare, FileText, Loader2, AlertCircle, Eye, PowerOff, Activity } from "lucide-react";
import { format } from "date-fns";
import { getSocket } from "@/lib/socket";

interface SessionData {
  _id: string;
  sessionId: string;
  status: string;
  customerName?: string;
  createdAt: string;
  startedAt?: string;
  messageCount: number;
  fileCount: number;
}

interface AnalyticsData {
  totalSessions: number;
  activeSessions: number;
  activeCalls: number;
  totalMessages: number;
  totalSharedFiles: number;
  liveSessions: SessionData[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    const socket = getSocket();
    socket.emit("join-admin");
    socket.on("dashboard-update", fetchAnalytics);

    return () => {
      socket.off("dashboard-update", fetchAnalytics);
    };
  }, []);

  const handleEndSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to forcibly end this session?")) return;
    try {
      const socket = getSocket();
      socket.emit("admin-force-end-session", sessionId);
      // Let the socket server handle the DB update and broadcast
      fetchAnalytics();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-background flex-col gap-4 text-destructive">
      <AlertCircle className="w-12 h-12" />
      <p>{error}</p>
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary flex items-center gap-2">
              <Activity /> Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Live platform analytics and session monitoring.</p>
          </div>
          <Link href="/agent" className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/80 transition">
            Agent Portal
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400 font-medium">Active Sessions</p>
              <Users className="text-accent" size={20} />
            </div>
            <p className="text-3xl font-bold">{data?.activeSessions}</p>
          </div>
          
          <div className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400 font-medium">Active Calls</p>
              <Phone className="text-green-400" size={20} />
            </div>
            <p className="text-3xl font-bold">{data?.activeCalls}</p>
          </div>

          <div className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400 font-medium">Total Messages</p>
              <MessageSquare className="text-purple-400" size={20} />
            </div>
            <p className="text-3xl font-bold">{data?.totalMessages}</p>
          </div>

          <div className="glass-card p-6 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400 font-medium">Total Shared Files</p>
              <FileText className="text-orange-400" size={20} />
            </div>
            <p className="text-3xl font-bold">{data?.totalSharedFiles}</p>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-border bg-secondary/30">
            <h2 className="text-xl font-semibold">Live Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-secondary/20 text-gray-400 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Session ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Started</th>
                  <th className="px-6 py-4 font-medium">Messages</th>
                  <th className="px-6 py-4 font-medium">Files</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data?.liveSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No active sessions currently.
                    </td>
                  </tr>
                ) : (
                  data?.liveSessions.map((session) => (
                    <tr key={session._id} className="hover:bg-secondary/20 transition group">
                      <td className="px-6 py-4 text-sm font-mono text-gray-300">
                        {session.sessionId.substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {session.customerName || <span className="text-gray-500 italic">Waiting...</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          session.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {session.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {format(new Date(session.createdAt), "h:mm a")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {session.messageCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {session.fileCount}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link href={`/admin/session/${session.sessionId}`} className="inline-flex p-2 text-gray-400 hover:text-white hover:bg-secondary rounded-md transition" title="View Details">
                          <Eye size={18} />
                        </Link>
                        <button onClick={() => handleEndSession(session.sessionId)} className="inline-flex p-2 text-gray-400 hover:text-destructive hover:bg-destructive/10 rounded-md transition" title="Force End">
                          <PowerOff size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
