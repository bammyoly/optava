import { Router } from "express";
import { ok, badRequest } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/conversations";

const router = Router();

/* GET /conversations/sessions?projectId=... */
router.get("/sessions", asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId || typeof projectId !== "string") {
    return badRequest(res, "projectId query parameter required");
  }

  const sessions = await service.listSessions(projectId);
  return ok(res, sessions, { count: sessions.length });
}));

/* GET /conversations/:sessionId */
router.get("/:sessionId", asyncHandler(async (req, res) => {
  const messages = await service.getSession(req.params.sessionId);
  return ok(res, messages, { count: messages.length });
}));

export default router;