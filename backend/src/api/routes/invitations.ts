import { Router } from "express";
import { ok, badRequest, notFound } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/invitations";

const router = Router();

router.get(
  "/:token",
  asyncHandler(async (req, res) => {
    const invitation = await service.getInvitationByToken(req.params.token as string);

    if (!invitation) {
      return notFound(res, "Invitation not found");
    }

    return ok(res, {
      id:           invitation.id,
      org_name:     invitation.org_name,
      org_slug:     invitation.org_slug,
      email:        invitation.email,
      role:         invitation.role,
      inviter_name: invitation.inviter_name,
      expires_at:   invitation.expires_at,
      accepted_at:  invitation.accepted_at,
      expired:      new Date(invitation.expires_at) < new Date(),
    });
  })
);

router.post(
  "/:token/accept",
  asyncHandler(async (req, res) => {
    const { userId, userEmail } = req.body;

    if (!userId || !userEmail) {
      return badRequest(res, "userId and userEmail are required");
    }

    try {
      const invitation = await service.acceptInvitation(
        req.params.token as string,
        userId,
        userEmail
      );
      return ok(res, { accepted: true, orgId: invitation.org_id });
    } catch (err) {
      return badRequest(res, (err as Error).message);
    }
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { orgId } = req.query;

    if (!orgId || typeof orgId !== "string") {
      return badRequest(res, "orgId query parameter required");
    }

    const invitations = await service.listInvitations(orgId);
    return ok(res, invitations, { count: invitations.length });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await service.revokeInvitation(req.params.id as string);
    return ok(res, { revoked: true });
  })
);

export default router;