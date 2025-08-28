import {Kafka, logLevel} from 'kafkajs'

class Kafka {
    private static instance: Kafka

    public constructor (array: [string]): Kafka {
        this.kafka = new Kafka({
            clientId: array[0],
            brokers: array.slice(1)
        })
    }
}