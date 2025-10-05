import { insertUser} from './controller/users.controller'
import {genBill} from './controller/bill.controller'
import {sendMail} from './controller/sendNotification.controller'

async function bootstrap() {
  await Promise.all([
    insertUser(),
    genBill(),
    sendMail()
  ])
}

bootstrap().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})