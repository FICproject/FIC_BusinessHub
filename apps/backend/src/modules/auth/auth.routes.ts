import { Router } from 'express';
import { register, login, getMe, updateProfile } from './auth.controller';
import { authenticate } from '../../common/middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', authenticate, getMe);
authRouter.patch('/profile', authenticate, updateProfile);

