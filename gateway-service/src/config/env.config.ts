import {z} from 'zod'
import {config} from 'dotenv'

config()

const envSchema = z.object({
  DB_URL: z.string(),
  dbName: z.string(),
  PORT: z.string().default("8080"),
  HOST: z.string().default("0.0.0.0"),
  clientId: z.string(),
  brokers: z.string(),
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
