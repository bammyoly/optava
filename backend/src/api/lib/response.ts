//backend/src/api/response.ts

import type { Response } from "express";

/* ─────────────────────────────────────────────────────────── */
/*  Standard response envelope                                 */
/* ─────────────────────────────────────────────────────────── */

export interface ApiResponse<T = any> {
  success:   boolean;
  data?:     T;
  error?:    string;
  meta?:     Record<string, any>;
}

export function ok<T>(res: Response, data: T, meta?: Record<string, any>) {
  const body: ApiResponse<T> = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(200).json(body);
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, data });
}

export function badRequest(res: Response, message: string) {
  return res.status(400).json({ success: false, error: message });
}

export function notFound(res: Response, message: string = "Not found") {
  return res.status(404).json({ success: false, error: message });
}

export function serverError(res: Response, message: string = "Server error") {
  return res.status(500).json({ success: false, error: message });
}