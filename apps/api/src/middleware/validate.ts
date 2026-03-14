import { AnyZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export const validateBody = (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message }))
        });
      }
      next(err);
    }
  };
