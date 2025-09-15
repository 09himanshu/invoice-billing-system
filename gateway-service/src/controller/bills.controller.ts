import {Request, Response, NextFunction} from 'express'

// custom imports
import * as errors from '../utils/errors.utils'
import {KafkaService} from '../class/kafka.class'
import {generateOrderId} from '../helper/uniqueId.helper'
import {env} from '../config/env.config'

const kafka = KafkaService.getInstance()

export const userBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const body = req.body
  if(!body) return next(new errors.BadRequest('Invalid request'))

  try {
    const producer = await kafka.produceMessages()

    await producer?.send({
      topic: env.topics,
      messages: [
        {
          key: `billID-${generateOrderId()}`,
          value: JSON.stringify(body),
          partition: 1
        }
      ]
    })

    res.status(200).send({status: true, data: 'Bill generated successfully'})
  } catch (err) {
    return next(new errors.InternalServer('Something went wrong'))
  }
}