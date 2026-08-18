import { Router } from "express";
import { ok, badRequest, notFound } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/standups";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId || typeof projectId !== "string") {
    return badRequest(res, "projectId query parameter required");
  }

  const standups = await service.listStandups(projectId);
  return ok(res, standups, { count: standups.length });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const standup = await service.getStandup(req.params.id as string);

  if (!standup) {
    return notFound(res, "Standup not found");
  }

  return ok(res, standup);
}));

router.post("/generate", asyncHandler(async (req, res) => {
  const projectId =
    (req.query.projectId as string) ||
    (req.body?.projectId as string);

  if (!projectId) {
    return badRequest(res, "projectId required (query param or body)");
  }

  console.log(`[standup] Generating standup for project ${projectId}...`);
  const standup = await service.generateStandup(projectId);
  console.log(`[standup] Generated in ${standup.gen_time_ms}ms`);

  return ok(res, standup);
}));

export default router;