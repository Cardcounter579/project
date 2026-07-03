/**
 * One-off idempotent backfill: add any missing demo seed users/profiles from
 * server_demo_seed.ts into the EXISTING data/db.json without touching real
 * accounts, connections, or messages. Safe to run multiple times.
 */
import fs from "fs";
import path from "path";
import { DEMO_SEED_USERS, DEMO_SEED_PROFILES } from "./server_demo_seed";
import { predictArchetype, ZODIAC_ELEMENTS } from "./src/ml_artifacts";
import { hashPassword } from "./server_db";

const DB_FILE = path.join(process.cwd(), "data", "db.json");
const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));

const existingUserIds = new Set(db.users.map((u: any) => u.id));
const existingProfileIds = new Set(db.profiles.map((p: any) => p.userId));
const genericPasswordHash = hashPassword("password123");
const now = new Date().toISOString();

let addedUsers = 0;
let addedProfiles = 0;

for (const su of DEMO_SEED_USERS) {
  if (!existingUserIds.has(su.id)) {
    db.users.push({ id: su.id, email: su.email, passwordHash: genericPasswordHash, createdAt: now });
    addedUsers++;
  }
}

for (const sp of DEMO_SEED_PROFILES) {
  if (!existingProfileIds.has(sp.userId)) {
    const zodiacElement = ZODIAC_ELEMENTS[sp.zodiacSign] || "Fire";
    const { archetypeId } = predictArchetype(sp.languages, sp.interests, sp.buildGoal);
    db.profiles.push({
      userId: sp.userId,
      displayName: sp.displayName,
      languages: sp.languages,
      interests: sp.interests,
      buildGoal: sp.buildGoal,
      zodiacSign: sp.zodiacSign,
      zodiacElement,
      archetypeId,
      updatedAt: now,
    });
    addedProfiles++;
  }
}

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
console.log(`Backfill complete: +${addedUsers} users, +${addedProfiles} profiles.`);
console.log(`Totals now: ${db.users.length} users, ${db.profiles.length} profiles.`);
