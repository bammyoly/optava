// backend/src/api/routes/org-members.ts

import { Router } from "express";
import { ok, created, badRequest, notFound } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as memberService from "../services/org-members";
import * as inviteService  from "../services/invitations";
import * as orgService     from "../services/organizations";
import { query } from "../../lib/db";

const router = Router();

/* GET /org-members?orgId=... */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== "string") {
      return badRequest(res, "orgId query parameter required");
    }

    const members = await memberService.listMembers(orgId);
    return ok(res, members, { count: members.length });
  })
);

/* POST /org-members/invite */
router.post(
  "/invite",
  asyncHandler(async (req, res) => {
    const { orgId, email, role = "member", invitedBy } = req.body;

    if (!orgId || !email || !invitedBy) {
      return badRequest(res, "orgId, email, and invitedBy are required");
    }

    const org = await orgService.getOrganization(orgId);
    if (!org) return notFound(res, "Organization not found");

    const inviterResult = await query(
      `SELECT name FROM users WHERE id = $1`,
      [invitedBy]
    );
    const inviterName = inviterResult.rows[0]?.name || "A team member";

    const invitation = await inviteService.createInvitation({
      orgId,
      email,
      role,
      invitedBy,
      orgName:     org.name,
      inviterName,
    });

    return created(res, invitation);
  })
);

/* PATCH /org-members/:userId */
router.patch(
  "/:userId",
  asyncHandler(async (req, res) => {
    const { orgId, role } = req.body;

    if (!orgId || !role) {
      return badRequest(res, "orgId and role are required");
    }

    if (!["owner", "admin", "member"].includes(role)) {
      return badRequest(res, "role must be owner, admin, or member");
    }

    const updated = await memberService.updateMemberRole(
      orgId,
      req.params.userId,
      role
    );

    if (!updated) {
      return notFound(res, "Member not found");
    }

    return ok(res, updated);
  })
);

/* DELETE /org-members/:userId */
router.delete(
  "/:userId",
  asyncHandler(async (req, res) => {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== "string") {
      return badRequest(res, "orgId query parameter required");
    }

    await memberService.removeMember(orgId, req.params.userId);
    return ok(res, { removed: true });
  })
);

export default router;