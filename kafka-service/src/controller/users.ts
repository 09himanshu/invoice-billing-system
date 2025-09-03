

// custom imports
import {KafkaService} from '../class/kafka.class'
import {RedisService} from '../class/redis.class'
import {env} from '../config/env.config'
import * as dbService from '../helpers/db.helper'
import {tableNames} from '../utils/constant.utils'

const kafka = KafkaService.getInstance()
const redis = RedisService.getInstance()

export const insertUser = async (): Promise<void> => {
  let consumer =  await kafka.consumeMessages(env.kafka_group_id_1)
  
  try {
    consumer?.subscribe({topic: env.topics,fromBeginning: true})

    await consumer?.run({
      eachBatch: async ({batch, resolveOffset, heartbeat}) => {
        let users: object[] = []

        for(let ele of batch.messages) {
          if(/users-/.test(ele.key!.toString())) {
            users.push(JSON.parse(ele.value!.toString()))
          }

          resolveOffset(ele.offset)

          await heartbeat()
        }

        if(users.length > 0) {
          await dbService.createMany({ table: tableNames.user, data: users })
        }
      }
    })
  } catch (err) {
    console.error(err)
  }
}

export const genBill = async () => {
  const consumer = await kafka.consumeMessages(env.kafka_group_id_2)
  try {
    consumer?.subscribe({topic: env.topics, fromBeginning: true})

    await consumer?.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        for (let ele of batch.messages) {
          if(/bill-/.test(ele.key!.toString())) {
            let {userId, bill} = JSON.parse(ele.value!.toString())

            const user = await redis.get(userId)

            if(!user) {
              
            }
          }
          resolveOffset(ele.offset)
          await heartbeat()
        }
      }
    })
  } catch (err) {
    console.error(err)
  }
}