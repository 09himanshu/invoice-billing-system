import {z} from 'zod'
import {config} from 'dotenv'

config()

const envSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.string().default("8080"),
  DB_URL: z.string(),
  dialect: z.string(),
  logging: z.string(),
  connectTimeout: z.string(),
  max: z.string(),
  min: z.string(),
  acquire: z.string(),
  idle: z.string()
})

const parseEnv = envSchema.safeParse(process.env)

if(!parseEnv.success) {
  console.error("Invalid environment variables:", parseEnv.error.format())
  process.exit(1)
}

export const env = parseEnv.data
