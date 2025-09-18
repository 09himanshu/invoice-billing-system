import {Request, Response, NextFunction} from 'express'

// custom imports
import * as errors from '../utils/errors.utils'
import * as constants from '../utils/constants.utils'
import {db} from '../helper/db.helper'
import {KafkaService} from '../class/kafka.class'
import {RedisService} from '../class/redis.class'
import {generateOrderId} from '../helper/uniqueId.helper'
import {env} from '../config/env.config'
import { email } from 'zod'

const kafka = KafkaService.getInstance()
const redis = RedisService.getInstance()


export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let body = req.body
  try {
    
    let data: any = await redis.get(body.email)

    if(!data) {
      data = (await db).findOne({collection: constants.tableNames.user, filter: {email: body.email}, project: {}})
      await redis.set(body.email, JSON.stringify(data), 172800) // 2 days
      if(data) return next(new errors.BadRequest('User already registered'))
    } else {
      return next(new errors.BadRequest('User already registered'))
    }

    const producer = await kafka.produceMessages()

    await producer?.send({
      topic: env.topics,
      messages: [
        {
          key: `userID-${body.email}`,
          value: JSON.stringify(body),
          partition: 0
        }
      ]
    })
    
    res.status(201).send({status: true, data: 'User registered successfully'})
  } catch (err) {
    return next(new errors.InternalServer('Something went wrong'))
  }
}
