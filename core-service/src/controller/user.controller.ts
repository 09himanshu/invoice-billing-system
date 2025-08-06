import {Request, Response, NextFunction} from 'express'

// custom imports
import * as dbService from '../helper/db.helper'
import * as errors from '../utils/errors.utils'

export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let body = req.body
  try {
    let check = await dbService.findOne({
      table: "User",
      query: {
        where: {
          email: body.email
        }
      }
    })

    if(check) return next(new errors.BadRequest('User already registered'))
    
    const insert = await dbService.createOne({
      table: 'User',
      data: body
    })
    res.status(201).send({status: true, data: 'User registered successfully'})
  } catch (err) {
    console.log(err)
  }
}