import { Kafka, Consumer, Admin, Producer, EachBatchPayload } from "kafkajs";
import { env } from "../config/env.config";

export class KafkaService {
    private static instance: KafkaService;
    private kafka: Kafka;
    private admin: Admin | null = null;
    private producer: Producer | null = null; // Single producer for all topics
    private consumers: Map<string, Consumer> = new Map(); // One consumer per consumer group
    private isConnected = false;

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

    // Initialize a single producer for all topics
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
        try {
            const listTopics = await admin.listTopics();
            const newTopics = topics.filter((t) => !listTopics.includes(t));

            if (newTopics.length === 0) {
                console.log("All topics already exist");
                return;
            }

            await admin.createTopics({
                waitForLeaders: true,
                topics: newTopics.map((topic) => ({
                    topic,
                    numPartitions: 3,
                    replicationFactor: 3,
                })),
            });

            console.log(`Topics created: ${newTopics.join(", ")}`);

            // Wait for all topics to have leaders
            await Promise.all(topics.map(topic => this.waitForLeaders(admin, topic)));
        } catch (err) {
            console.error("Error creating topics:", err);
            throw err;
        }
    }

    private async waitForLeaders(admin: Admin, topic: string): Promise<void> {
        const timeout = 30000;
        const interval = 2000;
        const start = Date.now();

        while (Date.now() - start < timeout) {
            try {
                const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
                const topicData = metadata.topics.find(t => t.name === topic);
                
                if (topicData && !topicData.partitions.some(p => p.leader === -1)) {
                    console.log(`Leaders ready for topic: ${topic}`);
                    return;
                }

                console.log(`Waiting for leaders for topic ${topic}...`);
                await new Promise(r => setTimeout(r, interval));
            } catch (err) {
                console.warn(`Error checking leaders for ${topic}:`, err);
                await new Promise(r => setTimeout(r, interval));
            }
        }

        throw new Error(`Timeout: leaders not ready for topic ${topic}`);
    }

    // Send message to any topic using the single producer
    public async sendMessage(topic: string, messages: any[]): Promise<void> {
        await this.initializeProducer();
        
        if (!this.producer) {
            throw new Error("Producer not initialized");
        }

        try {
            const formattedMessages = messages.map(msg => ({
                value: typeof msg === 'string' ? msg : JSON.stringify(msg),
                timestamp: Date.now().toString()
            }));

            await this.producer.send({
                topic,
                messages: formattedMessages
            });

            console.log(`Messages sent to topic: ${topic}`);
        } catch (err) {
            console.error(`Error sending messages to ${topic}:`, err);
            throw err;
        }
    }

    // Create a long-running consumer for multiple topics
    public async createConsumer(
        groupId: string, 
        topics: string[],
        messageHandler: (payload: EachBatchPayload) => Promise<void>
    ): Promise<void> {
        const consumerKey = groupId;
        
        if (this.consumers.has(consumerKey)) {
            console.log(`Consumer for group ${groupId} already exists`);
            return;
        }

        try {
            // Ensure topics exist and have leaders
            const admin = await this.getAdmin();
            await Promise.all(topics.map(topic => this.waitForLeaders(admin, topic)));

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

            // Connect with retry logic
            let retries = 3;
            while (retries > 0) {
                try {
                    await consumer.connect();
                    console.log(`Consumer connected for group: ${groupId}`);
                    break;
                } catch (err) {
                    retries--;
                    console.warn(`Consumer connection retry for ${groupId}, attempts left: ${retries}`);
                    if (retries === 0) throw err;
                    await new Promise(r => setTimeout(r, 5000));
                }
            }

            // Subscribe to all topics
            await consumer.subscribe({ 
                topics, 
                fromBeginning: false 
            });

            // Start consuming with eachBatch
            await consumer.run({
                eachBatch: async (payload: EachBatchPayload) => {
                    try {
                        console.log(`Processing batch for topic: ${payload.batch.topic}, partition: ${payload.batch.partition}, messages: ${payload.batch.messages.length}`);
                        await messageHandler(payload);
                        
                        // Commit offsets after processing
                        await payload.commitOffsetsIfNecessary();
                    } catch (error) {
                        console.error(`Error processing batch for topic ${payload.batch.topic}:`, error);
                        // Don't commit offsets on error - messages will be reprocessed
                    }
                }
            });

            this.consumers.set(consumerKey, consumer);
            console.log(`Consumer started for group: ${groupId}, topics: ${topics.join(', ')}`);

        } catch (err) {
            console.error(`Error creating consumer for group ${groupId}:`, err);
            throw err;
        }
    }

    // Graceful shutdown
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

// Usage Example:
export class MessageProcessor {
    private kafkaService = KafkaService.getInstance();

    async initialize() {
        // Create topics
        await this.kafkaService.createTopics(['notify', 'bill', 'payment']);

        // Create consumers for different groups
        await this.kafkaService.createConsumer(
            'billing-group',
            ['bill', 'payment'],
            this.handleBillingMessages.bind(this)
        );

        await this.kafkaService.createConsumer(
            'notification-group',
            ['notify'],
            this.handleNotificationMessages.bind(this)
        );
    }

    private async handleBillingMessages(payload: EachBatchPayload) {
        const { batch } = payload;
        
        for (const message of batch.messages) {
            const value = message.value?.toString();
            console.log(`Processing billing message from topic ${batch.topic}:`, value);
            
            // Your business logic here
            if (batch.topic === 'bill') {
                // Handle bill messages
            } else if (batch.topic === 'payment') {
                // Handle payment messages
            }
        }
    }

    private async handleNotificationMessages(payload: EachBatchPayload) {
        const { batch } = payload;
        
        for (const message of batch.messages) {
            const value = message.value?.toString();
            console.log(`Processing notification message:`, value);
            
            // Your notification logic here
        }
    }

    async sendBillNotification(billData: any) {
        await this.kafkaService.sendMessage('notify', [billData]);
    }

    async sendPaymentUpdate(paymentData: any) {
        await this.kafkaService.sendMessage('payment', [paymentData]);
    }
}