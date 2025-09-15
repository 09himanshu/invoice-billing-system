import { insertUser} from './controller/users.controller'
import {genBill} from './controller/bill.controller'


async function bootstrap() {
  await Promise.all([
    insertUser(),
    genBill()
  ])
}

bootstrap().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})