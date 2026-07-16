import { z } from "zod";

// ============================================================
// Auth Validators
// ============================================================
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be under 50 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const passwordResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^a-zA-Z0-9]/, "Must contain at least one special character"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

// ============================================================
// Book Validators
// ============================================================
export const bookFieldsSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  slug: z
    .string()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  author: z.string().min(2).max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  longDescription: z.string().max(5000).optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).max(10),
  price: z.number().min(0, "Price cannot be negative").max(99999),
  originalPrice: z.number().min(0).optional(),
  bookType: z.enum(["free", "paid"]).optional().default("paid"),
  status: z.enum(["published", "draft"]),
  pageCount: z.number().int().positive().optional(),
  language: z.string().min(1),
});

export const createBookSchema = bookFieldsSchema.refine((data) => {
  if (data.bookType === "paid" && (!data.price || data.price <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Paid books must have a price greater than ₹0",
  path: ["price"],
});

export const updateBookSchema = bookFieldsSchema.partial().refine((data) => {
  if (data.bookType === "paid" && (data.price !== undefined && data.price <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Paid books must have a price greater than ₹0",
  path: ["price"],
});

// ============================================================
// Order & Payment Validators
// ============================================================
export const createOrderSchema = z.object({
  bookId: z
    .string()
    .min(1, "Book ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid book ID format"),
  couponCode: z
    .string()
    .regex(/^[A-Z0-9_-]{3,20}$/, "Invalid coupon format")
    .optional()
    .or(z.literal("")),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1).startsWith("order_"),
  razorpayPaymentId: z.string().min(1).startsWith("pay_"),
  razorpaySignature: z.string().min(1),
  bookId: z.string().min(1),
  orderId: z.string().min(1), // Our internal order ID in Firestore
});

// ============================================================
// Coupon Validator
// ============================================================
export const createCouponSchema = z.object({
  code: z
    .string()
    .min(3, "Coupon code must be at least 3 characters")
    .max(20)
    .regex(/^[A-Z0-9_-]+$/, "Code must be uppercase letters, numbers, underscores, or hyphens"),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  usageLimit: z.number().int().positive().optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().optional(),
  applicableBookIds: z.array(z.string()).optional(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, "Coupon code is required"),
  bookId: z.string().min(1, "Book ID is required"),
});

// ============================================================
// Download Validator
// ============================================================
export const downloadRequestSchema = z.object({
  bookId: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  orderId: z.string().min(1),
});

// ============================================================
// Review Validator
// ============================================================
export const createReviewSchema = z.object({
  bookId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100),
  content: z.string().min(10, "Review must be at least 10 characters").max(2000),
});

// ============================================================
// Settings Validator
// ============================================================
export const updateSettingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  siteDescription: z.string().max(500),
  contactEmail: z.string().email(),
  maxDownloadsPerOrder: z.number().int().min(1).max(20),
  downloadExpiryHours: z.number().int().min(1).max(720),
  maintenanceMode: z.boolean(),
  allowRegistrations: z.boolean(),
});

// ============================================================
// Type exports
// ============================================================
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PasswordResetInput = z.infer<typeof passwordResetSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateBookInput = Omit<z.infer<typeof createBookSchema>, "bookType"> & {
  bookType: "free" | "paid";
};
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>;
export type DownloadRequestInput = z.infer<typeof downloadRequestSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
