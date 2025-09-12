import os from 'os';
import crypto from 'crypto';

class SnowflakeIDGenerator {
    private static instance: SnowflakeIDGenerator;

    private datacenterId: number;
    private workerId: number;
    private sequence: number;
    private lastTimestamp: number;
    private readonly epoch: number;

    private constructor(datacenterId: number = 1, workerId: number | null = null) {
        this.datacenterId = datacenterId & 0x1F; // 5 bits (0–31)

        // Auto-generate workerId based on hostname if not provided
        if (workerId === null) {
            const hostname = os.hostname();
            const hash = crypto.createHash('md5').update(hostname).digest('hex');
            workerId = parseInt(hash.substring(0, 8), 16) & 0x1F;
        }

        this.workerId = workerId & 0x1F; // 5 bits (0–31)
        this.sequence = 0;
        this.lastTimestamp = 0;

        this.epoch = 1577836800000; // custom epoch (2020-01-01)
    }

    // Singleton access point
    public static getInstance(datacenterId: number = 1, workerId: number | null = null): SnowflakeIDGenerator {
        if (!SnowflakeIDGenerator.instance) {
            SnowflakeIDGenerator.instance = new SnowflakeIDGenerator(datacenterId, workerId);
        }
        return SnowflakeIDGenerator.instance;
    }

    private currentMillis(): number {
        return Date.now();
    }

    public generateId(): string {
        let timestamp = this.currentMillis();

        if (timestamp < this.lastTimestamp) {
            throw new Error('Clock moved backwards!');
        }

        if (timestamp === this.lastTimestamp) {
            // Same millisecond → increment sequence
            this.sequence = (this.sequence + 1) & 0xFFF; // 12 bits (0–4095)

            if (this.sequence === 0) {
                // Sequence overflow → wait for next millisecond
                while (timestamp <= this.lastTimestamp) {
                    timestamp = this.currentMillis();
                }
            }
        } else {
            this.sequence = 0;
        }

        this.lastTimestamp = timestamp;

        // Combine all parts using BigInt for 64-bit operations
        const id =
            (BigInt(timestamp - this.epoch) << 22n) |
            (BigInt(this.datacenterId) << 17n) |
            (BigInt(this.workerId) << 12n) |
            BigInt(this.sequence);

        return id.toString();
    }

    public generateFormattedId(prefix: string = '#'): string {
        return `${prefix}${this.generateId()}`;
    }
}

export function generateOrderId(prefix: string = '#'): string {
    return SnowflakeIDGenerator.getInstance().generateFormattedId(prefix);
}
