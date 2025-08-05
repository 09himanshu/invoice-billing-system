import { Router } from 'express';
import { registerUser } from '../controller/user.controller';
import { validate } from '../middleware/userValidate.middleware';
import { registerUserSchema } from '../schema/user.schema';

const router = Router();

router.post('/register', validate(registerUserSchema), registerUser);

export default router;
