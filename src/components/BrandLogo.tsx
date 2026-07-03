import { Orbit } from "lucide-react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  /** Optional line of micro-text under the wordmark (e.g. a product descriptor) */
  tagline?: string;
  className?: string;
}

// Locked square dimensions (px) for the mark — keeps the aspect ratio from ever drifting.
const MARK_SIZE = { sm: 28, md: 36, lg: 56 };
const WORD_CLASS = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };

/**
 * Single source of truth for the Zetwork brand lockup.
 * Mark (Orbit), wordmark casing, gradient, and color profile live here only —
 * every surface (header, auth, decks) renders this instead of an ad-hoc lockup.
 */
export default function BrandLogo({
  size = "md",
  showWordmark = true,
  tagline,
  className = "",
}: BrandLogoProps) {
  const box = MARK_SIZE[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-brand to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] shrink-0"
        style={{ width: box, height: box }}
      >
        <Orbit className="text-white animate-spin-slow" size={Math.round(box * 0.5)} />
      </div>

      {showWordmark && (
        <div className="leading-none">
          <span className={`font-bold tracking-tight text-white block ${WORD_CLASS[size]}`}>
            Zetwork
          </span>
          {tagline && (
            <span className="text-[0.5625rem] font-mono text-slate-400 uppercase tracking-widest">
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
