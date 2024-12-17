/** @format */

import { z } from "zod";

export const formSchema = z.object({
  username: z.string().min(2).max(50),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export type FormSchema = typeof formSchema;
