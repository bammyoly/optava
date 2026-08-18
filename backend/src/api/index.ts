//backend/src/api/index.ts

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { requestLogger }  from "./middleware/logger";
import { errorHandler }   from "./middleware/errorHandler";
import { ok }             from "./lib/response";

import projectsRouter      from "./routes/projects";
import decisionsRouter     from "./routes/decisions";
import tasksRouter         from "./routes/tasks";
import notesRouter         from "./routes/notes";
import conversationsRouter from "./routes/conversations";
import standupsRouter      from "./routes/standups";
import searchRouter        from "./routes/search";
import chatRouter          from "./routes/chat";
import teamRouter          from "./routes/team";
import organizationsRouter from "./routes/organizations";
import orgMembersRouter    from "./routes/org-members";
import invitationsRouter   from "./routes/invitations";
import debugRouter         from "./routes/debug";

dotenv.config();

/* ─────────────────────────────────────────────────────────── */
/*  App setup                                                  */
/* ─────────────────────────────────────────────────────────── */

const app          = express();
const PORT         = parseInt(process.env.PORT || "3001");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// ─── Middleware ────────────────────────────────────────────
app.use(cors({
  origin:      [FRONTEND_URL, "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

/* ─────────────────────────────────────────────────────────── */
/*  Routes                                                     */
/* ─────────────────────────────────────────────────────────── */

// Health check
app.get("/api/health", (req, res) => {
  ok(res, {
    status:    "ok",
    service:   "memoryboard-api",
    version:   "0.1.0",
    timestamp: new Date().toISOString(),
  });
});

// Mount routers
app.use("/api/projects",      projectsRouter);
app.use("/api/decisions",     decisionsRouter);
app.use("/api/tasks",         tasksRouter);
app.use("/api/notes",         notesRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/standups",      standupsRouter);
app.use("/api/search",        searchRouter);
app.use("/api/chat",          chatRouter);
app.use("/api/team",          teamRouter);
app.use("/api/organizations", organizationsRouter);
app.use("/api/org-members",   orgMembersRouter);
app.use("/api/invitations",   invitationsRouter);
app.use("/api/debug", debugRouter);


// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error:   `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

/* ─────────────────────────────────────────────────────────── */
/*  Start server                                               */
/* ─────────────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log("═══════════════════════════════════════════");
  console.log(`  🧠 MemoryBoard API`);
  console.log("═══════════════════════════════════════════");
  console.log(`  🚀 Server:    http://localhost:${PORT}`);
  console.log(`  📡 Health:    http://localhost:${PORT}/api/health`);
  console.log(`  🌐 CORS:      ${FRONTEND_URL}`);
  console.log("═══════════════════════════════════════════\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n👋 SIGTERM received, shutting down...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT received, shutting down...");
  process.exit(0);
});