import { Router } from "express";
import { ok, created, badRequest, notFound } from "../lib/response";
import { asyncHandler } from "../middleware/errorHandler";
import * as service from "../services/tasks";

const router = Router();

router.get("/", asyncHandler(async (req, res) => {
  const { projectId, status } = req.query;

  if (!projectId || typeof projectId !== "string") {
    return badRequest(res, "projectId query parameter required");
  }

  const tasks = await service.listTasks(
    projectId,
    typeof status === "string" ? status : undefined
  );

  return ok(res, tasks, { count: tasks.length });
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const task = await service.getTask(req.params.id as string);

  if (!task) {
    return notFound(res, "Task not found");
  }

  return ok(res, task);
}));

router.post("/", asyncHandler(async (req, res) => {
  const { project_id, task_code, title } = req.body;

  if (!project_id || !task_code || !title) {
    return badRequest(res, "project_id, task_code, and title are required");
  }

  const task = await service.createTask(req.body);
  return created(res, task);
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const task = await service.updateTask(req.params.id as string, req.body);

  if (!task) {
    return notFound(res, "Task not found");
  }

  return ok(res, task);
}));

export default router;