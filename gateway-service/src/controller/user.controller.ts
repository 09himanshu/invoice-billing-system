import {Request, Response, NextFunction} from 'express'

// custom imports
import * as errors from '../utils/errors.utils'
import * as constants from '../utils/constants.utils'
import {db} from '../helper/db.helper'
import {KafkaService} from '../class/kafka.class'
import {RedisService} from '../class/redis.class'
import {kafkaTopics} from '../utils/constants.utils'

const kafka = KafkaService.getInstance()
const redis = RedisService.getInstance()


export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let body = req.body
  try {
    
    let data: any = await redis.get(body.email)

    if(!data) {
      data = (await db).findOne({collection: constants.tableNames.user, filter: {email: body.email}, project: {}})
      console.log(data);
      
      await redis.set(body.email, JSON.stringify(data), 172800) // 2 days
      if(data) return next(new errors.BadRequest('User already registered'))
    } else {
      console.log(data);
      return next(new errors.BadRequest('User already registered'))
    }

    const message = [
      {
        key: `userID-${body.email}`,
        value: body,
        partition: 0
      }
    ]

    await kafka.sendMessage(kafkaTopics.register, message)
    
    res.status(201).send({status: true, data: 'User registered successfully'})
  } catch (err) {
    return next(new errors.InternalServer('Something went wrong'))
  }
}
