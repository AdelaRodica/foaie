import { z } from "zod";

const email = z.string().trim().email();
const password = z.string().min(8);

export const signInSchema = z.object({
  email,
  password: z.string().min(1),
});

export const signUpSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string().min(1),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ["confirmPassword"],
  });

export const recoverySchema = z.object({ email });

export const updatePasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    path: ["confirmPassword"],
  });
