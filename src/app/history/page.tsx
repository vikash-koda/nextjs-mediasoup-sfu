"use client";

import { useEffect, useState } from "react";
import { format, differenceInMinutes, differenceInSeconds } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Clock, MessageSquare } from "lucide-react";

interface SessionData {
  sessionId: string;
  token: string;
  customerName?: string;
  status: "waiting" | "active" | "ended";
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  totalMessages?: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        setHistory(data.sessions || []);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return "-";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const mins = differenceInMinutes(endDate, startDate);
    const secs = differenceInSeconds(endDate, startDate) % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen p-8 text-foreground">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4">
          <Link href="/agent" className="p-2 rounded-lg bg-secondary hover:bg-opacity-80 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Session History</h1>
            <p className="text-gray-400 mt-2">View details of all past and current sessions.</p>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-border flex items-center gap-2">
            <Clock className="text-accent" size={20} />
            <h2 className="text-xl font-semibold">All Sessions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/50 text-gray-400 text-sm">
                  <th className="p-4 font-medium">Session ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Created At</th>
                  <th className="p-4 font-medium">Started At</th>
                  <th className="p-4 font-medium">Ended At</th>
                  <th className="p-4 font-medium">Duration</th>
                  <th className="p-4 font-medium text-center">Messages</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">Loading history...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No session history found.</td></tr>
                ) : (
                  history.map((session) => (
                    <tr key={session.sessionId} className="border-b border-border hover:bg-secondary/20 transition text-sm">
                      <td className="p-4 font-mono text-xs text-gray-400">{session.sessionId}</td>
                      <td className="p-4 font-medium">{session.customerName || "-"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          session.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                          session.status === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {session.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-gray-400">{format(new Date(session.createdAt), "MMM d, h:mm a")}</td>
                      <td className="p-4 text-gray-400">{session.startedAt ? format(new Date(session.startedAt), "h:mm:ss a") : "-"}</td>
                      <td className="p-4 text-gray-400">{session.endedAt ? format(new Date(session.endedAt), "h:mm:ss a") : "-"}</td>
                      <td className="p-4 font-mono">{calculateDuration(session.startedAt, session.endedAt)}</td>
                      <td className="p-4 text-center font-bold">{session.totalMessages || 0}</td>
                      <td className="p-4 text-right">
                        <Link 
                          href={`/history/${session.sessionId}`}
                          className="px-3 py-1 bg-secondary hover:bg-opacity-80 text-white rounded text-xs transition inline-flex items-center gap-1"
                        >
                          <MessageSquare size={14} /> View Chat
                        </Link>
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
