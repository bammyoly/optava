import { Router } from "express";
import { ok, created, badRequest, notFound } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/decisions";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { projectId, category } = req.query;

  if (!projectId || typeof projectId !== "string") {
    return badRequest(res, "projectId query parameter required");
  }

  const decisions = await service.listDecisions(
    projectId,
    typeof category === "string" ? category : undefined
  );

  return ok(res, decisions, { count: decisions.length });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const decision = await service.getDecision(req.params.id as string);

  if (!decision) {
    return notFound(res, "Decision not found");
  }

  return ok(res, decision);
}));

router.post("/", asyncHandler(async (req, res) => {
  const { project_id, title, context, rationale, alternatives, category, author } = req.body;

  if (!project_id || !title || !context || !rationale) {
    return badRequest(res, "project_id, title, context, and rationale are required");
  }

  const decision = await service.createDecision({
    project_id,
    title,
    context,
    rationale,
    alternatives: alternatives || [],
    category,
    author,
  });

  return created(res, decision);
}));

export default router;