/** @format */

import { z } from "zod";

export const formSchema = z.object({
  username: z.string().min(2).max(50).email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  companyId: z.string().optional(),
  newCompanyName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

export type FormSchema = typeof formSchema;

// Type for company selection
export interface CompanyOption {
  id: string;
  name: string;
}
