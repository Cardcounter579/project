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
  // International developers — the wider Zetwork network beyond Ulaanbaatar
  { id: "seed-11", email: "aria.chen@zetwork.dev", name: "Aria Chen", zodiac: "Sagittarius" },
  { id: "seed-12", email: "mateo.rossi@zetwork.dev", name: "Mateo Rossi", zodiac: "Gemini" },
  { id: "seed-13", email: "yuki.tanaka@zetwork.dev", name: "Yuki Tanaka", zodiac: "Virgo" },
  { id: "seed-14", email: "fatima.alrashid@zetwork.dev", name: "Fatima Al-Rashid", zodiac: "Libra" },
  { id: "seed-15", email: "kwame.mensah@zetwork.dev", name: "Kwame Mensah", zodiac: "Leo" },
  { id: "seed-16", email: "sofia.petrova@zetwork.dev", name: "Sofia Petrova", zodiac: "Taurus" },
  { id: "seed-17", email: "rajesh.kumar@zetwork.dev", name: "Rajesh Kumar", zodiac: "Capricorn" },
  { id: "seed-18", email: "emma.johansson@zetwork.dev", name: "Emma Johansson", zodiac: "Aquarius" },
  { id: "seed-19", email: "liam.obrien@zetwork.dev", name: "Liam O'Brien", zodiac: "Aries" },
  { id: "seed-20", email: "chen.wei@zetwork.dev", name: "Chen Wei", zodiac: "Scorpio" },
  { id: "seed-21", email: "ananya.sharma@zetwork.dev", name: "Ananya Sharma", zodiac: "Pisces" },
  { id: "seed-22", email: "diego.fernandez@zetwork.dev", name: "Diego Fernández", zodiac: "Cancer" },
  { id: "seed-23", email: "nour.haddad@zetwork.dev", name: "Nour Haddad", zodiac: "Gemini" },
  { id: "seed-24", email: "kenji.sato@zetwork.dev", name: "Kenji Sato", zodiac: "Virgo" },
  { id: "seed-25", email: "olga.ivanova@zetwork.dev", name: "Olga Ivanova", zodiac: "Libra" },
  { id: "seed-26", email: "marcus.bell@zetwork.dev", name: "Marcus Bell", zodiac: "Sagittarius" },
  { id: "seed-27", email: "priya.nair@zetwork.dev", name: "Priya Nair", zodiac: "Leo" },
  { id: "seed-28", email: "tomas.silva@zetwork.dev", name: "Tomás Silva", zodiac: "Taurus" },
  { id: "seed-29", email: "zara.ahmed@zetwork.dev", name: "Zara Ahmed", zodiac: "Aquarius" },
  { id: "seed-30", email: "hiroshi.yamada@zetwork.dev", name: "Hiroshi Yamada", zodiac: "Scorpio" },
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
  {
    userId: "seed-11",
    displayName: "Aria Chen",
    languages: ["TypeScript", "React", "CSS", "Tailwind", "Motion"],
    interests: ["Frontend", "UI/UX", "Design", "Animations"],
    buildGoal:
      "Designing a polished portfolio and design-system library for indie creators with fluid, interactive, gorgeous animations.",
    zodiacSign: "Sagittarius",
  },
  {
    userId: "seed-12",
    displayName: "Mateo Rossi",
    languages: ["JavaScript", "React", "TypeScript"],
    interests: ["MVP", "Startups", "Rapid Prototyping", "Hackathons"],
    buildGoal:
      "Launching a fast SaaS product to help small restaurants take online orders — ship the MVP and iterate quickly.",
    zodiacSign: "Gemini",
  },
  {
    userId: "seed-13",
    displayName: "Yuki Tanaka",
    languages: ["Python", "PyTorch", "NumPy", "Pandas", "SQL"],
    interests: ["AI", "Machine Learning", "Data Science", "Statistics"],
    buildGoal:
      "Training a recommendation model on retail datasets and building prediction pipelines for demand forecasting.",
    zodiacSign: "Virgo",
  },
  {
    userId: "seed-14",
    displayName: "Fatima Al-Rashid",
    languages: ["Go", "PostgreSQL", "SQL", "GraphQL"],
    interests: ["Backend", "Databases", "System Design"],
    buildGoal:
      "Architecting a scalable, low-latency backend and clean database design for a regional logistics platform.",
    zodiacSign: "Libra",
  },
  {
    userId: "seed-15",
    displayName: "Kwame Mensah",
    languages: ["Linux", "Bash", "Docker", "Kubernetes", "Go"],
    interests: ["DevOps", "Cloud", "Security", "Linux"],
    buildGoal:
      "Building secure CI/CD pipelines and hardened container infrastructure for a fintech platform across Africa.",
    zodiacSign: "Leo",
  },
  {
    userId: "seed-16",
    displayName: "Sofia Petrova",
    languages: ["TypeScript", "React", "CSS", "Tailwind"],
    interests: ["Frontend", "UI/UX", "Design"],
    buildGoal:
      "Crafting an aesthetic, mobile-first UI for a mental-health journaling app with smooth, creative micro-interactions.",
    zodiacSign: "Taurus",
  },
  {
    userId: "seed-17",
    displayName: "Rajesh Kumar",
    languages: ["Java", "SQL", "PostgreSQL", "Go"],
    interests: ["Backend", "Databases", "System Design"],
    buildGoal:
      "Designing a high-concurrency payments backend with strong scalability and clean architecture for enterprise clients.",
    zodiacSign: "Capricorn",
  },
  {
    userId: "seed-18",
    displayName: "Emma Johansson",
    languages: ["Python", "PyTorch", "Pandas", "SQL"],
    interests: ["AI", "Machine Learning", "Data Science"],
    buildGoal:
      "Building an LLM-powered insights tool that trains on customer feedback datasets to surface product predictions.",
    zodiacSign: "Aquarius",
  },
  {
    userId: "seed-19",
    displayName: "Liam O'Brien",
    languages: ["JavaScript", "React", "TypeScript"],
    interests: ["MVP", "Startups", "Hackathons", "Rapid Prototyping"],
    buildGoal:
      "Shipping a fast prototype for a community events marketplace — launch quickly, validate, and grow the product.",
    zodiacSign: "Aries",
  },
  {
    userId: "seed-20",
    displayName: "Chen Wei",
    languages: ["Rust", "Linux", "Docker", "Bash"],
    interests: ["Security", "DevOps", "Cloud", "Linux"],
    buildGoal:
      "Hardening cloud deployment pipelines and container security for a global e-commerce infrastructure team.",
    zodiacSign: "Scorpio",
  },
  {
    userId: "seed-21",
    displayName: "Ananya Sharma",
    languages: ["Python", "NumPy", "Pandas", "SQL", "PyTorch"],
    interests: ["Data Science", "Statistics", "AI", "Machine Learning"],
    buildGoal:
      "Analyzing healthcare datasets and building predictive models to forecast patient readmission risk with clear insights.",
    zodiacSign: "Pisces",
  },
  {
    userId: "seed-22",
    displayName: "Diego Fernández",
    languages: ["Go", "Rust", "PostgreSQL", "SQL"],
    interests: ["Backend", "Databases", "System Design"],
    buildGoal:
      "Building a distributed, low-latency backend with clean system architecture for a real-time sports data service.",
    zodiacSign: "Cancer",
  },
  {
    userId: "seed-23",
    displayName: "Nour Haddad",
    languages: ["TypeScript", "React", "CSS", "Tailwind", "Motion"],
    interests: ["Frontend", "UI/UX", "Design", "Animations"],
    buildGoal:
      "Designing a gorgeous, interactive landing experience and design system for a creative studio with fluid animations.",
    zodiacSign: "Gemini",
  },
  {
    userId: "seed-24",
    displayName: "Kenji Sato",
    languages: ["Linux", "Bash", "Docker", "Kubernetes"],
    interests: ["DevOps", "Cloud", "Security"],
    buildGoal:
      "Setting up secure, automated deployment pipelines and cloud infrastructure for a robotics research lab.",
    zodiacSign: "Virgo",
  },
  {
    userId: "seed-25",
    displayName: "Olga Ivanova",
    languages: ["JavaScript", "React", "TypeScript"],
    interests: ["MVP", "Startups", "Rapid Prototyping"],
    buildGoal:
      "Building a lean MVP for a freelance-matching startup — ship fast, launch, and iterate with rapid prototyping.",
    zodiacSign: "Libra",
  },
  {
    userId: "seed-26",
    displayName: "Marcus Bell",
    languages: ["Java", "Go", "PostgreSQL", "SQL", "GraphQL"],
    interests: ["Backend", "Databases", "System Design"],
    buildGoal:
      "Designing a scalable API gateway and database layer with strong performance for a high-traffic media platform.",
    zodiacSign: "Sagittarius",
  },
  {
    userId: "seed-27",
    displayName: "Priya Nair",
    languages: ["Python", "PyTorch", "NumPy", "Pandas"],
    interests: ["AI", "Machine Learning", "Data Science", "Statistics"],
    buildGoal:
      "Training neural models on satellite imagery to predict crop yields, with a data-science dashboard for insights.",
    zodiacSign: "Leo",
  },
  {
    userId: "seed-28",
    displayName: "Tomás Silva",
    languages: ["JavaScript", "React", "TypeScript"],
    interests: ["MVP", "Startups", "Hackathons", "Rapid Prototyping"],
    buildGoal:
      "Prototyping a SaaS analytics dashboard for indie founders — build fast, launch the product, and grow.",
    zodiacSign: "Taurus",
  },
  {
    userId: "seed-29",
    displayName: "Zara Ahmed",
    languages: ["TypeScript", "React", "CSS", "Tailwind"],
    interests: ["Frontend", "UI/UX", "Design", "Animations"],
    buildGoal:
      "Creating an accessible, beautiful UI for an online learning platform with clean design and smooth animations.",
    zodiacSign: "Aquarius",
  },
  {
    userId: "seed-30",
    displayName: "Hiroshi Yamada",
    languages: ["Rust", "Linux", "Docker", "Kubernetes", "Bash"],
    interests: ["Security", "DevOps", "Cloud", "Linux"],
    buildGoal:
      "Securing cloud infrastructure and building resilient deployment pipelines for an IoT device fleet at scale.",
    zodiacSign: "Scorpio",
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
