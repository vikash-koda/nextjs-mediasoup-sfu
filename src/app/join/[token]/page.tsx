"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await fetch(`/api/sessions/${token}`);
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || "Invalid token");
        } else {
          setSession(data.session);
        }
      } catch (err) {
        setError("Failed to validate token");
      } finally {
        setLoading(false);
      }
    };
    
    validateToken();
  }, [token]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setJoining(true);
    try {
      const res = await fetch(`/api/sessions/${token}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName: name, status: "active" })
      });
      
      if (res.ok) {
        sessionStorage.setItem('chatRole', 'customer');
        sessionStorage.setItem('chatName', name);
        router.push(`/call/${session.sessionId}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join session");
        setJoining(false);
      }
    } catch (err) {
      setError("An error occurred");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center space-y-4 border-destructive/50">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-white">Invalid Session</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">Join Support Session</h1>
          <p className="text-gray-400 mt-2">Please enter your name to connect with an agent.</p>
        </div>
        
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-white focus:outline-none focus:ring-2 focus:ring-primary transition placeholder-gray-500"
              placeholder="John Doe"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={joining || !name.trim()}
            className="w-full py-3 rounded-lg bg-primary text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/30"
          >
            {joining ? (
              <><Loader2 className="animate-spin w-5 h-5" /> Connecting...</>
            ) : (
              <>Join Session <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
