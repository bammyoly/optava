import { Router } from "express";
import { ok, created, badRequest, notFound } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/team";

const router = Router();

/* GET /team?projectId=... */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== "string") {
      return badRequest(res, "projectId query parameter required");
    }

    const members = await service.listTeam(projectId);
    return ok(res, members, { count: members.length });
  })
);

/* GET /team/:id?projectId not needed — id is enough */
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const member = await service.getTeamMember(req.params.id);

    if (!member) {
      return notFound(res, "Team member not found");
    }

    return ok(res, member);
  })
);

/* POST /team */
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { project_id, name, role, avatar_color } = req.body;

    if (!project_id || !name) {
      return badRequest(res, "project_id and name are required");
    }

    const member = await service.createTeamMember({
      project_id,
      name,
      role,
      avatar_color,
    });

    return created(res, member);
  })
);

export default router;