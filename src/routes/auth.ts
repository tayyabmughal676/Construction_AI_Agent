import { Elysia } from 'elysia';
import { UserSchema } from '../db/models/User';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { mongodb } from '../db/mongodb';

const authRouter = new Elysia();

authRouter.post('/register', async (c) => {
  try {
    const body = await c.request.json();
    const userData = UserSchema.parse(body);

    // Check if user already exists
    const existingUser = await mongodb.getDb().collection('users').findOne({ email: userData.email });
    if (existingUser) {
      c.set.status = 409;
      return { error: 'User already exists' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await mongodb.getDb().collection('users').insertOne(user);
    c.set.status = 201;
    return { message: 'User registered successfully', userId: result.insertedId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    c.set.status = 400;
    return { error: 'Registration failed', details: errorMessage };
  }
});

authRouter.post('/login', async (c) => {
  try {
    const { email, password } = await c.request.json() as { email: string; password: string };

    if (!email || !password) {
      c.set.status = 400;
      return { error: 'Email and password required' };
    }

    const user = await mongodb.getDb().collection('users').findOne({ email });
    if (!user) {
      c.set.status = 401;
      return { error: 'Invalid credentials' };
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      c.set.status = 401;
      return { error: 'Invalid credentials' };
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN || '7d' } as SignOptions
    );

    return {
      token,
      user: { id: user._id, email: user.email, role: user.role }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    c.set.status = 400;
    return { error: 'Login failed', details: errorMessage };
  }
});

export default authRouter;
