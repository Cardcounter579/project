import fs from "fs";
import path from "path";
import crypto from "crypto";
import { User, Profile, Connection, ConnectionStatus, Message } from "./src/types";
import { predictArchetype, ZODIAC_ELEMENTS } from "./src/ml_artifacts";
import { buildDemoDatabase } from "./server_demo_seed";

const DB_FILE = path.join(process.cwd(), "data", "db.json");

// Helper to ensure database directory and file exist
function ensureDb() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [] as User[],
      profiles: [] as Profile[],
      connections: [] as Connection[],
      messages: [] as Message[],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    seedDb();
  }
}

// Simple PBKDF2 Password Hashing
export function hashPassword(password: string, salt: string = "zetwork-salt"): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export interface DBStructure {
  users: User[];
  profiles: Profile[];
  connections: Connection[];
  messages: Message[];
}

export class JSONDatabase {
  static read(): DBStructure {
    ensureDb();
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      parsed.connections = (parsed.connections || []).map((c: Connection) => ({
        ...c,
        status: c.status || "accepted",
      }));
      parsed.messages = parsed.messages || [];
      return parsed;
    } catch (e) {
      console.error("Error reading database file, returning empty structure:", e);
      return { users: [], profiles: [], connections: [], messages: [] };
    }
  }

  static write(data: DBStructure) {
    ensureDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  }

  static findUserByEmail(email: string): User | undefined {
    const db = this.read();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  static findUserById(id: string): User | undefined {
    const db = this.read();
    return db.users.find(u => u.id === id);
  }

  static findProfileById(userId: string): Profile | undefined {
    const db = this.read();
    return db.profiles.find(p => p.userId === userId);
  }

  static createUser(email: string, passwordHash: string): User {
    const db = this.read();
    const newUser: User = {
      id: crypto.randomUUID(),
      email: email.trim(),
      passwordHash,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    this.write(db);
    return newUser;
  }

  static saveProfile(userId: string, profileData: Omit<Profile, "userId" | "zodiacElement" | "archetypeId" | "updatedAt">): Profile {
    const db = this.read();
    
    // Derive fields
    const zodiacElement = ZODIAC_ELEMENTS[profileData.zodiacSign] || "Fire";
    const { archetypeId } = predictArchetype(
      profileData.languages,
      profileData.interests,
      profileData.buildGoal
    );

    const updatedProfile: Profile = {
      userId,
      displayName: profileData.displayName.trim() || "Anonymous Developer",
      languages: profileData.languages,
      interests: profileData.interests,
      buildGoal: profileData.buildGoal.trim(),
      zodiacSign: profileData.zodiacSign,
      zodiacElement,
      archetypeId,
      updatedAt: new Date().toISOString()
    };

    const index = db.profiles.findIndex(p => p.userId === userId);
    if (index !== -1) {
      db.profiles[index] = updatedProfile;
    } else {
      db.profiles.push(updatedProfile);
    }

    this.write(db);
    return updatedProfile;
  }

  static getAllProfiles(): Profile[] {
    const db = this.read();
    return db.profiles;
  }

  static findConnection(fromUserId: string, toUserId: string): Connection | undefined {
    const db = this.read();
    return db.connections.find(c => c.fromUserId === fromUserId && c.toUserId === toUserId);
  }

  static getConnectionStatus(userId: string, otherUserId: string): ConnectionStatus | "none" {
    const direct = this.findConnection(userId, otherUserId);
    if (direct) return direct.status;

    const reverse = this.findConnection(otherUserId, userId);
    if (reverse) return reverse.status === "pending" ? "pending" : reverse.status;

    return "none";
  }

  static isAcceptedConnection(userId: string, otherUserId: string): boolean {
    const db = this.read();
    return db.connections.some(
      c =>
        c.status === "accepted" &&
        ((c.fromUserId === userId && c.toUserId === otherUserId) ||
          (c.fromUserId === otherUserId && c.toUserId === userId))
    );
  }

  static getAcceptedConnections(userId: string): Connection[] {
    const db = this.read();
    return db.connections.filter(
      c =>
        c.status === "accepted" &&
        (c.fromUserId === userId || c.toUserId === userId)
    );
  }

  static getIncomingPending(userId: string): Connection[] {
    const db = this.read();
    return db.connections.filter(c => c.toUserId === userId && c.status === "pending");
  }

  static getOutgoingPending(userId: string): Connection[] {
    const db = this.read();
    return db.connections.filter(c => c.fromUserId === userId && c.status === "pending");
  }

  static sendConnectionRequest(fromUserId: string, toUserId: string): Connection {
    const db = this.read();
    const existing = db.connections.find(c => c.fromUserId === fromUserId && c.toUserId === toUserId);

    if (existing) {
      if (existing.status === "rejected") {
        existing.status = "pending";
        existing.updatedAt = new Date().toISOString();
        this.write(db);
        return existing;
      }
      return existing;
    }

    const reverse = db.connections.find(c => c.fromUserId === toUserId && c.toUserId === fromUserId);
    if (reverse?.status === "accepted") {
      return reverse;
    }
    if (reverse?.status === "pending") {
      throw new Error("This developer already sent you a request. Check your Requests tab.");
    }

    const connection: Connection = {
      fromUserId,
      toUserId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    db.connections.push(connection);
    this.write(db);
    return connection;
  }

  static respondToRequest(toUserId: string, fromUserId: string, action: "accept" | "reject"): Connection {
    const db = this.read();
    const connection = db.connections.find(
      c => c.fromUserId === fromUserId && c.toUserId === toUserId && c.status === "pending"
    );

    if (!connection) {
      throw new Error("Connection request not found.");
    }

    connection.status = action === "accept" ? "accepted" : "rejected";
    connection.updatedAt = new Date().toISOString();
    this.write(db);
    return connection;
  }

  static getMessages(userId: string, otherUserId: string): Message[] {
    const db = this.read();
    return (db.messages || [])
      .filter(
        m =>
          (m.fromUserId === userId && m.toUserId === otherUserId) ||
          (m.fromUserId === otherUserId && m.toUserId === userId)
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  static getLastMessage(userId: string, otherUserId: string): Message | undefined {
    const messages = this.getMessages(userId, otherUserId);
    return messages[messages.length - 1];
  }

  static sendMessage(fromUserId: string, toUserId: string, text: string): Message {
    if (!this.isAcceptedConnection(fromUserId, toUserId)) {
      throw new Error("You can only message connected developers.");
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Message cannot be empty.");
    }
    if (trimmed.length > 2000) {
      throw new Error("Message is too long (max 2000 characters).");
    }

    const db = this.read();
    db.messages = db.messages || [];
    const message: Message = {
      id: crypto.randomUUID(),
      fromUserId,
      toUserId,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(message);
    this.write(db);
    return message;
  }
}

// Pre-seed Mongolian-context demo developers
function seedDb() {
  const db = buildDemoDatabase(hashPassword);
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  console.log(`Successfully pre-seeded ${db.profiles.length} demo developers in database!`);
}
