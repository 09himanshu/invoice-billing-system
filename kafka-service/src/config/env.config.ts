import {config} from 'dotenv'
import {z} from 'zod'

config()

const envSchema = z.object({
  clientId: z.string(),
  brokers: z.string(),
  topics: z.string(),
  DB_URL: z.string().url(),
  dialect: z.string(),
})

const parseEnv = envSchema.safeParse(process.env)

if(!parseEnv.success) {
  console.error("Invalid environment variables:", parseEnv.error.format())
  process.exit(1)
}

export const env = parseEnv.data
