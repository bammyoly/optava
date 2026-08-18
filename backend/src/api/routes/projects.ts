import { Router } from "express";
import { ok, created, badRequest, notFound } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/projects";
import { query } from "../../lib/db";

const router = Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { orgId, name, description } = req.body;

    console.log("[POST /projects] Body:", { orgId, name, description });

    if (!orgId || !name) {
      return badRequest(res, "orgId and name are required");
    }

    const orgCheck = await query(
      `SELECT id FROM organizations WHERE id = $1`,
      [orgId]
    );

    if (orgCheck.rows.length === 0) {
      return notFound(res, "Organization not found");
    }

    const result = await query(
      `INSERT INTO projects (org_id, name, description, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING *`,
      [orgId, name, description || null]
    );

    console.log("[POST /projects] Created:", result.rows[0].id);
    return created(res, result.rows[0]);
  })
);

router.get("/:id", asyncHandler(async (req, res) => {
  const project = await service.getProject(req.params.id as string);

  if (!project) {
    return notFound(res, "Project not found");
  }

  return ok(res, project);
}));

router.get("/:id/stats", asyncHandler(async (req, res) => {
  const stats = await service.getProjectStats(req.params.id as string);
  return ok(res, stats);
}));

export default router;