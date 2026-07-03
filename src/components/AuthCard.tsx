import React, { useState } from "react";
import { LogIn, UserPlus, Key, Mail, AlertCircle } from "lucide-react";
import BrandLogo from "./BrandLogo";

interface AuthCardProps {
  onAuthSuccess: (token: string, user: { id: string; email: string }) => void;
}

type Tab = "login" | "register";

export default function AuthCard({ onAuthSuccess }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    const endpoint = activeTab === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed. Please try again.");
      }

      onAuthSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="auth-card" className="w-full max-w-md mx-auto bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
      
      {/* Decorative nebula orb */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex justify-center mb-8 relative">
        <BrandLogo size="lg" showWordmark tagline="Build with the right people" />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        <button
          onClick={() => { setActiveTab("login"); setError(null); }}
          className={`flex-1 py-3 text-sm font-medium transition border-b-2 flex items-center justify-center gap-2 cursor-pointer select-none ${
            activeTab === "login"
              ? "border-indigo-500 text-indigo-300 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <LogIn size={15} /> Sign In
        </button>
        <button
          onClick={() => { setActiveTab("register"); setError(null); }}
          className={`flex-1 py-3 text-sm font-medium transition border-b-2 flex items-center justify-center gap-2 cursor-pointer select-none ${
            activeTab === "register"
              ? "border-indigo-500 text-indigo-300 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-300"
          }`}
        >
          <UserPlus size={15} /> Create Account
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-300">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Mail size={12} /> Email Address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dev@zetwork.dev"
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2.5 px-3 text-slate-100 placeholder-slate-600 outline-none transition font-sans text-sm"
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Key size={12} /> Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2.5 px-3 text-slate-100 placeholder-slate-600 outline-none transition font-sans text-sm"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800/40 font-medium py-2.5 rounded-lg text-sm transition text-white mt-2 cursor-pointer select-none shadow-[0_4px_16px_rgba(99,102,241,0.2)] disabled:shadow-none"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Authenticating...</span>
            </div>
          ) : activeTab === "login" ? (
            "Sign In"
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {activeTab === "register" && (
        <div className="mt-5 text-center text-[0.625rem] font-mono text-slate-500">
          * Creating an account generates your unique developer profile in the constellation.
        </div>
      )}
      
      {activeTab === "login" && (
        <div className="mt-5 text-center text-[0.625rem] font-mono text-slate-500">
          Tip: You can log in as Alex (alex@zetwork.dev) with password "password123"!
        </div>
      )}
    </div>
  );
}
