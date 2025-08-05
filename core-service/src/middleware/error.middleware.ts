import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom import
import { CustomError } from '../utils/errors.utils';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({ path: e.path, message: e.message })),
    });
  }

  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({
      status: err.status,
      message: err.message,
    });
  }

  res.status(500).send({ status: false, message: 'Internal Server Error' });
};