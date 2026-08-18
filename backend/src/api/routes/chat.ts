//backend/src/api/routes/chat.ts

import { Router } from "express";
import { ok, badRequest } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/chat";

const router = Router();

/* POST /chat/message */
router.post("/message", asyncHandler(async (req, res) => {
  const { projectId, sessionId, message, history } = req.body;

  if (!projectId || !message) {
    return badRequest(res, "projectId and message are required");
  }

  const result = await service.sendMessage({
    projectId,
    sessionId,
    message,
    history,
  });

  return ok(res, result);
}));

export default router;