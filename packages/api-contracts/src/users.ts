import { z } from 'zod';

export const subscriptionStatusSchema = z.enum(['inactive', 'active', 'expired', 'canceled']);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  telegramId: z.number().int().positive(),
  username: z.string().min(1).nullable(),
  firstName: z.string().min(1),
  lastName: z.string().min(1).nullable(),
  languageCode: z.string().min(1).nullable(),
  isBot: z.boolean(),
  isPremium: z.boolean(),
  email: z.string().email().nullable(),
  subscriptionStatus: subscriptionStatusSchema,
  subscriptionProvider: z.string().min(1).nullable(),
  subscriptionPlan: z.string().min(1).nullable(),
  subscriptionActivatedAt: z.coerce.date().nullable(),
  subscriptionExpiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

export const createUserSchema = z.object({
  telegramId: z.number().int().positive(),
  username: z.string().min(1).max(255).optional(),
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255).optional(),
  languageCode: z.string().min(1).max(35).optional(),
  isBot: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  email: z.string().email().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const userParamsSchema = z.object({
  id: z.string().uuid(),
});

export type UserParams = z.infer<typeof userParamsSchema>;

export const usersListSchema = z.array(userSchema);

export type UsersList = z.infer<typeof usersListSchema>;
