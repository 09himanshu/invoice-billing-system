import { Kafka, Consumer, Admin } from 'kafkajs'
import { env } from '../config/env.config'

export class KafkaService {
    private static instance: KafkaService
    private kafka: Kafka

    // Private constructor to prevent direct instantiation
    public constructor() {
        this.kafka = new Kafka({
            clientId: env.clientId,
            brokers: env.brokers.split(',')
        })
    }

    // Singleton accessor
    public static getInstance(): KafkaService {
        if (!KafkaService.instance) {
            KafkaService.instance = new KafkaService()
        }
        return KafkaService.instance
    }

    public async createTopics(topic: string): Promise<void> {
        const admin: Admin = this.kafka.admin()
        try {
            await admin.connect()
            console.log('Admin connected')

            const listTopics = await admin.listTopics()

            if (listTopics.includes(topic)) {
                console.log(`Topic ${topic} already exists`)
                return
            }

            await admin.createTopics({
                waitForLeaders: true,
                topics: [
                    {
                        topic,
                        numPartitions: 2,
                        replicationFactor: 5
                    }
                ]
            })

            console.log(`Topic ${topic} created`)
        } catch (err) {
            console.error('Error creating topic:', err)
        } finally {
            await admin.disconnect()
            console.log('Admin disconnected')
        }
    }

    public async consumeMessages(groupId: string): Promise<Consumer | undefined> {
        const consumer: Consumer = this.kafka.consumer({ groupId })
        try {
            await consumer.connect()
            console.log('Consumer connected')
            return consumer
        } catch (err) {
            console.error('Error connecting consumer:', err)
        }
    }
}
