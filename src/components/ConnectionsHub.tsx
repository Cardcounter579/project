import { useState, useEffect, useCallback, useRef, FormEvent } from "react";
import { ConnectedPeer, Message } from "../types";
import { ARCHETYPES } from "../ml_artifacts";
import { MessageCircle, Send, Users, RefreshCw } from "lucide-react";

interface ConnectionsHubProps {
  token: string;
  currentUserId: string;
  initialChatUserId?: string | null;
  onInitialChatConsumed?: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ConnectionsHub({
  token,
  currentUserId,
  initialChatUserId,
  onInitialChatConsumed,
}: ConnectionsHubProps) {
  const [peers, setPeers] = useState<ConnectedPeer[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [peerName, setPeerName] = useState("");
  const [draft, setDraft] = useState("");
  const [isLoadingPeers, setIsLoadingPeers] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPeers = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingPeers(true);
    setError(null);
    try {
      const response = await fetch("/api/connections", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load connections.");
      setPeers(data.connections);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!silent) setIsLoadingPeers(false);
    }
  }, [token]);

  const fetchMessages = useCallback(async (otherUserId: string, silent = false) => {
    if (!silent) setIsLoadingChat(true);
    try {
      const response = await fetch(`/api/messages/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load messages.");
      setMessages(data.messages);
      setPeerName(data.peer.displayName);
    } catch (err: any) {
      if (!silent) setError(err.message);
    } finally {
      if (!silent) setIsLoadingChat(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPeers();
  }, [fetchPeers]);

  useEffect(() => {
    if (initialChatUserId) {
      setSelectedUserId(initialChatUserId);
      onInitialChatConsumed?.();
    }
  }, [initialChatUserId, onInitialChatConsumed]);

  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      setPeerName("");
      return;
    }

    fetchMessages(selectedUserId);

    if (chatPollRef.current) clearInterval(chatPollRef.current);
    chatPollRef.current = setInterval(() => {
      fetchMessages(selectedUserId, true);
    }, 3000);

    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, [selectedUserId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !draft.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId: selectedUserId, text: draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send message.");
      setDraft("");
      setMessages(prev => [...prev, data.message]);
      fetchPeers(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const selectedPeer = peers.find(p => p.userId === selectedUserId);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 mb-4">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Users size={18} className="text-emerald-400" />
          Messages
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chat with people you are connected to.
        </p>
      </div>

      {error && (
        <div className="shrink-0 mb-3 p-3 rounded-xl border border-red-900/40 bg-red-950/20 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 md:gap-4">
        {/* Connections list */}
        <div className={`md:w-72 shrink-0 flex flex-col min-h-0 border border-slate-800/60 rounded-xl bg-slate-950/40 overflow-hidden ${selectedUserId ? "hidden md:flex" : "flex"}`}>
          <div className="shrink-0 px-3 py-2 border-b border-slate-800/60 flex items-center justify-between">
            <span className="text-[0.625rem] font-mono uppercase tracking-wider text-slate-500">
              Connections ({peers.length})
            </span>
            <button
              onClick={fetchPeers}
              className="p-1 rounded text-slate-500 hover:text-slate-300 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {isLoadingPeers ? (
              <div className="p-6 text-center text-xs text-slate-500 font-mono">Loading...</div>
            ) : peers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 leading-relaxed">
                No connections yet.<br />
                Accept a request on the Requests tab.
              </div>
            ) : (
              peers.map(peer => {
                const arch = peer.archetypeId ? ARCHETYPES[peer.archetypeId] : null;
                const isActive = selectedUserId === peer.userId;
                const preview = peer.lastMessage
                  ? (peer.lastMessage.fromUserId === currentUserId ? "You: " : "") + peer.lastMessage.text
                  : "No messages yet";
                return (
                  <button
                    key={peer.userId}
                    onClick={() => setSelectedUserId(peer.userId)}
                    className={`w-full text-left px-3 py-3 border-b border-slate-800/40 transition cursor-pointer ${
                      isActive ? "bg-indigo-950/30 border-l-2 border-l-indigo-500" : "hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100 truncate">{peer.displayName}</p>
                      {peer.lastMessage && (
                        <span className="text-[0.5625rem] font-mono text-slate-500 shrink-0">
                          {formatTime(peer.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[0.625rem] font-mono text-slate-500 mt-0.5 truncate">
                      {arch?.name || "Developer"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 truncate">{preview}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex-1 min-h-0 flex flex-col border border-slate-800/60 rounded-xl bg-slate-950/40 overflow-hidden ${!selectedUserId ? "hidden md:flex" : "flex"}`}>
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <MessageCircle size={32} className="mb-3 opacity-40" />
              <p className="text-sm text-slate-400">Select a connection to start chatting</p>
            </div>
          ) : (
            <>
              <div className="shrink-0 px-4 py-3 border-b border-slate-800/60 flex items-center gap-3">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="md:hidden text-xs font-mono text-indigo-400 cursor-pointer"
                >
                  ← Back
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {peerName || selectedPeer?.displayName || "Developer"}
                  </p>
                  <p className="text-[0.625rem] font-mono text-slate-500">
                    {selectedPeer?.archetypeId ? ARCHETYPES[selectedPeer.archetypeId]?.name : "Connected"}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                {isLoadingChat ? (
                  <div className="text-center text-xs text-slate-500 font-mono py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-8">
                    Say hello to {peerName || "your connection"}!
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.fromUserId === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                            isMine
                              ? "bg-indigo-600 text-white rounded-br-sm"
                              : "bg-slate-800 text-slate-100 rounded-bl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          <p className={`text-[0.5625rem] mt-1 font-mono ${isMine ? "text-indigo-200/70" : "text-slate-500"}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="shrink-0 p-3 border-t border-slate-800/60 flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-500/50"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending}
                  className="px-4 py-2 rounded-xl bg-indigo-600 border border-indigo-500 text-white text-sm flex items-center gap-1.5 hover:bg-indigo-500 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
