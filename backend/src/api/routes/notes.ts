import { Router } from "express";
import { ok, created, badRequest } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/notes";

const router = Router();

/* GET /notes?projectId=... */
router.get("/", asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId || typeof projectId !== "string") {
    return badRequest(res, "projectId query parameter required");
  }

  const notes = await service.listNotes(projectId);
  return ok(res, notes, { count: notes.length });
}));

/* POST /notes */
router.post("/", asyncHandler(async (req, res) => {
  const { project_id, content } = req.body;

  if (!project_id || !content) {
    return badRequest(res, "project_id and content are required");
  }

  const note = await service.createNote(req.body);
  return created(res, note);
}));

export default router;