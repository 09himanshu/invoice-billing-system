
// custom imports
import { KafkaService } from '../class/kafka.class'
import { env } from '../config/env.config'
import { tableNames } from '../utils/constant.utils'
import {db} from '../helpers/db.helper'


const kafka = KafkaService.getInstance()

export const insertUser = async (): Promise<void> => {
  let consumer = await kafka.consumeMessages(env.kafka_group_id_1)

  try {
    consumer?.subscribe({ topic: env.topics, fromBeginning: true })

    await consumer?.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        let users: object[] = []

        for (let ele of batch.messages) {
          if (/userID-/.test(ele.key!.toString())) {
            users.push(JSON.parse(ele.value!.toString()))
          }

          resolveOffset(ele.offset)

          await heartbeat()
        }

        if (users.length > 0) {
          (await db).insertMany({collection: tableNames.user, document: users})
        }
      }
    })
  } catch (err) {
    console.error(err)
  }
}