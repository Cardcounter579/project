import { useState, useEffect } from "react";
import { User, Profile, Match } from "./types";
import AuthCard from "./components/AuthCard";
import BrandLogo from "./components/BrandLogo";
import ProfileForm from "./components/ProfileForm";
import ConstellationCanvas from "./components/ConstellationCanvas";
import DeveloperTypesHelp from "./components/DeveloperTypesHelp";
import HomeDashboard from "./components/HomeDashboard";
import ConnectionRequests from "./components/ConnectionRequests";
import ConnectionsHub from "./components/ConnectionsHub";
import { ARCHETYPES } from "./ml_artifacts";
import {
  LogOut,
  Home,
  User as UserIcon,
  Sparkles,
  Cpu,
  Palette,
  Shield,
  Rocket,
  Check,
  Orbit,
  Heart,
  ChevronRight,
  RefreshCw,
  Sliders,
  Filter,
  Inbox,
  MessageCircle,
} from "lucide-react";

const ARCHETYPE_ICONS: Record<string, any> = {
  Cpu,
  Palette,
  Sparkles,
  Rocket,
  Shield
};

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("zetwork_token"));
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [userCoords, setUserCoords] = useState<{ x: number; y: number; archetypeId: string } | null>(null);
  
  // Tab states: "constellation" | "profile" | "requests" | "network"
  const [activeTab, setActiveTab] = useState<"home" | "constellation" | "profile" | "requests" | "network">("home");

  // Selected candidate detail
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  
  // Loader states
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isFetchingMatches, setIsFetchingMatches] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [pendingOutgoingIds, setPendingOutgoingIds] = useState<Set<string>>(new Set());
  const [pendingIncomingIds, setPendingIncomingIds] = useState<Set<string>>(new Set());
  const [incomingRequestCount, setIncomingRequestCount] = useState(0);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [showTypesHelp, setShowTypesHelp] = useState(false);
  const [dashboardKey, setDashboardKey] = useState(0);

  function refreshDashboard() {
    fetchMatchesData();
    fetchIncomingRequestCount();
    setDashboardKey((k) => k + 1);
  }

  // Filters for the constellation
  const [minScoreFilter, setMinScoreFilter] = useState<number>(50);
  const [archetypeFilter, setArchetypeFilter] = useState<string>("");

  // Check auth and profile on boot
  useEffect(() => {
    if (!token) {
      setIsInitializing(false);
      return;
    }

    async function fetchMe() {
      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          // Token is stale or invalid
          handleLogout();
          return;
        }

        const data = await response.json();
        setCurrentUser({ id: data.id, email: data.email });
        setProfile(data.profile);

        if (data.profile) {
          fetchMatchesData();
          fetchIncomingRequestCount();
        } else {
          setActiveTab("profile"); // Force profile setup
        }
      } catch (e) {
        console.error("Auth initialization error:", e);
      } finally {
        setIsInitializing(false);
      }
    }

    fetchMe();
  }, [token]);

  // Fetch live matches
  async function fetchMatchesData() {
    if (!token) return;
    setIsFetchingMatches(true);
    setMatchError(null);

    try {
      const response = await fetch("/api/matches", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load compatibility map.");
      }

      setMatches(data.matches);
      setUserCoords(data.userCoords);
      setConnectedIds(new Set<string>(
        data.matches.filter((m: Match) => m.connectionStatus === "accepted").map((m: Match) => m.userId)
      ));
      setPendingOutgoingIds(new Set<string>(
        data.matches.filter((m: Match) => m.connectionStatus === "pending_out").map((m: Match) => m.userId)
      ));
      setPendingIncomingIds(new Set<string>(
        data.matches.filter((m: Match) => m.connectionStatus === "pending_in").map((m: Match) => m.userId)
      ));
    } catch (err: any) {
      setMatchError(err.message);
    } finally {
      setIsFetchingMatches(false);
    }
  }

  async function fetchIncomingRequestCount() {
    if (!token) return;
    try {
      const response = await fetch("/api/connections/requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setIncomingRequestCount(data.incoming?.length || 0);
    } catch {
      // non-critical
    }
  }

  const handleAuthSuccess = (newToken: string, user: { id: string; email: string }) => {
    localStorage.setItem("zetwork_token", newToken);
    setToken(newToken);
    setCurrentUser(user);
    // Let the useEffect handle profile fetching
  };

  const handleLogout = () => {
    localStorage.removeItem("zetwork_token");
    setToken(null);
    setCurrentUser(null);
    setProfile(null);
    setMatches([]);
    setSelectedMatch(null);
    setUserCoords(null);
    setActiveTab("home");
  };

  const handleProfileSave = async (profileData: Omit<Profile, "userId" | "zodiacElement" | "archetypeId" | "updatedAt">) => {
    if (!token) return;
    setIsSavingProfile(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save profile.");
      }

      setProfile(data.profile);
      await fetchMatchesData();
      setDashboardKey((k) => k + 1);
      setActiveTab("home");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setConnectionSuccess(false);
  };

  const triggerConnection = async (match: Match) => {
    if (!token || connectedIds.has(match.userId) || pendingOutgoingIds.has(match.userId)) return;
    if (pendingIncomingIds.has(match.userId)) {
      setActiveTab("requests");
      return;
    }
    setIsConnecting(true);

    try {
      const response = await fetch("/api/connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ toUserId: match.userId })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send connection request.");
      }

      setPendingOutgoingIds(prev => new Set(prev).add(match.userId));
      setConnectionSuccess(true);
      setDashboardKey((k) => k + 1);
      setTimeout(() => setConnectionSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-slate-500 uppercase animate-pulse">
            Booting ML Core...
          </span>
        </div>
      </div>
    );
  }

  if (!token || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 font-sans">
        <AuthCard onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // Active user's archetype details
  const myArchetype = profile ? ARCHETYPES[profile.archetypeId] : null;
  const MyArchIcon = myArchetype ? ARCHETYPE_ICONS[myArchetype.iconName] : UserIcon;

  return (
    <div className="h-screen flex flex-col bg-slate-950 font-sans overflow-hidden">
      {/* 1. TOP HEADER NAVIGATION */}
      <header id="main-header" className="border-b border-slate-900/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <BrandLogo size="md" showWordmark tagline="Build with the right people" />

        {/* Navigation Tabs */}
        {profile && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-slate-800/40 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTab("home")}
              className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer select-none flex items-center gap-1.5 ${
                activeTab === "home"
                  ? "bg-slate-950 text-indigo-400 border border-slate-800/80 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Home size={13} /> Home
            </button>
            <button
              onClick={() => setActiveTab("constellation")}
              className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer select-none flex items-center gap-1.5 ${
                activeTab === "constellation"
                  ? "bg-slate-950 text-indigo-400 border border-slate-800/80 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles size={13} /> Find Matches
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer select-none flex items-center gap-1.5 ${
                activeTab === "profile"
                  ? "bg-slate-950 text-indigo-400 border border-slate-800/80 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <UserIcon size={13} /> My Profile
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer select-none flex items-center gap-1.5 relative ${
                activeTab === "requests"
                  ? "bg-slate-950 text-indigo-400 border border-slate-800/80 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Inbox size={13} /> Requests
              {incomingRequestCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-indigo-500 text-white text-[0.5625rem] font-mono flex items-center justify-center">
                  {incomingRequestCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("network")}
              className={`px-4 py-2 rounded-lg font-medium transition cursor-pointer select-none flex items-center gap-1.5 ${
                activeTab === "network"
                  ? "bg-slate-950 text-indigo-400 border border-slate-800/80 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageCircle size={13} /> Messages
              {connectedIds.size > 0 && (
                <span className="text-[0.5625rem] font-mono text-emerald-400">{connectedIds.size}</span>
              )}
            </button>
          </nav>
        )}

        {/* User Session Info / Logout */}
        <div className="flex items-center gap-4">
          {profile && (
            <div className="hidden lg:flex items-center gap-2.5 border-r border-slate-900 pr-4">
              <div 
                className="p-1.5 rounded-lg border text-slate-100" 
                style={{ backgroundColor: `${myArchetype?.color}15`, borderColor: `${myArchetype?.color}30`, color: myArchetype?.color }}
              >
                <MyArchIcon size={15} />
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-200 block leading-tight">
                  {profile.displayName}
                </span>
                <span className="text-[0.5625rem] text-slate-400 leading-none">
                  {myArchetype?.simpleLabel}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 border border-slate-800 hover:border-red-900 hover:bg-red-950/20 rounded-xl text-slate-400 hover:text-red-400 transition cursor-pointer flex items-center gap-1.5 text-xs font-mono select-none"
            title="Log Out Session"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* MOBILE TAB BAR */}
      {profile && (
        <div className="md:hidden flex border-b border-slate-900 bg-slate-950 text-[0.6875rem] font-mono uppercase tracking-wider overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex-1 min-w-[3.75rem] py-3 text-center border-b-2 flex items-center justify-center gap-1 ${
              activeTab === "home" ? "border-indigo-500 text-indigo-300 bg-slate-900/20" : "border-transparent text-slate-500"
            }`}
          >
            <Home size={12} /> Home
          </button>
          <button
            onClick={() => setActiveTab("constellation")}
            className={`flex-1 min-w-[4.375rem] py-3 text-center border-b-2 flex items-center justify-center gap-1 ${
              activeTab === "constellation" ? "border-indigo-500 text-indigo-300 bg-slate-900/20" : "border-transparent text-slate-500"
            }`}
          >
            <Sparkles size={12} /> Matches
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 min-w-[4.375rem] py-3 text-center border-b-2 flex items-center justify-center gap-1 ${
              activeTab === "profile" ? "border-indigo-500 text-indigo-300 bg-slate-900/20" : "border-transparent text-slate-500"
            }`}
          >
            <UserIcon size={12} /> Profile
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 min-w-[4.6875rem] py-3 text-center border-b-2 flex items-center justify-center gap-1 relative ${
              activeTab === "requests" ? "border-indigo-500 text-indigo-300 bg-slate-900/20" : "border-transparent text-slate-500"
            }`}
          >
            <Inbox size={12} /> Requests
            {incomingRequestCount > 0 && (
              <span className="ml-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-indigo-500 text-white text-[0.5rem] font-mono flex items-center justify-center">
                {incomingRequestCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("network")}
            className={`flex-1 min-w-[4.6875rem] py-3 text-center border-b-2 flex items-center justify-center gap-1 ${
              activeTab === "network" ? "border-indigo-500 text-indigo-300 bg-slate-900/20" : "border-transparent text-slate-500"
            }`}
          >
            <MessageCircle size={12} /> Chat
          </button>
        </div>
      )}

      {/* 2. MAIN APPLICATION CONTENT VIEWPORT */}
      <main className="flex-1 min-h-0 flex flex-col max-w-7xl 2xl:max-w-[110rem] w-full mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
        
        {/* Profile config constraint: If they logged in but haven't filled a profile, force them to setup first */}
        {!profile ? (
          <div className="h-full overflow-y-auto scrollbar-thin space-y-6">
            <div className="p-4 rounded-xl border border-amber-900/40 bg-amber-950/10 text-xs text-amber-300 font-sans flex items-start gap-3">
              <Sliders size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-100">Welcome!</span>
                {" "}Set up your profile first — then we show you matching developers on the map.
              </div>
            </div>
            <ProfileForm initialProfile={null} onSave={handleProfileSave} isSaving={isSavingProfile} onShowTypesHelp={() => setShowTypesHelp(true)} />
          </div>
        ) : (
          /* Main Dashboard layout */
          <>
            {activeTab === "home" && profile && (
              <div className="h-full min-h-0 overflow-hidden">
                <HomeDashboard
                  token={token!}
                  profile={profile}
                  refreshKey={dashboardKey}
                  onFindMatches={() => setActiveTab("constellation")}
                  onOpenChat={(userId) => {
                    setChatUserId(userId);
                    setActiveTab("network");
                  }}
                  onOpenRequests={() => setActiveTab("requests")}
                />
              </div>
            )}

            {activeTab === "constellation" && (
              <div className="h-full flex flex-col gap-3 md:gap-4 min-h-0">

                {/* Visual statistics ribbon */}
                <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-900 bg-slate-950/40 rounded-xl p-4">
                  <div className="space-y-1">
                    <h1 className="text-lg font-bold tracking-tight text-white">
                      Find Your Match
                    </h1>
                    <p className="text-xs text-slate-400">
                      Click a dot on the map. Closer = better fit. Higher % = stronger match.{" "}
                      <button
                        type="button"
                        onClick={() => setShowTypesHelp(true)}
                        className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer"
                      >
                        What are developer types?
                      </button>
                    </p>
                  </div>

                  {/* Top Filters / Controls Panel */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Connections established */}
                    <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800/60 rounded-lg px-3 py-1.5">
                      <Heart size={11} className="text-emerald-400" />
                      <span className="text-[0.625rem] text-slate-500">Connected</span>
                      <span className="text-xs font-mono text-emerald-400 font-semibold">{connectedIds.size}</span>
                    </div>

                    {/* Minimum Score Slider */}
                    <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800/60 rounded-lg px-3 py-1.5">
                      <span className="text-[0.625rem] text-slate-500">Min match</span>
                      <input
                        type="range"
                        min="40"
                        max="85"
                        value={minScoreFilter}
                        onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                        className="w-20 md:w-24 accent-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-indigo-400 font-semibold">{minScoreFilter}%</span>
                    </div>

                    {/* Archetype Filter */}
                    <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800/60 rounded-lg px-3 py-1.5 text-xs">
                      <Filter size={10} className="text-slate-500" />
                      <select
                        value={archetypeFilter}
                        onChange={(e) => setArchetypeFilter(e.target.value)}
                        className="bg-transparent text-slate-100 outline-none font-sans cursor-pointer"
                      >
                        <option value="" className="bg-slate-950 text-slate-100">All types</option>
                        {Object.values(ARCHETYPES).map(arch => (
                          <option key={arch.id} value={arch.id} className="bg-slate-950 text-slate-100">{arch.simpleLabel}</option>
                        ))}
                      </select>
                    </div>

                    {/* Refresh trigger */}
                    <button
                      onClick={fetchMatchesData}
                      disabled={isFetchingMatches}
                      className="p-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer disabled:opacity-50"
                      title="Refetch Compatibility Coordinates"
                    >
                      <RefreshCw size={13} className={isFetchingMatches ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {/* Left/Right Constellation Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0 overflow-y-auto xl:overflow-hidden scrollbar-thin">

                  {/* LEFT: CANVAS SCREEN (XLS-8 COLUMNS) */}
                  <div className="xl:col-span-7 h-[24rem] xl:h-full min-h-0">
                    <ConstellationCanvas
                      matches={matches}
                      userCoords={userCoords}
                      onSelectMatch={handleSelectMatch}
                      selectedMatchId={selectedMatch?.userId}
                      minScoreFilter={minScoreFilter}
                      selectedArchetypeFilter={archetypeFilter}
                    />
                  </div>

                  {/* RIGHT: CANDIDATE DETAIL PROFILE PANEL */}
                  <div id="detail-panel" className="xl:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md min-h-[24rem] xl:min-h-0 xl:h-full flex flex-col overflow-y-auto scrollbar-thin">
                    {!selectedMatch ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 border border-dashed border-slate-800/60 rounded-xl my-auto">
                        <Orbit size={48} className="text-slate-800 mb-4" />
                        <h3 className="font-semibold text-slate-400 mb-1">Pick someone on the map</h3>
                        <p className="text-sm max-w-xs text-slate-500 leading-relaxed">
                          Tap a dot to see their profile, match score, and connect.
                        </p>
                      </div>
                    ) : (
                      /* Display Selected candidate detailed vectors */
                      <div className="space-y-5 animate-fade-in">
                        
                        {/* Header Details */}
                        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2.5 rounded-xl text-slate-100 shadow-md"
                              style={{ 
                                backgroundColor: `${ARCHETYPES[selectedMatch.archetypeId]?.color}15`,
                                color: ARCHETYPES[selectedMatch.archetypeId]?.color,
                                borderColor: `${ARCHETYPES[selectedMatch.archetypeId]?.color}30`
                              }}
                            >
                              {(() => {
                                const matchedArch = ARCHETYPES[selectedMatch.archetypeId];
                                const CandidateIcon = matchedArch ? ARCHETYPE_ICONS[matchedArch.iconName] : UserIcon;
                                return <CandidateIcon size={22} />;
                              })()}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-100 text-lg leading-tight">
                                {selectedMatch.displayName}
                              </h3>
                              <span className="text-xs text-slate-400">
                                {ARCHETYPES[selectedMatch.archetypeId]?.simpleLabel}
                                {" · "}
                                {ARCHETYPES[selectedMatch.archetypeId]?.name}
                              </span>
                            </div>
                          </div>

                          {/* Compatibility Score Radial Pill */}
                          <div className="text-right">
                            <span className="text-3xl font-extrabold text-indigo-400 font-mono tracking-tight leading-none block">
                              {selectedMatch.compatibilityScore}%
                            </span>
                            <span className="text-xs text-slate-500">Match</span>
                          </div>
                        </div>

                        {/* Astrological Alignment Summary */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-950/60 border border-slate-800/40 p-3 rounded-xl text-xs">
                          <div className="space-y-0.5">
                            <span className="text-slate-500">Zodiac</span>
                            <span className="font-semibold text-slate-300 block">{selectedMatch.zodiacSign}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-slate-500">Element</span>
                            <span className="font-semibold text-indigo-400 block">{selectedMatch.zodiacElement}</span>
                          </div>
                        </div>

                        <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/30">
                          <h4 className="text-sm font-medium text-slate-300 mb-1">
                            Why you match
                          </h4>

                          {[
                            { name: "Same languages & tools", score: selectedMatch.scores.techStackOverlap, color: "from-indigo-600 to-indigo-400" },
                            { name: "Same interests", score: selectedMatch.scores.interestsOverlap, color: "from-purple-600 to-purple-400" },
                            { name: "Developer type fit", score: selectedMatch.scores.archetypeFit, color: "from-blue-600 to-blue-400" },
                            { name: "Zodiac vibe", score: selectedMatch.scores.zodiacHarmony, color: "from-pink-600 to-pink-400" },
                            { name: "Similar projects", score: selectedMatch.scores.buildGoalSimilarity, color: "from-emerald-600 to-emerald-400" },
                          ].map((factor, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex justify-between items-baseline text-xs text-slate-500">
                                <span>{factor.name}</span>
                                <span className="text-slate-300 font-semibold">{factor.score}%</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full bg-gradient-to-r ${factor.color} transition-all duration-500`}
                                  style={{ width: `${factor.score}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Tech stack multi-select views */}
                        <div className="space-y-2">
                          <span className="text-sm text-slate-500 block">Tech stack</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedMatch.languages.map((lang, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-900 text-xs font-mono">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interests multi-select views */}
                        <div className="space-y-2">
                          <span className="text-sm text-slate-500 block">Interests</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedMatch.interests.map((interest, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950/20 text-indigo-300 border border-indigo-900/30 text-xs font-mono">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Full Free-text Build Goal */}
                        <div className="space-y-1 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/30">
                          <span className="text-sm text-slate-500 block">Current project</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedMatch.buildGoal}</p>
                        </div>

                        {/* Connect / Chat */}
                        <div className="pt-2 space-y-2">
                          {(() => {
                            const alreadyConnected = connectedIds.has(selectedMatch.userId);
                            const pendingOut = pendingOutgoingIds.has(selectedMatch.userId);
                            const pendingIn = pendingIncomingIds.has(selectedMatch.userId);
                            const disabled = connectionSuccess || alreadyConnected || pendingOut || isConnecting;
                            return (
                              <>
                                <button
                                  onClick={() => pendingIn ? setActiveTab("requests") : triggerConnection(selectedMatch)}
                                  disabled={disabled && !pendingIn}
                                  className={`w-full py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all duration-200 select-none flex items-center justify-center gap-2 border ${
                                    connectionSuccess || alreadyConnected
                                      ? "bg-emerald-600/10 border-emerald-500 text-emerald-400 cursor-default"
                                      : pendingOut
                                      ? "bg-amber-600/10 border-amber-500/50 text-amber-400 cursor-default"
                                      : pendingIn
                                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 cursor-pointer hover:bg-indigo-600/30"
                                      : isConnecting
                                      ? "bg-indigo-800/40 border-indigo-700 text-slate-400 cursor-wait"
                                      : "bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white shadow-[0_4px_16px_rgba(99,102,241,0.2)] cursor-pointer"
                                  }`}
                                >
                                  {connectionSuccess ? (
                                    <><Check size={14} /> Request Sent</>
                                  ) : alreadyConnected ? (
                                    <><Check size={14} /> Connected</>
                                  ) : pendingOut ? (
                                    <><RefreshCw size={14} /> Request Pending</>
                                  ) : pendingIn ? (
                                    <><Inbox size={14} /> Respond to Request</>
                                  ) : isConnecting ? (
                                    <><RefreshCw size={14} className="animate-spin" /> Sending Request...</>
                                  ) : (
                                    <><Heart size={14} /> Send Connection Request</>
                                  )}
                                </button>
                                {alreadyConnected && (
                                  <button
                                    onClick={() => {
                                      setChatUserId(selectedMatch.userId);
                                      setActiveTab("network");
                                    }}
                                    className="w-full py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 border bg-slate-900 border-slate-700 text-indigo-300 hover:bg-slate-800 hover:border-indigo-500/50 cursor-pointer"
                                  >
                                    <MessageCircle size={14} /> Open Chat
                                  </button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MY PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="h-full min-h-0 overflow-y-auto scrollbar-thin lg:overflow-hidden">
                <ProfileForm
                  initialProfile={profile}
                  onSave={handleProfileSave}
                  isSaving={isSavingProfile}
                  onShowTypesHelp={() => setShowTypesHelp(true)}
                />
              </div>
            )}

            {/* REQUESTS TAB */}
            {activeTab === "requests" && (
              <div className="h-full overflow-y-auto scrollbar-thin">
                <ConnectionRequests
                  token={token!}
                  onChanged={refreshDashboard}
                />
              </div>
            )}

            {activeTab === "network" && (
              <div className="h-full min-h-0 overflow-hidden">
                <ConnectionsHub
                  token={token!}
                  currentUserId={currentUser.id}
                  initialChatUserId={chatUserId}
                  onInitialChatConsumed={() => setChatUserId(null)}
                />
              </div>
            )}
          </>
        )}
      </main>

      <DeveloperTypesHelp open={showTypesHelp} onClose={() => setShowTypesHelp(false)} />
    </div>
  );
}
