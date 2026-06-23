import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.literal("CUSTOMER").default("CUSTOMER"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const addressSchema = z.object({
  label: z.string().default("Home"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  line1: z.string().min(5, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(5, "Valid postal code required"),
  country: z.string().default("IN"),
});

export const checkoutSchema = z.object({
  address: addressSchema,
  paymentProvider: z.enum(["RAZORPAY", "STRIPE"]).default("RAZORPAY"),
  notes: z.string().optional(),
});

export const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional().nullable(),
  inventory: z.number().int().min(0),
  categoryId: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  tags: z.array(z.string()).default([]),
  sku: z.string().optional(),
  images: z.array(z.string()).max(6, "Maximum 6 images allowed").optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().min(10, "Review must be at least 10 characters").optional(),
});

export const customRequestSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^[+]?\d{10,15}$/, "Enter a valid phone number"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide more details"),
  budget: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === "" || val === null) return null;
      const num = typeof val === "string" ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
  occasion: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CheckoutFormValues = z.input<typeof checkoutSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type CustomRequestInput = z.infer<typeof customRequestSchema>;
