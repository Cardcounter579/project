import React, { useEffect, useRef } from "react";
import { Match } from "../types";
import { ARCHETYPES } from "../ml_artifacts";

// Screen-space node record used during a render pass.
type ScreenNode = {
  x: number;
  y: number;
  match: Match;
  index: number;
  clusterKey?: string; // set when this node is part of a COLLAPSED overlap cluster
};

// Node interaction geometry (base values; scaled by zoom at runtime).
const NODE_HIT = 22; // px radius that counts as "on the node"

// Greedy proximity grouping of screen-space nodes. Returns arrays of indices into `nodes`.
function groupOverlaps(nodes: ScreenNode[], collideDist: number): number[][] {
  const seen = new Array(nodes.length).fill(false);
  const groups: number[][] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (seen[i]) continue;
    const g = [i];
    seen[i] = true;
    for (let j = i + 1; j < nodes.length; j++) {
      if (seen[j]) continue;
      if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < collideDist) {
        g.push(j);
        seen[j] = true;
      }
    }
    groups.push(g);
  }
  return groups;
}

interface ConstellationCanvasProps {
  matches: Match[];
  userCoords: { x: number; y: number; archetypeId: string } | null;
  onSelectMatch: (match: Match) => void;
  selectedMatchId?: string;
  minScoreFilter: number;
  selectedArchetypeFilter: string;
}

export default function ConstellationCanvas({
  matches,
  userCoords,
  onSelectMatch,
  selectedMatchId,
  minScoreFilter,
  selectedArchetypeFilter,
}: ConstellationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filter matches based on user selections
  const filteredMatches = matches.filter((match) => {
    if (match.compatibilityScore < minScoreFilter) return false;
    if (selectedArchetypeFilter && match.archetypeId !== selectedArchetypeFilter) return false;
    return true;
  });

  // viewport and rotation values (stored in refs for 60fps rendering)
  const rotationAngleRef = useRef(0.0); // 2D rotation angle around center user
  const zoomRef = useRef(1.0);
  
  const isDraggingRef = useRef(false);
  const dragStartAngleRef = useRef(0);
  const mouseDownPosRef = useRef({ x: 0, y: 0 });
  const mousePosRef = useRef({ x: 0, y: 0 });
  
  // Track hovered match inside ref to prevent unnecessary react re-renders at 60fps
  const hoveredMatchRef = useRef<Match | null>(null);

  // Declustering state: which collapsed cluster (keyed by centroid) is currently
  // fanned out ("spiderfied"), and whether the cursor is over a collapsed cluster badge.
  const spiderKeyRef = useRef<string | null>(null);
  const hoveredClusterRef = useRef<string | null>(null);

  // Store lists in refs so the 60fps continuous render loop always reads the absolute latest props
  const filteredMatchesRef = useRef<Match[]>([]);
  const selectedMatchIdRef = useRef<string | undefined>(undefined);
  const userCoordsRef = useRef<{ x: number; y: number; archetypeId: string } | null>(null);

  useEffect(() => {
    filteredMatchesRef.current = filteredMatches;
  }, [filteredMatches]);

  useEffect(() => {
    selectedMatchIdRef.current = selectedMatchId;
  }, [selectedMatchId]);

  useEffect(() => {
    userCoordsRef.current = userCoords;
  }, [userCoords]);

  // Twinkling background stars
  const bgStarsRef = useRef<{ x: number; y: number; size: number; alpha: number; speed: number }[]>([]);

  // 1. Resize Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
        // Re-generate background stars
        bgStarsRef.current = Array.from({ length: 120 }, () => ({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          size: Math.random() * 1.5 + 0.3,
          alpha: Math.random(),
          speed: 0.005 + Math.random() * 0.01,
        }));
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 2. Non-Passive Wheel Zoom Event
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault(); // Lock browser scrolling so we zoom the map
      const zoomFactor = 1.1;
      const oldZoom = zoomRef.current;

      let newZoom = oldZoom;
      if (e.deltaY < 0) {
        newZoom = Math.min(3.0, oldZoom * zoomFactor);
      } else {
        newZoom = Math.max(0.4, oldZoom / zoomFactor);
      }

      zoomRef.current = newZoom;
    };

    canvas.addEventListener("wheel", handleWheelEvent, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleWheelEvent);
    };
  }, []);

  // 3. Continuous 60fps render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId: number;

    const render = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) {
        animationId = requestAnimationFrame(render);
        return;
      }

      const cX = w / 2;
      const cY = h / 2;

      ctx.clearRect(0, 0, w, h);

      // A. Space background gradient
      const bgGrad = ctx.createRadialGradient(cX, cY, 10, cX, cY, Math.max(w, h));
      bgGrad.addColorStop(0, "#090d16"); // rich dark cosmic center
      bgGrad.addColorStop(1, "#020408"); // deep cosmic black
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Slow, elegant auto-rotation when user is not actively dragging.
      // Frozen while a cluster is fanned out so the spider legs stay clickable.
      if (!isDraggingRef.current && !spiderKeyRef.current) {
        rotationAngleRef.current += 0.0008; // smooth celestial spin
      }

      const zoom = zoomRef.current;
      const rotationAngle = rotationAngleRef.current;

      // B. Twinkling background stars
      if (bgStarsRef.current.length === 0 && w > 0 && h > 0) {
        bgStarsRef.current = Array.from({ length: 120 }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 1.5 + 0.3,
          alpha: Math.random(),
          speed: 0.005 + Math.random() * 0.01,
        }));
      }

      bgStarsRef.current.forEach((star) => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0) {
          star.speed = -star.speed;
        }
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.globalAlpha = Math.max(0.15, Math.min(1, star.alpha));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Constellation scale bounds
      const maxRadius = Math.min(w, h) * 0.43 * zoom;

      // C. Map matches coordinates around the origin
      const currentMatches = filteredMatchesRef.current;
      const currentSelectedId = selectedMatchIdRef.current;
      const screenCoords: ScreenNode[] = [];

      const cos = Math.cos(rotationAngle);
      const sin = Math.sin(rotationAngle);

      currentMatches.forEach((match, index) => {
        // Apply rotation to match coordinates
        const rx = match.x * cos - match.y * sin;
        const ry = match.x * sin + match.y * cos;

        const worldX = cX + rx * maxRadius;
        const worldY = cY + ry * maxRadius;

        // Micro-floating hover animation per node. Damped (was 4*zoom) so nearby
        // nodes stop jittering into each other, and frozen entirely while a cluster
        // is fanned out so spidered legs stay put.
        const floatAngle = (Date.now() * 0.001) + (index * 0.5);
        const offsetDist = spiderKeyRef.current ? 0 : 1.5 * zoom;
        const sX = worldX + Math.sin(floatAngle) * offsetDist;
        const sY = worldY + Math.cos(floatAngle * 1.5) * offsetDist;

        screenCoords.push({ x: sX, y: sY, match, index });

        // Connective path lines to center (Much clearer, reduced fade!)
        const score = match.compatibilityScore;
        const isSelected = currentSelectedId === match.userId;
        const isHovered = hoveredMatchRef.current && hoveredMatchRef.current.userId === match.userId;

        // Enhanced, clear alpha for lines
        const lineAlpha = 0.25 + (score / 100) * 0.45;
        ctx.strokeStyle = isSelected 
          ? `rgba(129, 140, 248, 0.75)` 
          : isHovered 
            ? `rgba(255, 255, 255, 0.6)` 
            : `rgba(255, 255, 255, ${lineAlpha * 0.55})`;
        ctx.lineWidth = isSelected ? 2 : isHovered ? 1.5 : 1;

        ctx.beginPath();
        ctx.moveTo(cX, cY);
        ctx.lineTo(sX, sY);
        ctx.stroke();
      });

      // C2. DECLUSTERING — detect overlapping nodes. Fan the active cluster out onto a
      // spider ring; render the rest as a single "+N" badge so dense clusters stay clickable.
      // Clusters are keyed by member identity (rotation-invariant) so expansion is stable.
      const collideDist = NODE_HIT * 1.6 * zoom;
      groupOverlaps(screenCoords, collideDist).forEach((group) => {
        if (group.length < 2) return; // singletons draw normally

        const cx = group.reduce((s, i) => s + screenCoords[i].x, 0) / group.length;
        const cy = group.reduce((s, i) => s + screenCoords[i].y, 0) / group.length;
        const key = group.map((i) => screenCoords[i].match.userId).sort().join("|");

        if (spiderKeyRef.current === key) {
          // EXPANDED: fan members onto a ring; draw a leg from the centroid to each.
          const legR = (26 + group.length * 5) * zoom;
          group.forEach((idx, k) => {
            const a = (k / group.length) * Math.PI * 2 - Math.PI / 2;
            const nx = cx + Math.cos(a) * legR;
            const ny = cy + Math.sin(a) * legR;
            ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(nx, ny);
            ctx.stroke();
            screenCoords[idx].x = nx; // relocate so draw + hit-test use the fanned position
            screenCoords[idx].y = ny;
          });
        } else {
          // COLLAPSED: tag members so the node loop skips them, then draw one "+N" badge.
          group.forEach((idx) => {
            screenCoords[idx].clusterKey = key;
          });
          ctx.fillStyle = "rgba(99, 102, 241, 0.92)";
          ctx.beginPath();
          ctx.arc(cx, cy, 12 * zoom, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#c7d2fe";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 12 * zoom, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.font = `bold ${Math.max(10, Math.round(11 * zoom))}px sans-serif`;
          ctx.fillText(`+${group.length}`, cx, cy + 4 * zoom);
        }
      });

      // Connect star clusters (Inter-constellation nodes)
      for (let i = 0; i < screenCoords.length; i++) {
        const nodeA = screenCoords[i];
        for (let j = i + 1; j < screenCoords.length; j++) {
          const nodeB = screenCoords[j];
          const distance = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);

          if (distance < 140 * zoom && nodeA.match.compatibilityScore > 60 && nodeB.match.compatibilityScore > 60) {
            ctx.strokeStyle = "rgba(100, 116, 139, 0.25)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
          }
        }
      }

      // D. Draw central User Nebula ("YOU")
      const currentUserCoords = userCoordsRef.current;
      if (currentUserCoords) {
        const userArch = ARCHETYPES[currentUserCoords.archetypeId];
        const userColor = userArch ? userArch.color : "#6366F1";

        // Pulsing core aura
        const pulse = Math.sin(Date.now() / 700) * 4 * zoom;
        const outerRadius = (25 + pulse) * zoom;

        const nebGrad = ctx.createRadialGradient(cX, cY, 2, cX, cY, outerRadius);
        nebGrad.addColorStop(0, `${userColor}cc`);
        nebGrad.addColorStop(0.5, `${userColor}25`);
        nebGrad.addColorStop(1, `${userColor}00`);

        ctx.fillStyle = nebGrad;
        ctx.beginPath();
        ctx.arc(cX, cY, outerRadius, 0, Math.PI * 2);
        ctx.fill();

        // Main user core star
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cX, cY, 8 * zoom, 0, Math.PI * 2);
        ctx.fill();

        // Core outline
        ctx.strokeStyle = userColor;
        ctx.lineWidth = Math.max(1.5, 2.5 * zoom);
        ctx.beginPath();
        ctx.arc(cX, cY, 10 * zoom, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${Math.max(10, Math.round(12 * zoom))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("YOU", cX, cY + 24 * zoom);
      }

      // E. Hover check — adaptive hitbox that grows with zoom, resolving ties to the
      // TOPMOST (last-drawn) node so overlapping stars are individually selectable.
      let currentHovered: Match | null = null;
      let hoveredCluster: string | null = null;
      const hitR = NODE_HIT * Math.max(0.8, zoom);
      for (let k = screenCoords.length - 1; k >= 0; k--) {
        const node = screenCoords[k];
        const distToMouse = Math.hypot(node.x - mousePosRef.current.x, node.y - mousePosRef.current.y);
        if (distToMouse < hitR) {
          currentHovered = node.match;
          hoveredCluster = node.clusterKey ?? null; // set only for collapsed cluster members
          break;
        }
      }

      hoveredMatchRef.current = currentHovered;
      hoveredClusterRef.current = hoveredCluster;

      // F. Draw Match Node Stars (Vibrant, Clear, reduced fade!)
      screenCoords.forEach((node) => {
        // Members of a COLLAPSED cluster are represented by the "+N" badge — skip them.
        if (node.clusterKey) return;

        const isSelected = currentSelectedId === node.match.userId;
        const isHovered = currentHovered && currentHovered.userId === node.match.userId;

        const archetype = ARCHETYPES[node.match.archetypeId];
        const color = archetype ? archetype.color : "#6366F1";

        const baseRadius = (5.5 + (node.match.compatibilityScore / 100) * 6.5) * zoom;
        const starRadius = baseRadius + (isHovered ? 4.5 : isSelected ? 3 : 0);
        const pulseVal = Math.sin(Date.now() / 250 + (node.index * 45)) * 1.5;

        // Vibrantly colored radial glow
        const starGrad = ctx.createRadialGradient(node.x, node.y, 1, node.x, node.y, starRadius * 2.8);
        starGrad.addColorStop(0, `${color}ff`);
        starGrad.addColorStop(0.35, `${color}88`); // Much more vibrant and crisp!
        starGrad.addColorStop(1, `${color}00`);

        ctx.fillStyle = starGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, starRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // High intensity white core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(node.x, node.y, starRadius * 0.65 + pulseVal * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Outer crisp boundary ring
        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected ? Math.max(2.5, 3.5 * zoom) : isHovered ? Math.max(2, 2.5 * zoom) : 1.2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, starRadius + pulseVal * 0.2, 0, Math.PI * 2);
        ctx.stroke();

        // Render beautiful name labels
        ctx.fillStyle = isSelected ? "#a5b4fc" : isHovered ? "#ffffff" : "rgba(226, 232, 240, 0.75)";
        ctx.font = isSelected || isHovered 
          ? `bold ${Math.max(11, Math.round(13 * zoom))}px sans-serif`
          : `${Math.max(9, Math.round(10.5 * zoom))}px sans-serif`;
        ctx.textAlign = "center";

        // Crisp text backing shadow for superb clarity
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        const displayNameText = isSelected || isHovered
          ? `${node.match.displayName} (${node.match.compatibilityScore}%)`
          : node.match.displayName;
        ctx.fillText(displayNameText, node.x, node.y - starRadius - 8);
        ctx.shadowBlur = 0; // reset
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Mouse drag-to-rotate event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cX = rect.width / 2;
    const cY = rect.height / 2;
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;

    isDraggingRef.current = true;
    
    // Store exact start positions for movement detection
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };

    // Calculate rotation angle offset based on starting click angle relative to the center
    dragStartAngleRef.current = Math.atan2(mY - cY, mX - cX) - rotationAngleRef.current;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cX = rect.width / 2;
    const cY = rect.height / 2;
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;

    mousePosRef.current = { x: mX, y: mY };

    if (isDraggingRef.current) {
      // Calculate current mouse angle relative to the center and update rotation
      const currentAngle = Math.atan2(mY - cY, mX - cX);
      rotationAngleRef.current = currentAngle - dragStartAngleRef.current;
    }
  };

  const handleMouseUpOrLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Detect bulletproof click on release by evaluating drag path distance
    const dist = Math.hypot(e.clientX - mouseDownPosRef.current.x, e.clientY - mouseDownPosRef.current.y);
    if (dist < 6) {
      if (hoveredClusterRef.current) {
        // Clicked a collapsed "+N" cluster badge → fan it out (spiderfy).
        spiderKeyRef.current = hoveredClusterRef.current;
      } else if (hoveredMatchRef.current) {
        // Clicked a real (possibly fanned-out) star → open its profile.
        onSelectMatch(hoveredMatchRef.current);
      } else {
        // Clicked empty space → collapse any expanded cluster.
        spiderKeyRef.current = null;
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full min-h-[20rem] cursor-grab active:cursor-grabbing rounded-2xl overflow-hidden border border-slate-800/80 bg-slate-950/40 backdrop-blur-sm shadow-inner select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className="block w-full h-full"
      />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 px-4 rounded-full border border-slate-800/40 bg-slate-950/90 backdrop-blur-md text-[0.625rem] font-mono text-slate-400 pointer-events-none text-center shadow-md select-none tracking-wide">
        💫 <span className="text-indigo-300 font-semibold">Drag</span> to Spin • <span className="text-indigo-300 font-semibold">Scroll</span> to Zoom • <span className="text-indigo-300 font-semibold">Click Star</span> for Profile • <span className="text-indigo-300 font-semibold">Click +N</span> to Expand Cluster
      </div>
    </div>
  );
}
