import {z} from 'zod'

export const userSchema = z.object({
  firstname: z.string().min(1).max(50),
  middlename: z.string().min(1).max(50).optional(),
  lastname: z.string().min(1).max(50),
  mobile: z.string().min(10).max(15).min(10).max(15),
  email: z.string().email(),
  dob: z.date()
})