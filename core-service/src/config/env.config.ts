import {z} from 'zod'
import {config} from 'dotenv'

config()

const envSchema = z.object({
  DB_URL: z.string(),
  dialect: z.string(),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.string().default("8080"),
  postgres_user: z.string(),
  postgres_pass: z.string(),
  clientId: z.string(),
  brokers: z.string(),
  topics: z.string(),
  kafka_group_id_1: z.string(),
  kafka_group_id_2: z.string(),
  redisPort: z.string(),
  redisUsername: z.string(),
  redisPassword: z.string(),
  redisHost: z.string(),
})

const parseEnv = envSchema.safeParse(process.env)

if(!parseEnv.success) {
  console.error("Invalid environment variables:", parseEnv.error.format())
  process.exit(1)
}

export const env = parseEnv.data
