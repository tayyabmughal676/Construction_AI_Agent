import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'user', 'agent']);

export const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  role: UserRoleSchema.default('user'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
