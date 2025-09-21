import {Request, Response, NextFunction} from 'express'

// custom imports
import * as errors from '../utils/errors.utils'
import {KafkaService} from '../class/kafka.class'
import {generateOrderId} from '../helper/uniqueId.helper'
import {kafkaTopics} from '../utils/constants.utils'

const kafka = KafkaService.getInstance()

export const userBill = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const body = req.body
  if(!body) return next(new errors.BadRequest('Invalid request'))

  try {

    const message = [
      {
        key: `billID-${generateOrderId()}`,
        value: JSON.stringify(body),
        partition: 1
      }
    ]

    await kafka.sendMessage(kafkaTopics.bill, message)

    res.status(200).send({status: true, data: 'Bill generated successfully'})
  } catch (err) {
    return next(new errors.InternalServer('Something went wrong'))
  }
}