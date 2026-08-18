import { Router } from "express";
import { ok, badRequest } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/search";

const router = Router();

/* POST /search */
router.post("/", asyncHandler(async (req, res) => {
  const { projectId, query, limit, sourceTypes, minSimilarity } = req.body;

  if (!projectId || !query) {
    return badRequest(res, "projectId and query are required");
  }

  const results = await service.search({
    projectId,
    query,
    limit,
    sourceTypes,
    minSimilarity,
  });

  return ok(res, results, { count: results.length, query });
}));

export default router;