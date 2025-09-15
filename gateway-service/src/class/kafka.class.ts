import { Kafka, Consumer, Admin, Producer,  } from 'kafkajs'
import { env } from '../config/env.config'

export class KafkaService {
    private static instance: KafkaService
    private kafka: Kafka
    private producer: Producer | null = null
    private consumerMap: Map<string, Consumer>;

    // Private constructor to prevent direct instantiation
    public constructor() {
        this.kafka = new Kafka({
            clientId: env.clientId,
            brokers: env.brokers.split(',')
        })
        this.consumerMap = new Map()
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
                        numPartitions: 3,
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
        if(this.consumerMap.has(groupId)) {
            return this.consumerMap.get(groupId)
        }

        const consumer: Consumer = this.kafka.consumer({ groupId })
        try {
            await consumer.connect()
            console.log(`Consumer connected for groupId: ${groupId}`);
            this.consumerMap.set(groupId, consumer);
            return consumer
        } catch (err) {
            console.error('Error connecting consumer:', err)
            return undefined
        }
    }

    public async produceMessages(): Promise<Producer | undefined> {
        try {
            if(!this.producer) {
                this.producer = this.kafka.producer({
                    allowAutoTopicCreation: false,
                    transactionTimeout: 30000
                })
    
                await this.producer.connect()
                console.log('Producer connected')
            }
            return this.producer
        } catch (err) {
            console.error('Error connecting producer:', err)
            return undefined
        }
    }
}
