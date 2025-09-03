import {Request, Response, NextFunction} from 'express'

// custom imports
import {KafkaService} from '../class/kafka.class'
import {RedisService} from '../class/redis.class'
import * as dbService from '../helper/db.helper'
import * as errors from '../utils/errors.utils'
import * as constants from '../utils/constants.utils'
import {env} from '../config/env.config'

const kafka = KafkaService.getInstance()
const redis = RedisService.getInstance()


export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let body = req.body
  try {
    let check
    let data = await redis.get(body.email)

    if(!data) {
      check = await dbService.findOne({
        table: constants.tableNames.user,
        query: {
          where: {
            email: body.email
          }
        }
      })
      await redis.set(body.email, JSON.stringify(check), 172800) // 2 days
      if(check) return next(new errors.BadRequest('User already registered'))
    } else {
      return next(new errors.BadRequest('User already registered'))
    }

    const producer = await kafka.produceMessages()

    await producer?.send({
      topic: env.topics,
      messages: [
        {
          key: `users-${body.email}`,
          value: JSON.stringify(body)
        }
      ]
    })
    
    // const insert = await dbService.createOne({
    //   table: 'User',
    //   data: body
    // })

    // console.log(insert)
    res.status(201).send({status: true, data: 'User registered successfully'})
  } catch (err) {
    console.log(err)
  }
}