
const TIMESTAMP_BITS = 41;
const WORKER_ID_BITS = 10;
const SEQUENCE_BITS = 12;
const MAX_WORKER_ID = (BigInt(1) << BigInt(WORKER_ID_BITS)) - BigInt(1);
const MAX_SEQUENCE = (BigInt(1) << BigInt(SEQUENCE_BITS)) - BigInt(1);
const WORKER_ID_SHIFT = BigInt(SEQUENCE_BITS);
const TIMESTAMP_SHIFT = BigInt(WORKER_ID_BITS + SEQUENCE_BITS);
const CUSTOM_EPOCH = BigInt(1672531200000); // Jan 1, 2023 (ms)

export class CustomerID {
  // Singleton instance
  private static instance: CustomerID;

  private workerId: bigint;
  private sequence: bigint;
  private lastTimestamp: bigint;

  // Private constructor
  private constructor(workerId: number) {
    if (workerId < 0 || BigInt(workerId) > MAX_WORKER_ID) {
      throw new Error(`Worker ID must be between 0 and ${MAX_WORKER_ID}`);
    }

    this.workerId = BigInt(workerId);
    this.sequence = BigInt(0);
    this.lastTimestamp = BigInt(-1);
  }

  // Singleton accessor
  public static getInstance(workerId: number): CustomerID {
    if (!CustomerID.instance) {
      CustomerID.instance = new CustomerID(workerId);
    }
    return CustomerID.instance;
  }

  private _currentTimeMs(): bigint {
    return BigInt(Date.now());
  }

  private _waitForNextMs(lastTimestamp: bigint): bigint {
    let timestamp = this._currentTimeMs();
    while (timestamp <= lastTimestamp) {
      timestamp = this._currentTimeMs();
    }
    return timestamp;
  }

  public generateId(): bigint {
    let timestamp = this._currentTimeMs();

    if (timestamp < this.lastTimestamp) {
      throw new Error("Clock is moving backwards. Cannot generate IDs.");
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + BigInt(1)) & MAX_SEQUENCE;
      if (this.sequence === BigInt(0)) {
        timestamp = this._waitForNextMs(this.lastTimestamp);
      }
    } else {
      this.sequence = BigInt(0);
    }

    this.lastTimestamp = timestamp;

    return (
      ((timestamp - CUSTOM_EPOCH) << TIMESTAMP_SHIFT) |
      (this.workerId << WORKER_ID_SHIFT) |
      this.sequence
    );
  }
}
