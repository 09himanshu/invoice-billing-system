import {config} from 'dotenv'
import {z} from 'zod'

config()

const envSchema = z.object({
  DB_URL: z.string(),
  dbName: z.string(),
  dialect: z.string(),
  clientId: z.string(),
  brokers: z.string(),
  topics: z.string(),
  kafka_group_id_1: z.string(),
  kafka_group_id_2: z.string(),
  kafka_group_id_3: z.string(),
  redisPort: z.string(),
  redisUsername: z.string(),
  redisPassword: z.string(),
  redisHost: z.string(),
  smtpHost: z.string(),
  smtpPort: z.string(),
  smtpUser: z.string(),
  smtpPassword: z.string(),
  smtpFrom: z.string()
})

const parseEnv = envSchema.safeParse(process.env)

if(!parseEnv.success) {
  console.error("Invalid environment variables:", parseEnv.error.format())
  process.exit(1)
}

export const env = parseEnv.data
