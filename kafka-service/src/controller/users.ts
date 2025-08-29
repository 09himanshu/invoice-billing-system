import {KafkaService} from '../class/kafka.class'
import {env} from '../config/env.config'
import * as dbService from '../helpers/db.helper'

const kafka = new KafkaService()

export const insertUser = async () => {
    let consumer = await kafka.consumeMessages(env.kafka_group_id_1)
    let bulkInsert: object[] = []
  try {
    consumer?.subscribe({topics: [env.topics], fromBeginning: true})

    await consumer?.run({
        eachMessage: async ({topic, partition, message, heartbeat, pause}) => {
            if(/user-/.test(message.key!.toString())) {
                const user = JSON.parse(message.value!.toString())

                bulkInsert.push(user)

                if(bulkInsert.length >= 100) {
                    await dbService.createMany(bulkInsert)
                    bulkInsert = []
                }
            }
        }
    })
  } catch (err) {
    console.error('Error inserting user:', err)
  }
}