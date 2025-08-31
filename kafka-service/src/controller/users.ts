import {KafkaService} from '../class/kafka.class'
import {env} from '../config/env.config'
import * as dbService from '../helpers/db.helper'
import {tableNames} from '../utils/constant.utils'

const kafka = new KafkaService()


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
  try {
    
  } catch (err) {
    console.error(err)
  }
}