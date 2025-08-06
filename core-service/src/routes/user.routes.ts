import {Router} from 'express'

// custom import
import * as controller from '../controller/user.controller'
import * as middleware from '../middleware/userValidate.middleware'

const router = Router()

router.post('/register', [middleware.validateUser], controller.registerUser)

export default router