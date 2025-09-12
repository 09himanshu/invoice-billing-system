import {Request, Response, NextFunction} from 'express'

// custom import
import * as models from '../validation/index'
import * as errors from '../utils/errors.utils'



export const validateUser = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {
  try {
    const body = req.body

    if(!body) {
      return next(new errors.BadRequest("Nody request body was passed"))
    }

    const check = models.userSchema.safeParse(body)

    if(!check.success) {
      return next(new errors.BadRequest("Invalid user data"))
    }
    
    next()
  } catch (err) {
    return next(new errors.InternalServer("Something went wrong"))
  }
}