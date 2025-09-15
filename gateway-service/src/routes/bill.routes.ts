import {Router} from 'express'

// custom import

import * as controller from '../controller/bills.controller'

const router = Router()

router.post('/genBill', controller.userBill)

export default router