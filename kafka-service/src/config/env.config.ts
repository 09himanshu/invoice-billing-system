import {config} from 'dotenv'
import {z} from 'zod'

config()

const envSchema = z.object({
  clientId: z.string(),
  brokers: z.string(),
  topics: z.string(),
  DB_URL: z.string(),
  dialect: z.string(),
  kafka_group_id_1: z.string(),
  kafka_group_id_2: z.string(),
  redisPort: z.string(),
  redisUsername: z.string(),
  redisPassword: z.string(),
  redisHost: z.string() 
})

const parseEnv = envSchema.safeParse(process.env)

if(!parseEnv.success) {
  console.error("Invalid environment variables:", parseEnv.error.format())
  process.exit(1)
}

export const env = parseEnv.data
