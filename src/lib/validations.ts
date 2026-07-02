import { z } from "zod";

function passwordSchema() {
  return z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number");
}

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: passwordSchema(),
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
  deliveryOption: z.enum(["URGENT", "STANDARD", "FLEXIBLE"]),
  resinRelated: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean()
  ),
  giftOption: z.preprocess(
    (v) => v === "true" || v === true,
    z.boolean()
  ),
  giftMessage: z.string().optional(),
  deliveryDate: z.string().optional(),
  paymentProvider: z.enum(["RAZORPAY", "STRIPE"]).default("RAZORPAY"),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

export const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be positive"),
  compareAtPrice: z.number().positive().optional().nullable(),
  inventory: z.number().int().min(0),
  weight: z.number().positive().optional().nullable(),
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
  productId: z.string().optional(),
  productTitle: z.string().optional(),
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
