import { Archetype } from "./types";

// 1. Pre-defined Archetypes and their 2D PCA centroids
export const ARCHETYPES: Record<string, Archetype> = {
  architect: {
    id: "architect",
    name: "Code Architect",
    simpleLabel: "Backend & systems",
    partnerHint: "Pairs well with UI designers",
    description: "Builds scalable backends, databases, and system architecture.",
    centroid: [0.8, -0.2],
    color: "#3B82F6", // Blue
    iconName: "Cpu"
  },
  pixel: {
    id: "pixel",
    name: "Pixel Alchemist",
    simpleLabel: "UI & design",
    partnerHint: "Pairs well with backend builders",
    description: "Creates beautiful interfaces, animations, and user experiences.",
    centroid: [-0.7, -0.6],
    color: "#EC4899", // Pink
    iconName: "Palette"
  },
  oracle: {
    id: "oracle",
    name: "Data Oracle",
    simpleLabel: "AI & data",
    partnerHint: "Pairs well with product builders",
    description: "Works with data, machine learning, and predictions.",
    centroid: [0.5, 0.8],
    color: "#8B5CF6", // Purple
    iconName: "Sparkles"
  },
  maverick: {
    id: "maverick",
    name: "Ship-It Maverick",
    simpleLabel: "Fast product builder",
    partnerHint: "Pairs well with AI & UI specialists",
    description: "Ships MVPs quickly — startups, hackathons, rapid prototypes.",
    centroid: [-0.2, 0.3],
    color: "#F59E0B", // Amber
    iconName: "Rocket"
  },
  sentinel: {
    id: "sentinel",
    name: "Cyber Sentinel",
    simpleLabel: "DevOps & security",
    partnerHint: "Pairs well with system architects",
    description: "Secures servers, cloud infrastructure, and deployments.",
    centroid: [0.9, -0.7],
    color: "#10B981", // Emerald
    iconName: "Shield"
  }
};

// 2. Zodiac Sign to Element Mapping
export const ZODIAC_ELEMENTS: Record<string, string> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
  Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air",
  Cancer: "Water", Scorpio: "Water", Pisces: "Water"
};

// 3. Astrological Element Harmony Matrix [Element1][Element2] -> percentage [0-100]
export const ZODIAC_HARMONY: Record<string, Record<string, number>> = {
  Fire: { Fire: 100, Air: 90, Earth: 40, Water: 20 },
  Air: { Fire: 90, Air: 100, Earth: 40, Water: 40 },
  Earth: { Fire: 40, Air: 40, Earth: 100, Water: 90 },
  Water: { Fire: 20, Air: 40, Earth: 90, Water: 100 }
};

// 4. Feature weights representing "PCA Component loadings"
// Maps specific keywords/skills to their pre-trained weights for: [PCA Component 1, PCA Component 2]
const TECH_LOADINGS: Record<string, [number, number]> = {
  // Backend & Low-Level (Architect/Sentinel)
  rust: [0.8, -0.2],
  go: [0.7, -0.1],
  sql: [0.6, -0.3],
  postgresql: [0.6, -0.2],
  cpp: [0.9, -0.3],
  java: [0.5, -0.1],
  database: [0.7, -0.2],
  graphql: [0.3, -0.2],

  // Frontend & UI (Pixel/Maverick)
  typescript: [-0.6, -0.4],
  javascript: [-0.5, -0.3],
  html: [-0.8, -0.6],
  css: [-0.9, -0.7],
  react: [-0.4, -0.1],
  vue: [-0.5, -0.3],
  tailwind: [-0.7, -0.5],
  motion: [-0.8, -0.6],

  // Data & ML (Oracle)
  python: [0.3, 0.7],
  numpy: [0.4, 0.8],
  pandas: [0.4, 0.8],
  pytorch: [0.5, 0.9],
  tensorflow: [0.5, 0.9],
  scikit: [0.4, 0.8],

  // Ops & Infrastructure (Sentinel)
  bash: [0.8, -0.6],
  shell: [0.8, -0.6],
  linux: [0.9, -0.5],
  docker: [0.8, -0.5],
  kubernetes: [0.9, -0.6],
  aws: [0.6, -0.4],
  gcp: [0.6, -0.4],
};

const INTEREST_LOADINGS: Record<string, [number, number]> = {
  // Tech Sectors
  frontend: [-0.8, -0.5],
  "ui/ux": [-0.9, -0.6],
  design: [-0.9, -0.7],
  animations: [-0.8, -0.6],

  backend: [0.7, -0.1],
  databases: [0.8, -0.2],
  "system design": [0.8, -0.1],

  ai: [0.4, 0.8],
  "machine learning": [0.5, 0.9],
  "data science": [0.4, 0.8],
  statistics: [0.3, 0.7],

  security: [0.9, -0.6],
  devops: [0.8, -0.5],
  cloud: [0.7, -0.4],
  linux: [0.8, -0.5],

  mvp: [-0.2, 0.4],
  startups: [-0.3, 0.3],
  "rapid prototyping": [-0.4, 0.4],
  hackathons: [-0.3, 0.2]
};

const TEXT_KEYWORD_LOADINGS: Record<string, [number, number]> = {
  scale: [0.6, -0.1],
  scalability: [0.7, -0.1],
  performance: [0.5, -0.2],
  concurrency: [0.8, -0.2],
  latency: [0.8, -0.2],
  architecture: [0.6, -0.1],
  "clean code": [0.4, -0.2],

  pixel: [-0.8, -0.6],
  fluid: [-0.7, -0.5],
  interactive: [-0.6, -0.4],
  gorgeous: [-0.8, -0.6],
  aesthetic: [-0.8, -0.7],
  animation: [-0.8, -0.5],
  creative: [-0.5, -0.3],

  prediction: [0.3, 0.7],
  model: [0.4, 0.8],
  training: [0.4, 0.8],
  dataset: [0.5, 0.7],
  llm: [0.5, 0.9],
  neural: [0.5, 0.9],
  insights: [0.3, 0.5],

  startup: [-0.3, 0.3],
  product: [-0.2, 0.3],
  launch: [-0.2, 0.4],
  fast: [-0.2, 0.2],
  saas: [-0.3, 0.3],
  prototype: [-0.4, 0.4],

  secure: [0.8, -0.6],
  hacking: [0.9, -0.6],
  deployment: [0.6, -0.4],
  pipeline: [0.7, -0.5],
  ci: [0.7, -0.5],
  cd: [0.7, -0.5],
  container: [0.8, -0.5]
};

// 5. Predict Archetype function - Runs live profile inputs through the offline ML model emulation
export function predictArchetype(
  languages: string[],
  interests: string[],
  buildGoal: string
): { archetypeId: string; pcaCoords: [number, number] } {
  let xTotal = 0;
  let yTotal = 0;
  let weightSum = 0;

  // Process languages
  languages.forEach(lang => {
    const key = lang.toLowerCase().trim();
    if (TECH_LOADINGS[key]) {
      xTotal += TECH_LOADINGS[key][0] * 1.5;
      yTotal += TECH_LOADINGS[key][1] * 1.5;
      weightSum += 1.5;
    }
  });

  // Process interests
  interests.forEach(interest => {
    const key = interest.toLowerCase().trim();
    if (INTEREST_LOADINGS[key]) {
      xTotal += INTEREST_LOADINGS[key][0] * 1.2;
      yTotal += INTEREST_LOADINGS[key][1] * 1.2;
      weightSum += 1.2;
    }
  });

  // Tokenize and process buildGoal text
  const tokens = buildGoal.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  tokens.forEach(token => {
    if (TEXT_KEYWORD_LOADINGS[token]) {
      xTotal += TEXT_KEYWORD_LOADINGS[token][0] * 0.8;
      yTotal += TEXT_KEYWORD_LOADINGS[token][1] * 0.8;
      weightSum += 0.8;
    }
  });

  // Default coordinate if no features are found
  let x_pca = 0;
  let y_pca = 0;

  if (weightSum > 0) {
    x_pca = xTotal / weightSum;
    y_pca = yTotal / weightSum;
  }

  // Bound the coordinate to [-1, 1] space for nice visualization
  x_pca = Math.max(-1, Math.min(1, x_pca));
  y_pca = Math.max(-1, Math.min(1, y_pca));

  // Find nearest centroid (k-Means)
  let nearestArchetypeId = "maverick"; // Default
  let minDistance = Infinity;

  Object.entries(ARCHETYPES).forEach(([id, arch]) => {
    const dx = x_pca - arch.centroid[0];
    const dy = y_pca - arch.centroid[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDistance) {
      minDistance = dist;
      nearestArchetypeId = id;
    }
  });

  return {
    archetypeId: nearestArchetypeId,
    pcaCoords: [x_pca, y_pca]
  };
}

// 6. Compute Jaccard Similarity between two arrays
export function getJaccardSimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0;
  const set1 = new Set(arr1.map(s => s.toLowerCase().trim()));
  const set2 = new Set(arr2.map(s => s.toLowerCase().trim()));
  
  const intersectionSize = [...set1].filter(x => set2.has(x)).length;
  const unionSize = new Set([...set1, ...set2]).size;
  
  return intersectionSize / unionSize;
}

// 7. Core TF-IDF similarity of build goals (Vector Cosine Similarity)
export function getBuildGoalSimilarity(text1: string, text2: string): number {
  const t1 = text1.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const t2 = text2.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);

  if (t1.length === 0 || t2.length === 0) return 0;

  // Create word term frequency vectors
  const tf1: Record<string, number> = {};
  const tf2: Record<string, number> = {};

  t1.forEach(word => { tf1[word] = (tf1[word] || 0) + 1; });
  t2.forEach(word => { tf2[word] = (tf2[word] || 0) + 1; });

  const uniqueWords = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  uniqueWords.forEach(word => {
    const v1 = tf1[word] || 0;
    const v2 = tf2[word] || 0;
    dotProduct += v1 * v2;
    mag1 += v1 * v1;
    mag2 += v2 * v2;
  });

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// 8. Compute the 5-Factor Score matching algorithm
export function calculateMatchScore(
  userProfile: { languages: string[]; interests: string[]; buildGoal: string; zodiacSign: string; archetypeId: string },
  candidateProfile: { languages: string[]; interests: string[]; buildGoal: string; zodiacSign: string; archetypeId: string }
) {
  // 1. Tech Stack Overlap (30%) - Jaccard
  const techStackOverlap = getJaccardSimilarity(userProfile.languages, candidateProfile.languages);

  // 2. Interests Overlap (20%) - Jaccard
  const interestsOverlap = getJaccardSimilarity(userProfile.interests, candidateProfile.interests);

  // 3. Archetype Fit (25%) - Centroid affinity or complementarity
  // Complementary score: 100% if identical, and custom weights for synergistic roles
  let archetypeFit = 40; // baseline
  if (userProfile.archetypeId === candidateProfile.archetypeId) {
    archetypeFit = 100; // Direct soulmate
  } else {
    // Synergistic pairs
    const p1 = userProfile.archetypeId;
    const p2 = candidateProfile.archetypeId;
    if ((p1 === "pixel" && p2 === "architect") || (p1 === "architect" && p2 === "pixel")) archetypeFit = 95; // UI wizard + Backend scaler
    else if ((p1 === "maverick" && p2 === "oracle") || (p1 === "oracle" && p2 === "maverick")) archetypeFit = 90; // Product dev + AI scientist
    else if ((p1 === "architect" && p2 === "sentinel") || (p1 === "sentinel" && p2 === "architect")) archetypeFit = 85; // System architect + DevOps guardian
    else if ((p1 === "maverick" && p2 === "pixel") || (p1 === "pixel" && p2 === "maverick")) archetypeFit = 80;
    else if ((p1 === "oracle" && p2 === "architect") || (p1 === "architect" && p2 === "oracle")) archetypeFit = 75;
  }

  // 4. Astrological Element Harmony (15%)
  const el1 = ZODIAC_ELEMENTS[userProfile.zodiacSign] || "Fire";
  const el2 = ZODIAC_ELEMENTS[candidateProfile.zodiacSign] || "Fire";
  const zodiacHarmony = ZODIAC_HARMONY[el1]?.[el2] || 50;

  // 5. Build Goal Text Similarity (10%)
  const buildGoalSimilarity = getBuildGoalSimilarity(userProfile.buildGoal, candidateProfile.buildGoal);

  // Weights
  const wTech = 0.30;
  const wInterests = 0.20;
  const wArchetype = 0.25;
  const wZodiac = 0.15;
  const wBuildGoal = 0.10;

  const finalScore = Math.round(
    (techStackOverlap * 100 * wTech) +
    (interestsOverlap * 100 * wInterests) +
    (archetypeFit * wArchetype) +
    (zodiacHarmony * wZodiac) +
    (buildGoalSimilarity * 100 * wBuildGoal)
  );

  return {
    compatibilityScore: finalScore,
    scores: {
      archetypeFit: Math.round(archetypeFit),
      techStackOverlap: Math.round(techStackOverlap * 100),
      interestsOverlap: Math.round(interestsOverlap * 100),
      zodiacHarmony: Math.round(zodiacHarmony),
      buildGoalSimilarity: Math.round(buildGoalSimilarity * 100)
    }
  };
}
