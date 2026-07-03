import React, { useState, useEffect } from "react";
import { Profile, Archetype } from "../types";
import { predictArchetype, ARCHETYPES, ZODIAC_ELEMENTS } from "../ml_artifacts";
import { Cpu, Palette, Sparkles, Rocket, Shield, Save, CheckCircle2 } from "lucide-react";

interface ProfileFormProps {
  initialProfile: Profile | null;
  onSave: (profileData: Omit<Profile, "userId" | "zodiacElement" | "archetypeId" | "updatedAt">) => Promise<void>;
  isSaving: boolean;
  onShowTypesHelp?: () => void;
}

// Available options for languages and interests tags
const LANGUAGES_LIST = [
  "Python", "Rust", "Go", "TypeScript", "JavaScript", "C++", "Java", "SQL", "PostgreSQL", "HTML", "CSS", "Tailwind", "Bash", "Docker", "Kubernetes"
];

const INTERESTS_LIST = [
  "Frontend", "UI/UX", "Design", "Animations", "Backend", "Databases", "System Design", "AI", "Machine Learning", "Data Science", "Statistics", "Security", "DevOps", "Cloud", "Linux", "MVP", "Startups", "Rapid Prototyping", "Hackathons"
];

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const ARCHETYPE_ICONS: Record<string, any> = {
  Cpu: Cpu,
  Palette: Palette,
  Sparkles: Sparkles,
  Rocket: Rocket,
  Shield: Shield
};

export default function ProfileForm({ initialProfile, onSave, isSaving, onShowTypesHelp }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || "");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(initialProfile?.languages || []);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialProfile?.interests || []);
  const [buildGoal, setBuildGoal] = useState(initialProfile?.buildGoal || "");
  const [zodiacSign, setZodiacSign] = useState(initialProfile?.zodiacSign || "Aries");
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Predicted archetype state for live feedback
  const [predictedArch, setPredictedArch] = useState<Archetype | null>(null);
  const [pcaCoords, setPcaCoords] = useState<[number, number]>([0, 0]);

  // Run live classifier when user changes inputs
  useEffect(() => {
    const { archetypeId, pcaCoords: coords } = predictArchetype(
      selectedLanguages,
      selectedInterests,
      buildGoal
    );
    setPredictedArch(ARCHETYPES[archetypeId] || null);
    setPcaCoords(coords);
  }, [selectedLanguages, selectedInterests, buildGoal]);

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !buildGoal.trim()) return;

    await onSave({
      displayName,
      languages: selectedLanguages,
      interests: selectedInterests,
      buildGoal,
      zodiacSign
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const IconComponent = predictedArch ? ARCHETYPE_ICONS[predictedArch.iconName] : Cpu;

  return (
    <div id="profile-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 lg:h-full lg:min-h-0">
      {/* LEFT: FORM INPUTS */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 lg:min-h-0 lg:overflow-y-auto scrollbar-thin bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 space-y-5 backdrop-blur-md">
        <h2 className="text-xl font-semibold tracking-tight text-slate-100">
          Your Profile
        </h2>
        <p className="text-sm text-slate-400 -mt-3">Fill this in so we can find developers who fit you.</p>

        {/* Display Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Your name</label>
          <input
            type="text"
            required
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. Satoshi Nakamoto"
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2.5 px-3.5 text-slate-100 placeholder-slate-600 outline-none transition font-sans"
          />
        </div>

        {/* Zodiac Dropdown */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Zodiac sign</label>
          <p className="text-xs text-slate-500">Optional fun factor for match score</p>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={zodiacSign}
              onChange={e => setZodiacSign(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-lg py-2.5 px-3.5 text-slate-100 outline-none font-sans cursor-pointer"
            >
              {ZODIAC_SIGNS.map(sign => (
                <option key={sign} value={sign} className="bg-slate-950 text-slate-100">{sign}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 px-3 bg-slate-950/40 border border-slate-800/40 rounded-lg text-xs font-mono text-slate-400">
              <span>Element:</span>
              <span className="text-indigo-400 font-semibold uppercase">{ZODIAC_ELEMENTS[zodiacSign]}</span>
            </div>
          </div>
        </div>

        {/* Languages Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Languages & tools</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES_LIST.map(lang => {
              const active = selectedLanguages.includes(lang);
              return (
                <button
                  type="button"
                  key={lang}
                  onClick={() => toggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all duration-200 ${
                    active
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">What you like working on</label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS_LIST.map(interest => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all duration-200 ${
                    active
                      ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
                      : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Build Goal text area */}
        <div className="space-y-1">
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-medium text-slate-300">What are you building?</label>
          </div>
          <textarea
            required
            rows={3}
            value={buildGoal}
            onChange={e => setBuildGoal(e.target.value)}
            placeholder="e.g. I want to build a modern portfolio site with React..."
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg py-2.5 px-3.5 text-slate-100 placeholder-slate-600 outline-none transition font-sans text-sm resize-none"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={isSaving || !displayName.trim() || !buildGoal.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-800/40 disabled:text-slate-500 font-medium px-5 py-2.5 rounded-xl text-sm transition-all duration-150 text-white cursor-pointer select-none shadow-[0_4px_16px_rgba(99,102,241,0.2)] disabled:shadow-none"
          >
            {isSaving ? "Saving..." : <><Save size={16} /> Save Profile</>}
          </button>

          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 transition-all animate-pulse">
              <CheckCircle2 size={14} /> Saved!
            </span>
          )}
        </div>
      </form>

      {/* RIGHT: developer type preview */}
      <div className="lg:col-span-5 flex flex-col gap-6 lg:min-h-0">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col backdrop-blur-md h-full lg:min-h-0 lg:overflow-y-auto scrollbar-thin">
          <h3 className="text-lg font-semibold text-slate-200 mb-1">Your developer type</h3>
          <p className="text-sm text-slate-400 mb-4">
            Updates live as you edit your profile.{" "}
            {onShowTypesHelp && (
              <button
                type="button"
                onClick={onShowTypesHelp}
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer"
              >
                Learn about the 5 types
              </button>
            )}
          </p>

          {/* Simple map — dots only, no axis labels */}
          <div className="relative w-full aspect-square max-w-[17.5rem] mx-auto bg-slate-950 border border-slate-800/80 rounded-xl mb-5 overflow-hidden">
            <div className="absolute inset-0 border-t border-b border-dashed border-slate-800/30 top-1/2 -translate-y-1/2" />
            <div className="absolute inset-0 border-l border-r border-dashed border-slate-800/30 left-1/2 -translate-x-1/2" />

            {Object.values(ARCHETYPES).map((arch) => {
              const xPct = ((arch.centroid[0] + 1) / 2) * 80 + 10;
              const yPct = ((1 - arch.centroid[1]) / 2) * 80 + 10;
              const isSelected = predictedArch?.id === arch.id;

              return (
                <div
                  key={arch.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
                  style={{ left: `${xPct}%`, top: `${yPct}%` }}
                  title={arch.simpleLabel}
                >
                  <span
                    className={`w-3 h-3 rounded-full block border border-slate-950 transition-all duration-300 ${
                      isSelected ? "scale-150 ring-4 ring-offset-2 ring-offset-slate-950" : "opacity-30"
                    }`}
                    style={{
                      backgroundColor: arch.color,
                      boxShadow: isSelected ? `0 0 12px ${arch.color}` : "none",
                      borderColor: isSelected ? "#fff" : "transparent"
                    }}
                  />
                </div>
              );
            })}

            {(() => {
              const userXPct = ((pcaCoords[0] + 1) / 2) * 80 + 10;
              const userYPct = ((1 - pcaCoords[1]) / 2) * 80 + 10;
              return (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150"
                  style={{ left: `${userXPct}%`, top: `${userYPct}%` }}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-[0_0_10px_#fff] border-2 border-indigo-400" />
                </div>
              );
            })()}
          </div>

          <p className="text-center text-xs text-slate-500 mb-4">White dot = you · Colored dots = the 5 types</p>

          {predictedArch && (
            <div
              className="border rounded-xl p-4 bg-slate-950/60"
              style={{ borderColor: `${predictedArch.color}30` }}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div
                  className="p-1.5 rounded-lg"
                  style={{ backgroundColor: `${predictedArch.color}25`, color: predictedArch.color }}
                >
                  <IconComponent size={20} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: predictedArch.color }}>
                    {predictedArch.simpleLabel}
                  </p>
                  <h4 className="font-semibold text-slate-100">{predictedArch.name}</h4>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">{predictedArch.description}</p>
              <p className="text-xs text-slate-500 mt-2">{predictedArch.partnerHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
