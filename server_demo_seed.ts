import crypto from "crypto";
import { User, Profile, Connection, Message } from "./src/types";
import { predictArchetype, ZODIAC_ELEMENTS } from "./src/ml_artifacts";

export interface DemoDatabase {
  users: User[];
  profiles: Profile[];
  connections: Connection[];
  messages: Message[];
}

/** Default demo developers — Mongolian names & local project context */
export const DEMO_SEED_USERS = [
  { id: "seed-1", email: "baterdene@zetwork.mn", name: "Бат-Эрдэнэ", zodiac: "Capricorn" },
  { id: "seed-2", email: "oyunbileg@zetwork.mn", name: "Оюунбилэг", zodiac: "Libra" },
  { id: "seed-3", email: "temuulen@zetwork.mn", name: "Тэмүүлэн", zodiac: "Scorpio" },
  { id: "seed-4", email: "nomin@zetwork.mn", name: "Номин", zodiac: "Leo" },
  { id: "seed-5", email: "ganbat@zetwork.mn", name: "Ганбат", zodiac: "Virgo" },
  { id: "seed-6", email: "saraa@zetwork.mn", name: "Сараа", zodiac: "Cancer" },
  { id: "seed-7", email: "bolormaa@zetwork.mn", name: "Болормаа", zodiac: "Taurus" },
  { id: "seed-8", email: "enkhbayar@zetwork.mn", name: "Энхбаяр", zodiac: "Aries" },
  { id: "seed-9", email: "munkhzul@zetwork.mn", name: "Мөнхзул", zodiac: "Pisces" },
  { id: "seed-10", email: "tsetseg@zetwork.mn", name: "Цэцэг", zodiac: "Aquarius" },
];

export const DEMO_SEED_PROFILES = [
  {
    userId: "seed-1",
    displayName: "Бат-Эрдэнэ",
    languages: ["Go", "PostgreSQL", "SQL", "Docker"],
    interests: ["Backend", "Databases", "System Design"],
    buildGoal:
      "Building a QR payment and wallet API for small shops in Ulaanbaatar with scalable backend architecture and low latency.",
    zodiacSign: "Capricorn",
  },
  {
    userId: "seed-2",
    displayName: "Оюунбилэг",
    languages: ["TypeScript", "React", "CSS", "Tailwind", "Motion"],
    interests: ["Frontend", "UI/UX", "Design", "Animations"],
    buildGoal:
      "Designing a beautiful booking website for Mongolian ger camps and domestic tourism with fluid animations and mobile-first UI.",
    zodiacSign: "Libra",
  },
  {
    userId: "seed-3",
    displayName: "Тэмүүлэн",
    languages: ["Python", "PyTorch", "SQL", "JavaScript"],
    interests: ["AI", "Machine Learning", "Data Science"],
    buildGoal:
      "Training a model to forecast air pollution levels in Ulaanbaatar using open weather and traffic datasets.",
    zodiacSign: "Scorpio",
  },
  {
    userId: "seed-4",
    displayName: "Номин",
    languages: ["TypeScript", "JavaScript", "React", "HTML", "CSS"],
    interests: ["MVP", "Startups", "Rapid Prototyping", "Hackathons"],
    buildGoal:
      "Launching a fast MVP marketplace for Mongolian handmade cashmere products with rapid prototyping and quick deployment.",
    zodiacSign: "Leo",
  },
  {
    userId: "seed-5",
    displayName: "Ганбат",
    languages: ["Linux", "Bash", "Docker", "Kubernetes", "Go"],
    interests: ["DevOps", "Cloud", "Security", "Linux"],
    buildGoal:
      "Setting up secure CI/CD pipelines and container infrastructure for a Mongolian mining-tech SaaS platform.",
    zodiacSign: "Virgo",
  },
  {
    userId: "seed-6",
    displayName: "Сараа",
    languages: ["JavaScript", "React", "CSS", "Tailwind"],
    interests: ["Frontend", "UI/UX", "Design"],
    buildGoal:
      "Creating an interactive e-learning platform UI for Mongolian high school students with clean design and animations.",
    zodiacSign: "Cancer",
  },
  {
    userId: "seed-7",
    displayName: "Болормаа",
    languages: ["Java", "SQL", "PostgreSQL", "GraphQL"],
    interests: ["Backend", "Databases", "System Design"],
    buildGoal:
      "Developing a citizen services portal backend for government forms with secure database design and system architecture.",
    zodiacSign: "Taurus",
  },
  {
    userId: "seed-8",
    displayName: "Энхбаяр",
    languages: ["JavaScript", "React", "TypeScript", "CSS"],
    interests: ["MVP", "Startups", "Hackathons", "Rapid Prototyping"],
    buildGoal:
      "Building a hackathon project that matches freelance developers with local startups in Mongolia — ship fast, launch in days.",
    zodiacSign: "Aries",
  },
  {
    userId: "seed-9",
    displayName: "Мөнхзул",
    languages: ["Python", "SQL", "JavaScript"],
    interests: ["Data Science", "Statistics", "AI", "Machine Learning"],
    buildGoal:
      "Analyzing livestock and herder market data for a Mongolian NGO dashboard with predictions and data science insights.",
    zodiacSign: "Pisces",
  },
  {
    userId: "seed-10",
    displayName: "Цэцэг",
    languages: ["Rust", "Linux", "Docker", "Bash"],
    interests: ["Security", "DevOps", "Cloud"],
    buildGoal:
      "Hardening cloud security and deployment pipelines for a fintech startup serving rural banking customers in Mongolia.",
    zodiacSign: "Aquarius",
  },
];

export function buildDemoDatabase(hashPassword: (password: string) => string): DemoDatabase {
  const db: DemoDatabase = { users: [], profiles: [], connections: [], messages: [] };
  const genericPasswordHash = hashPassword("password123");
  const now = new Date().toISOString();

  DEMO_SEED_USERS.forEach((su) => {
    db.users.push({
      id: su.id,
      email: su.email,
      passwordHash: genericPasswordHash,
      createdAt: now,
    });
  });

  DEMO_SEED_PROFILES.forEach((sp) => {
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
  });

  // One accepted connection + sample chat (demo flow)
  db.connections.push({
    fromUserId: "seed-2",
    toUserId: "seed-1",
    status: "accepted",
    createdAt: now,
    updatedAt: now,
  });

  db.messages.push(
    {
      id: crypto.randomUUID(),
      fromUserId: "seed-2",
      toUserId: "seed-1",
      text: "Сайн уу! Танай төлбөрийн API-д frontend холбох гэсэн юм. Хамтрах уу?",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      fromUserId: "seed-1",
      toUserId: "seed-2",
      text: "Сайн байна уу! Тийм ээ, маргааш ярилцъя.",
      createdAt: now,
    }
  );

  return db;
}
