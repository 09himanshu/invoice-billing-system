import {Request, Response, NextFunction} from 'express'

// custom import
import {CustomError} from '../utils/errors.utils'

export const errorMiddleware = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  return res.status(err.statusCode).send({
    status: err.status,
    message: err.message,
  });
}