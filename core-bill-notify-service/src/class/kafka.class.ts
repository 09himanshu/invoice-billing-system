import { Kafka, Consumer, Admin, Producer } from "kafkajs";
import { env } from "../config/env.config";

export class KafkaService {
    private static instance: KafkaService;
    private kafka: Kafka;
    private admin: Admin | null = null;
    private producer: Producer | null = null;
    private consumers: Map<string, Consumer> = new Map();
    private isConnected = false;
    private isTopics: string[] = []

    private constructor() {
        this.kafka = new Kafka({
            clientId: env.clientId,
            brokers: env.brokers.split(","),
            connectionTimeout: 10000,
            requestTimeout: 30000,
            retry: {
                initialRetryTime: 1000,
                retries: 5
            }
        });
    }

    public static getInstance(): KafkaService {
        if (!KafkaService.instance) {
            KafkaService.instance = new KafkaService();
        }
        return KafkaService.instance;
    }

    private async getAdmin(): Promise<Admin> {
        if (!this.admin) {
            this.admin = this.kafka.admin();
            await this.admin.connect();
            console.log("Admin connected");
        }
        return this.admin;
    }

    private async initializeProducer(): Promise<void> {
        if (this.producer && this.isConnected) return;

        this.producer = this.kafka.producer({
            allowAutoTopicCreation: false,
            transactionTimeout: 30000,
            maxInFlightRequests: 1,
            idempotent: true,
            retry: {
                initialRetryTime: 1000,
                retries: 5
            }
        });

        await this.producer.connect();
        this.isConnected = true;
        console.log("Global producer connected");
    }

    public async createTopics(topics: string[]): Promise<void> {
        const admin = await this.getAdmin();
        this.isTopics = topics
        try {
            const listTopics = await admin.listTopics();
            const newTopics = topics.filter((t) => !listTopics.includes(t));

            if (newTopics.length === 0) {
                console.log("All topics already exist");
                for (const topic of topics) {
                    await this.waitForLeaders(admin, topic);
                }
                return;
            }

            await admin.createTopics({
                waitForLeaders: true,
                topics: newTopics.map((topic) => ({
                    topic,
                    numPartitions: 3,
                    replicationFactor: 5, // adjust based on cluster
                })),
            });

            console.log(`Topics created: ${newTopics.join(", ")}`);

            for (const topic of topics) {
                await this.waitForLeaders(admin, topic);
                console.log(`Leaders elected for topic ${topic}`);
            }
        } catch (err) {
            console.error("Error creating topics:", err);
        }
    }

    private async waitForLeaders(admin: Admin, topic: string): Promise<void> {
        const timeout = 30000;
        const interval = 2000;
        const start = Date.now();

        while (Date.now() - start < timeout) {
            const metadata = await admin.fetchTopicMetadata({ topics: [topic] });

            const noLeader = metadata.topics.some((t) =>
                t.partitions.some((p) => p.leader === -1)
            );

            if (!noLeader) return;

            console.log(`Waiting for leaders to be elected for topic ${topic}...`);
            await new Promise((r) => setTimeout(r, interval));
        }

        throw new Error(
            `Timeout: leaders not elected for topic ${topic} within ${timeout / 1000
            }s`
        );
    }

    public async sendMessage(topic: string, messages: any[]): Promise<void> {
        await this.initializeProducer();

        if (!this.producer) {
            throw new Error("Producer not initialized");
        }

        try {

            await this.producer.send({
                topic,
                messages: messages
            });

            console.log(`Messages sent to topic: ${topic}`);
        } catch (err) {
            console.error(`Error sending messages to ${topic}:`, err);
            throw err;
        }
    }

    public async getConsumer(groupId:  string, topics: string): Promise<Consumer | undefined> {
        try {
            const consumerKey = groupId;
            if(this.consumers.has(consumerKey)) {
                return this.consumers.get(consumerKey)
            }

            const admin = await this.getAdmin();
            await Promise.all(this.isTopics.map(topic => this.waitForLeaders(admin, topic)));

            const consumer = this.kafka.consumer({ 
                groupId,
                sessionTimeout: 30000,
                rebalanceTimeout: 60000,
                heartbeatInterval: 3000,
                maxWaitTimeInMs: 1000,
                retry: {
                    initialRetryTime: 1000,
                    retries: 5
                }
            });

            await consumer.subscribe({ topic: topics, fromBeginning: false });
            this.consumers.set(consumerKey, consumer)
            return consumer
        } catch (err) {
            console.log(err)
            return undefined
        }
    }

    public async disconnect(): Promise<void> {
        console.log("Starting graceful shutdown...");

        // Disconnect consumers
        for (const [groupId, consumer] of this.consumers) {
            try {
                await consumer.disconnect();
                console.log(`Consumer disconnected for group: ${groupId}`);
            } catch (err) {
                console.error(`Error disconnecting consumer ${groupId}:`, err);
            }
        }
        this.consumers.clear();

        // Disconnect producer
        if (this.producer) {
            await this.producer.disconnect();
            console.log("Producer disconnected");
            this.producer = null;
            this.isConnected = false;
        }

        // Disconnect admin
        if (this.admin) {
            await this.admin.disconnect();
            console.log("Admin disconnected");
            this.admin = null;
        }
    }
}
