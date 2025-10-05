import { KafkaService } from '../class/kafka.class'
import { env } from '../config/env.config'
import { Mailer } from '../class/mailer.class'
import { template } from '../helpers/mailTemplate.helper'
import { kafkaTopics, kafkaGroupIDs } from '../utils/constant.utils'

const kafka = KafkaService.getInstance()
const mailer = Mailer.getInstance()

export const sendMail = async () => {
  try {
    const consumer = await kafka.getConsumer(kafkaGroupIDs.notification, kafkaTopics.notify)

    await consumer?.run({
      eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
        try {
          for (let ele of batch.messages) {
            if (/email-/.test(ele.key!.toString())) {
              let data = JSON.parse(ele.value!.toString())

              const options = {
                from: env.smtpFrom,
                to: data.info.sendTo,
                subject: 'Invoice',
                html: await template(data.info),
                document: data.filepath
              }

              await mailer.sendMail(options)

            }

            resolveOffset(ele.offset)
            await heartbeat()
          }
        } catch (err) {
          console.log(err);
        }
      }
    })
  } catch (err) {
    console.log(err);
  }
}