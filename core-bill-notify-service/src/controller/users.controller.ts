
// custom imports
import { KafkaService } from '../class/kafka.class'
import { env } from '../config/env.config'
import { tableNames } from '../utils/constant.utils'
import {db} from '../helpers/db.helper'
import {kafkaTopics, kafkaGroupIDs} from '../utils/constant.utils'


const kafka = KafkaService.getInstance()

export const insertUser = async (): Promise<void> => {
  let consumer = await kafka.getConsumer(kafkaGroupIDs.insertion, kafkaTopics.register)

  try {
    await consumer?.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        let users: object[] = []

        for (let ele of batch.messages) {
          if (/userID-/.test(ele.key!.toString())) {
            if(users.length >= 1000) {
              console.log(`Inserted ${users.length} users into the database`);
              (await db).insertMany({collection: tableNames.user, document: users})
              users = []
            }
            users.push(JSON.parse(ele.value!.toString()))
          }

          resolveOffset(ele.offset)

          await heartbeat()
        }

        if (users.length > 0) {
          console.log(`Inserted ${users.length} users into the database`);
          (await db).insertMany({collection: tableNames.user, document: users})
        }
      }
    })
  } catch (err) {
    console.error(err)
  }
}