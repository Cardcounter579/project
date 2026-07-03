import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { JSONDatabase, hashPassword } from "./server_db";
import { ARCHETYPES, calculateMatchScore, predictArchetype } from "./src/ml_artifacts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SECRET_KEY = process.env.JWT_SECRET || "super-secret-key-zetwork-2026";

app.use(express.json());

// JWT Token Utilities
function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString("base64url"); // 24 hour expiry
  const signature = crypto.createHmac("sha256", SECRET_KEY)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    
    const expectedSignature = crypto.createHmac("sha256", SECRET_KEY)
      .update(`${header}.${data}`)
      .digest("base64url");
      
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

// Authentication Middleware
function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  (req as any).user = decoded;
  next();
}

// --- API ROUTES ---

// 1. Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 2. Auth - Register
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const existingUser = JSONDatabase.findUserByEmail(email);
  if (existingUser) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = hashPassword(password);
  const user = JSONDatabase.createUser(email, passwordHash);
  const token = signToken({ userId: user.id, email: user.email });

  res.status(201).json({
    message: "Registration successful",
    token,
    user: { id: user.id, email: user.email }
  });
});

// 3. Auth - Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = JSONDatabase.findUserByEmail(email);
  if (!user) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  const inputHash = hashPassword(password);
  if (user.passwordHash !== inputHash) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  res.json({
    message: "Login successful",
    token,
    user: { id: user.id, email: user.email }
  });
});

// 4. Auth - Me
app.get("/api/auth/me", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const user = JSONDatabase.findUserById(userId);
  
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const profile = JSONDatabase.findProfileById(userId);
  res.json({
    id: user.id,
    email: user.email,
    profile: profile || null
  });
});

// 5. Reference - Archetypes list
app.get("/api/archetypes", (req, res) => {
  res.json(Object.values(ARCHETYPES));
});

// 6. Profile - Create / Update
app.put("/api/profile", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const { displayName, languages, interests, buildGoal, zodiacSign } = req.body;

  if (!displayName || !languages || !interests || !buildGoal || !zodiacSign) {
    res.status(400).json({ error: "All profile fields are required" });
    return;
  }

  if (!Array.isArray(languages) || !Array.isArray(interests)) {
    res.status(400).json({ error: "Languages and interests must be lists" });
    return;
  }

  const profile = JSONDatabase.saveProfile(userId, {
    displayName,
    languages,
    interests,
    buildGoal,
    zodiacSign
  });

  res.json({
    message: "Profile saved successfully",
    profile
  });
});

// 7. Profile - View by ID
app.get("/api/profile/:id", authenticateToken, (req, res) => {
  const profileId = req.params.id;
  const profile = JSONDatabase.findProfileById(profileId);

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(profile);
});

// 8. Team matching - Live matching engine (5-Factor scoring + constellation coordinates)
app.get("/api/matches", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const userProfile = JSONDatabase.findProfileById(userId);

  if (!userProfile) {
    res.status(400).json({ error: "Please configure your profile first before searching for matches" });
    return;
  }

  const userCoords = predictArchetype(userProfile.languages, userProfile.interests, userProfile.buildGoal).pcaCoords;

  const allProfiles = JSONDatabase.getAllProfiles();
  const candidateProfiles = allProfiles.filter(p => p.userId !== userId);

  // Accepted connections involving this user
  const connectedSet = new Set(
    JSONDatabase.getAcceptedConnections(userId).map(c =>
      c.fromUserId === userId ? c.toUserId : c.fromUserId
    )
  );
  const outgoingPendingSet = new Set(JSONDatabase.getOutgoingPending(userId).map(c => c.toUserId));
  const incomingPendingSet = new Set(JSONDatabase.getIncomingPending(userId).map(c => c.fromUserId));

  const matches = candidateProfiles.map(candidate => {
    const { compatibilityScore, scores } = calculateMatchScore(userProfile, candidate);
    const candidateCoords = predictArchetype(candidate.languages, candidate.interests, candidate.buildGoal).pcaCoords;

    let connectionStatus: "none" | "pending_out" | "pending_in" | "accepted" = "none";
    if (connectedSet.has(candidate.userId)) connectionStatus = "accepted";
    else if (outgoingPendingSet.has(candidate.userId)) connectionStatus = "pending_out";
    else if (incomingPendingSet.has(candidate.userId)) connectionStatus = "pending_in";

    return {
      userId: candidate.userId,
      displayName: candidate.displayName,
      languages: candidate.languages,
      interests: candidate.interests,
      buildGoal: candidate.buildGoal,
      zodiacSign: candidate.zodiacSign,
      zodiacElement: candidate.zodiacElement,
      archetypeId: candidate.archetypeId,
      compatibilityScore,
      scores,
      x: candidateCoords[0],
      y: candidateCoords[1],
      connected: connectionStatus === "accepted",
      connectionStatus,
    };
  });

  // Sort by highest compatibility score first
  matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  res.json({
    userCoords: {
      x: userCoords[0],
      y: userCoords[1],
      archetypeId: userProfile.archetypeId
    },
    matches
  });
});

// 8b. Connections - List accepted connections (both directions)
app.get("/api/connections", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const connections = JSONDatabase.getAcceptedConnections(userId);

  const enriched = connections
    .map(c => {
      const otherUserId = c.fromUserId === userId ? c.toUserId : c.fromUserId;
      const profile = JSONDatabase.findProfileById(otherUserId);
      const lastMsg = JSONDatabase.getLastMessage(userId, otherUserId);
      return {
        userId: otherUserId,
        connectedAt: c.updatedAt || c.createdAt,
        displayName: profile?.displayName || "Unknown Developer",
        archetypeId: profile?.archetypeId || null,
        zodiacSign: profile?.zodiacSign || null,
        lastMessage: lastMsg
          ? { text: lastMsg.text, fromUserId: lastMsg.fromUserId, createdAt: lastMsg.createdAt }
          : null,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.connectedAt;
      const bTime = b.lastMessage?.createdAt || b.connectedAt;
      return aTime < bTime ? 1 : -1;
    });

  res.json({ connections: enriched });
});

// 8b2. Connection requests - pending incoming & outgoing
app.get("/api/connections/requests", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;

  const enrich = (c: { fromUserId: string; toUserId: string; status: string; createdAt: string }, otherUserId: string) => {
    const profile = JSONDatabase.findProfileById(otherUserId);
    return {
      fromUserId: c.fromUserId,
      toUserId: c.toUserId,
      status: c.status,
      createdAt: c.createdAt,
      displayName: profile?.displayName || "Unknown Developer",
      archetypeId: profile?.archetypeId || null,
      zodiacSign: profile?.zodiacSign || null,
    };
  };

  const incoming = JSONDatabase.getIncomingPending(userId).map(c => enrich(c, c.fromUserId));
  const outgoing = JSONDatabase.getOutgoingPending(userId).map(c => enrich(c, c.toUserId));

  res.json({ incoming, outgoing });
});

// 8c. Connections - Send a connection request
app.post("/api/connections", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const { toUserId } = req.body;

  if (!toUserId) {
    res.status(400).json({ error: "toUserId is required" });
    return;
  }
  if (toUserId === userId) {
    res.status(400).json({ error: "You cannot connect with yourself" });
    return;
  }

  const targetProfile = JSONDatabase.findProfileById(toUserId);
  if (!targetProfile) {
    res.status(404).json({ error: "Target developer not found" });
    return;
  }

  if (JSONDatabase.isAcceptedConnection(userId, toUserId)) {
    res.status(400).json({ error: "You are already connected with this developer." });
    return;
  }

  try {
    const existing = JSONDatabase.findConnection(userId, toUserId);
    const connection = JSONDatabase.sendConnectionRequest(userId, toUserId);

    res.status(201).json({
      message: existing?.status === "pending"
        ? `Request already pending with ${targetProfile.displayName}`
        : `Connection request sent to ${targetProfile.displayName}`,
      connection,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to send connection request." });
  }
});

// 8d. Connections - Accept or reject an incoming request
app.post("/api/connections/respond", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const { fromUserId, action } = req.body;

  if (!fromUserId || !action) {
    res.status(400).json({ error: "fromUserId and action are required" });
    return;
  }
  if (action !== "accept" && action !== "reject") {
    res.status(400).json({ error: "action must be 'accept' or 'reject'" });
    return;
  }

  try {
    const connection = JSONDatabase.respondToRequest(userId, fromUserId, action);
    const senderProfile = JSONDatabase.findProfileById(fromUserId);
    const name = senderProfile?.displayName || "Developer";

    res.json({
      message: action === "accept"
        ? `You are now connected with ${name}`
        : `Declined request from ${name}`,
      connection,
    });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Request not found." });
  }
});

// 8e. Messages - Get conversation with a connected developer
app.get("/api/messages/:otherUserId", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const otherUserId = req.params.otherUserId;

  if (!JSONDatabase.isAcceptedConnection(userId, otherUserId)) {
    res.status(403).json({ error: "You can only message connected developers." });
    return;
  }

  const profile = JSONDatabase.findProfileById(otherUserId);
  const messages = JSONDatabase.getMessages(userId, otherUserId);

  res.json({
    peer: {
      userId: otherUserId,
      displayName: profile?.displayName || "Unknown Developer",
      archetypeId: profile?.archetypeId || null,
    },
    messages,
  });
});

// 8f. Messages - Send a message
app.post("/api/messages", authenticateToken, (req, res) => {
  const userId = (req as any).user.userId;
  const { toUserId, text } = req.body;

  if (!toUserId || !text) {
    res.status(400).json({ error: "toUserId and text are required" });
    return;
  }

  try {
    const message = JSONDatabase.sendMessage(userId, toUserId, text);
    res.status(201).json({ message });
  } catch (error: any) {
    const status = error.message?.includes("connected") ? 403 : 400;
    res.status(status).json({ error: error.message || "Failed to send message." });
  }
});

// --- VITE INTERACTION FOR FULL-STACK IN DEV & PROD ---
// --- VITE INTERACTION FOR FULL-STACK IN DEV & PROD ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev middleware in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as Express middleware.");
  } else {
    // Serve static compiled output in production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static compiled build from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zetwork Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
