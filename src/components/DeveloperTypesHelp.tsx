import { ARCHETYPES } from "../ml_artifacts";
import { Cpu, Palette, Sparkles, Rocket, Shield, X } from "lucide-react";

const ARCHETYPE_ICONS: Record<string, any> = {
  Cpu,
  Palette,
  Sparkles,
  Rocket,
  Shield,
};

interface DeveloperTypesHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function DeveloperTypesHelp({ open, onClose }: DeveloperTypesHelpProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-slate-100">5 Developer Types</h2>
          <p className="text-sm text-slate-400 mt-1">
            Quick guide — we group profiles by role so matches make more sense on the map.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.values(ARCHETYPES).map((arch) => {
            const Icon = ARCHETYPE_ICONS[arch.iconName] || Cpu;
            return (
              <div
                key={arch.id}
                className="border rounded-xl p-3.5 bg-slate-950/40"
                style={{ borderColor: `${arch.color}30` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="p-1.5 rounded-lg shrink-0"
                    style={{ backgroundColor: `${arch.color}20`, color: arch.color }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium" style={{ color: arch.color }}>
                      {arch.simpleLabel}
                    </p>
                    <p className="text-sm font-semibold text-slate-100">{arch.name}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{arch.description}</p>
                    <p className="text-xs text-slate-500 mt-2">{arch.partnerHint}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-slate-400 border-t border-slate-800 pt-4">
          <span className="text-slate-200 font-medium">Tip: </span>
          Your languages, interests, and project text set your type. Closer dots on the map = more alike.
          Different types can still be a strong team.
        </p>
      </div>
    </div>
  );
}
