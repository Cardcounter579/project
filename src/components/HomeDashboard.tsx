import { useState, useEffect, useCallback } from "react";
import { Profile, ConnectedPeer, ConnectionRequest } from "../types";
import { ARCHETYPES } from "../ml_artifacts";
import {
  Home,
  Users,
  Inbox,
  Send,
  MessageCircle,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

interface HomeDashboardProps {
  token: string;
  profile: Profile;
  refreshKey: number;
  onFindMatches: () => void;
  onOpenChat: (userId: string) => void;
  onOpenRequests: () => void;
}

export default function HomeDashboard({
  token,
  profile,
  refreshKey,
  onFindMatches,
  onOpenChat,
  onOpenRequests,
}: HomeDashboardProps) {
  const [connections, setConnections] = useState<ConnectedPeer[]>([]);
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([]);
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [connRes, reqRes] = await Promise.all([
        fetch("/api/connections", { headers }),
        fetch("/api/connections/requests", { headers }),
      ]);
      const connData = await connRes.json();
      const reqData = await reqRes.json();
      if (connRes.ok) setConnections(connData.connections || []);
      if (reqRes.ok) {
        setIncoming(reqData.incoming || []);
        setOutgoing(reqData.outgoing || []);
      }
    } catch (e) {
      console.error("Home dashboard load failed:", e);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const myType = ARCHETYPES[profile.archetypeId];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Home size={20} className="text-indigo-400" />
            Hello, {profile.displayName}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {myType
              ? `${myType.simpleLabel} · ${myType.name}`
              : "Your developer hub"}
          </p>
        </div>
        <button
          onClick={onFindMatches}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition shadow-[0_4px_16px_rgba(99,102,241,0.25)]"
        >
          <Sparkles size={16} />
          Find new developers
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Connected",
            value: connections.length,
            icon: Users,
            color: "text-emerald-400",
          },
          {
            label: "Incoming",
            value: incoming.length,
            icon: Inbox,
            color: "text-indigo-400",
          },
          {
            label: "Sent",
            value: outgoing.length,
            icon: Send,
            color: "text-amber-400",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-center"
          >
            <stat.icon size={16} className={`mx-auto mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected developers */}
        <section className="rounded-2xl border border-slate-800/60 bg-slate-900/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Users size={16} className="text-emerald-400" />
              My connections ({connections.length})
            </h2>
            <button
              onClick={load}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              Loading...
            </p>
          ) : connections.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-slate-500">No connections yet.</p>
              <button
                onClick={onFindMatches}
                className="text-sm text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Browse the map to connect
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((peer) => {
                const arch = peer.archetypeId
                  ? ARCHETYPES[peer.archetypeId]
                  : null;
                return (
                  <div
                    key={peer.userId}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/50 bg-slate-950/30"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {peer.displayName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {arch?.simpleLabel || "Developer"}
                        {peer.lastMessage &&
                          ` · ${peer.lastMessage.text.slice(0, 40)}...`}
                      </p>
                    </div>
                    <button
                      onClick={() => onOpenChat(peer.userId)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs flex items-center gap-1 hover:bg-indigo-600/30 cursor-pointer transition"
                    >
                      <MessageCircle size={12} /> Chat
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Requests preview */}
        <section className="rounded-2xl border border-slate-800/60 bg-slate-900/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Inbox size={16} className="text-indigo-400" />
              Requests
            </h2>
            {(incoming.length > 0 || outgoing.length > 0) && (
              <button
                onClick={onOpenRequests}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
              >
                View all <ChevronRight size={12} />
              </button>
            )}
          </div>

          {incoming.length === 0 && outgoing.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No pending requests.
            </p>
          ) : (
            <div className="space-y-4">
              {incoming.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Incoming ({incoming.length})
                  </p>
                  {incoming.slice(0, 3).map((req) => (
                    <button
                      key={req.fromUserId}
                      onClick={onOpenRequests}
                      className="w-full text-left p-3 rounded-xl border border-indigo-900/40 bg-indigo-950/20 hover:bg-indigo-950/30 transition cursor-pointer"
                    >
                      <p className="text-sm font-medium text-slate-100">
                        {req.displayName}
                      </p>
                      <p className="text-xs text-indigo-400 mt-0.5">
                        Tap to accept or decline
                      </p>
                    </button>
                  ))}
                </div>
              )}
              {outgoing.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">
                    Sent ({outgoing.length})
                  </p>
                  {outgoing.slice(0, 3).map((req) => (
                    <div
                      key={req.toUserId}
                      className="p-3 rounded-xl border border-slate-800/50 bg-slate-950/30"
                    >
                      <p className="text-sm font-medium text-slate-100">
                        {req.displayName}
                      </p>
                      <p className="text-xs text-amber-400/80 mt-0.5">
                        Waiting for response
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
