import {Router} from 'express'

import userRouter from './user.routes'
import billRouter from './bill.routes'

const router = Router()

router.use('/user', userRouter)
router.use('/bill', billRouter)

export default router