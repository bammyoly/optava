import type { Request, Response, NextFunction } from "express";

/* ─────────────────────────────────────────────────────────── */
/*  Global error handler                                       */
/* ─────────────────────────────────────────────────────────── */

export function errorHandler(
  err:  any,
  req:  Request,
  res:  Response,
  next: NextFunction
) {
  console.error(`❌ ${req.method} ${req.path}:`, err.message);

  const status  = err.status  || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    error:   message,
  });
}

/* ─────────────────────────────────────────────────────────── */
/*  Async wrapper — catches promise rejections                 */
/* ─────────────────────────────────────────────────────────── */

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}