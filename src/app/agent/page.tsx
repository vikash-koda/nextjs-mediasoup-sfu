"use client";

import { useEffect, useState } from "react";
import { Copy, PhoneCall, Trash2, Plus, RefreshCw, CheckCircle, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface SessionData {
  sessionId: string;
  token: string;
  customerName?: string;
  status: "waiting" | "active" | "ended";
  createdAt: string;
}

export default function AgentDashboard() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [history, setHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, historyRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/history")
      ]);
      const sessionsData = await sessionsRes.json();
      const historyData = await historyRes.json();
      setSessions(sessionsData.sessions || []);
      setHistory(historyData.sessions || []);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createSession = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to create session", error);
    } finally {
      setCreating(false);
    }
  };

  const endSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/sessions/end", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to end session", error);
    }
  };

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/join/${token}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        alert("Invite link copied to clipboard!");
      }).catch(err => {
        console.error("Failed to copy", err);
      });
    } else {
      // Fallback for insecure HTTP contexts
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert("Invite link copied to clipboard!");
      } catch (err) {
        console.error('Fallback copy failed', err);
        alert(`Please copy this link manually: ${link}`);
      }
      document.body.removeChild(textArea);
    }
  };

  const activeSessions = history.filter(s => s.status !== "ended").length;
  const endedSessions = history.filter(s => s.status === "ended").length;
  const totalSessions = history.length;

  return (
    <div className="min-h-screen p-8 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Agent Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage your active video support sessions.</p>
          </div>
          <div className="flex gap-4">
            <Link href="/admin" className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/40 transition flex items-center gap-2">
              <Users size={18} /> Admin
            </Link>
            <Link href="/history" className="px-4 py-2 rounded-lg bg-secondary text-white hover:bg-opacity-80 transition flex items-center gap-2">
              <Clock size={18} /> History
            </Link>
            <button 
              onClick={fetchData}
              className="p-2 rounded-lg bg-secondary text-white hover:bg-opacity-80 transition"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={createSession}
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              <Plus size={20} /> Create Session
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-primary/20 rounded-full text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active & Waiting</p>
              <p className="text-2xl font-bold">{activeSessions}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-accent/20 rounded-full text-accent">
              <PhoneCall size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Sessions</p>
              <p className="text-2xl font-bold">{totalSessions}</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
            <div className="p-4 bg-secondary rounded-full text-gray-400">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Ended Sessions</p>
              <p className="text-2xl font-bold">{endedSessions}</p>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-semibold">Active & Waiting Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 text-gray-400 text-sm">
                  <th className="p-4 font-medium">Session ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Created Time</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No active sessions. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  sessions.map((session) => (
                    <tr key={session.sessionId} className="border-b border-border hover:bg-secondary/20 transition">
                      <td className="p-4 font-mono text-sm">{session.sessionId.substring(0, 8)}...</td>
                      <td className="p-4">{session.customerName || <span className="text-gray-500 italic">Waiting to join</span>}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                          session.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {session.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-400">
                        {format(new Date(session.createdAt), "MMM d, h:mm a")}
                      </td>
                      <td className="p-4 flex items-center justify-end gap-2">
                        <button 
                          onClick={() => copyLink(session.token)}
                          className="p-2 rounded-md bg-secondary hover:bg-secondary/80 text-white transition tooltip-trigger"
                          title="Copy Invite Link"
                        >
                          <Copy size={16} />
                        </button>
                        <Link 
                          href={`/call/${session.sessionId}`}
                          onClick={() => {
                            sessionStorage.setItem('chatRole', 'agent');
                            sessionStorage.setItem('chatName', 'Support Agent');
                          }}
                          className="p-2 rounded-md bg-primary hover:bg-blue-700 text-white transition tooltip-trigger"
                          title="Open Call Room"
                        >
                          <PhoneCall size={16} />
                        </Link>
                        <button 
                          onClick={() => endSession(session.sessionId)}
                          className="p-2 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-400 transition tooltip-trigger"
                          title="End Session"
                        >
                          <Trash2 size={16} />
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
