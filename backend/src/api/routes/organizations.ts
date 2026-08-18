import { Router } from "express";
import { ok, created, badRequest, notFound } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/organizations";

const router = Router();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, slug, userId, projectName, projectDescription } = req.body;

    console.log("[POST /organizations] Body:", {
      name, slug, userId, projectName, projectDescription,
    });

    if (!name || !slug || !userId || !projectName) {
      return badRequest(res, "name, slug, userId, and projectName are required");
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return badRequest(
        res,
        `Invalid userId format: "${userId}". Expected a UUID. ` +
        `Your session may be corrupted — please sign out and sign in again.`
      );
    }

    const available = await service.isSlugAvailable(slug);
    if (!available) {
      return badRequest(res, "This slug is already taken");
    }

    try {
      const result = await service.createOrganization({
        name,
        slug,
        userId,
        projectName,
        projectDesc: projectDescription,
      });

      console.log("[POST /organizations] Success:", {
        orgId:     result.org.id,
        projectId: result.project.id,
      });

      return created(res, result);
    } catch (err: any) {
      if (err.message?.includes("USER_NOT_FOUND")) {
        return badRequest(res, err.message);
      }
      throw err;
    }
  })
);

router.get(
  "/check-slug",
  asyncHandler(async (req, res) => {
    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
      return badRequest(res, "slug query parameter required");
    }

    const available = await service.isSlugAvailable(slug);
    return ok(res, { slug, available });
  })
);

router.get(
  "/by-user/:userId",
  asyncHandler(async (req, res) => {
    const result = await service.getUserOrganization(req.params.userId as string);

    if (!result) {
      return notFound(res, "User has no organization");
    }

    return ok(res, result);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const org = await service.getOrganization(req.params.id as string);

    if (!org) {
      return notFound(res, "Organization not found");
    }

    return ok(res, org);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { name } = req.body;

    const updated = await service.updateOrganization(req.params.id as string, { name });

    if (!updated) {
      return notFound(res, "Organization not found");
    }

    return ok(res, updated);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await service.deleteOrganization(req.params.id as string);
    return ok(res, { deleted: true });
  })
);

export default router;