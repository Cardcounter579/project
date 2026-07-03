export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Profile {
  userId: string;
  displayName: string;
  languages: string[];
  interests: string[];
  buildGoal: string;
  zodiacSign: string;
  zodiacElement: string; // Derived: Fire, Earth, Air, Water
  archetypeId: string;   // Assigned via ML k-Means Centroid
  updatedAt: string;
}

export type ConnectionStatus = "pending" | "accepted" | "rejected";

export interface Connection {
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ConnectionRequest {
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  createdAt: string;
  displayName: string;
  archetypeId: string | null;
  zodiacSign: string | null;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: string;
}

export interface ConnectedPeer {
  userId: string;
  displayName: string;
  archetypeId: string | null;
  zodiacSign: string | null;
  connectedAt: string;
  lastMessage?: {
    text: string;
    fromUserId: string;
    createdAt: string;
  } | null;
}

export interface Archetype {
  id: string;
  name: string;
  simpleLabel: string;
  partnerHint: string;
  description: string;
  centroid: [number, number]; // 2D PCA representation
  color: string;             // Theme color for the archetype
  iconName: string;          // Lucide icon key
}

export interface MatchScores {
  archetypeFit: number;       // 25%
  techStackOverlap: number;   // 30%
  interestsOverlap: number;   // 20%
  zodiacHarmony: number;      // 15%
  buildGoalSimilarity: number;// 10%
}

export interface Match {
  userId: string;
  displayName: string;
  languages: string[];
  interests: string[];
  buildGoal: string;
  zodiacSign: string;
  zodiacElement: string;
  archetypeId: string;
  compatibilityScore: number; // Overall combined score [0-100]
  scores: MatchScores;
  // Position coordinates in the 2D constellation space
  x: number;
  y: number;
  connected?: boolean;
  connectionStatus?: "none" | "pending_out" | "pending_in" | "accepted";
}
