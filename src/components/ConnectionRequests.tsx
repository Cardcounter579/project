import { useState, useEffect, useCallback } from "react";
import { ConnectionRequest } from "../types";
import { ARCHETYPES } from "../ml_artifacts";
import { Inbox, Send, Check, X, RefreshCw, Users } from "lucide-react";

interface ConnectionRequestsProps {
  token: string;
  onChanged: () => void;
}

export default function ConnectionRequests({ token, onChanged }: ConnectionRequestsProps) {
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/connections/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load requests.");
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRespond = async (fromUserId: string, action: "accept" | "reject") => {
    setRespondingId(fromUserId);
    try {
      const response = await fetch("/api/connections/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fromUserId, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to respond.");
      await fetchRequests();
      onChanged();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRespondingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <RefreshCw size={20} className="animate-spin mr-2" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Inbox size={18} className="text-indigo-400" />
            Connection Requests
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accept or decline incoming requests. Outgoing requests wait for a response.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition cursor-pointer"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-red-900/40 bg-red-950/20 text-xs text-red-300">
          {error}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Inbox size={12} />
          Incoming ({incoming.length})
        </h2>

        {incoming.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-800/60 bg-slate-950/30 text-center text-xs text-slate-500">
            No pending requests
          </div>
        ) : (
          <div className="space-y-2">
            {incoming.map((req) => {
              const arch = req.archetypeId ? ARCHETYPES[req.archetypeId] : null;
              const isResponding = respondingId === req.fromUserId;
              return (
                <div
                  key={req.fromUserId}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-950/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{req.displayName}</p>
                    <p className="text-[0.625rem] font-mono text-slate-500 mt-0.5">
                      {arch?.name || "Developer"} · {req.zodiacSign || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRespond(req.fromUserId, "accept")}
                      disabled={isResponding}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono uppercase flex items-center gap-1 hover:bg-emerald-600/30 transition cursor-pointer disabled:opacity-50"
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      onClick={() => handleRespond(req.fromUserId, "reject")}
                      disabled={isResponding}
                      className="px-3 py-1.5 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-mono uppercase flex items-center gap-1 hover:bg-red-600/20 transition cursor-pointer disabled:opacity-50"
                    >
                      <X size={12} /> Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Send size={12} />
          Sent ({outgoing.length})
        </h2>

        {outgoing.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-800/60 bg-slate-950/30 text-center text-xs text-slate-500">
            No outgoing requests
          </div>
        ) : (
          <div className="space-y-2">
            {outgoing.map((req) => {
              const arch = req.archetypeId ? ARCHETYPES[req.archetypeId] : null;
              return (
                <div
                  key={req.toUserId}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-800/60 bg-slate-950/40"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100 truncate">{req.displayName}</p>
                    <p className="text-[0.625rem] font-mono text-slate-500 mt-0.5">
                      {arch?.name || "Developer"} · Waiting for response
                    </p>
                  </div>
                  <span className="text-[0.625rem] font-mono uppercase text-amber-400/80 bg-amber-950/20 border border-amber-900/30 px-2 py-1 rounded-lg shrink-0">
                    Pending
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="p-4 rounded-xl border border-slate-800/60 bg-slate-950/20 text-xs text-slate-400 flex items-start gap-2">
        <Users size={14} className="shrink-0 mt-0.5 text-slate-500" />
        <span>
          When you accept a request, both developers appear as connected on the compatibility map.
        </span>
      </section>
    </div>
  );
}
