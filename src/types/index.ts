// ============================================================
// Core Domain Types for PageVault Digital Ebook Store
// ============================================================

export type UserRole = "admin" | "customer";

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: "admin";
  createdAt: string;
  lastLogin?: string;
  lastLoginIp?: string;
  twoFactorEnabled?: boolean;
}

export interface Customer {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: "customer";
  createdAt: string;
  updatedAt: string;
  purchasedBooks: string[]; // Array of book IDs
  totalSpent: number;
  downloadCount: number;
}

// ============================================================
// Book
// ============================================================
export type BookStatus = "published" | "draft";

export interface Book {
  id: string;
  title: string;
  slug: string;
  author: string;
  description: string;
  longDescription?: string;
  coverImageUrl: string;
  previewUrl?: string; // Public preview PDF
  category: string;
  tags: string[];
  price: number;
  originalPrice?: number | null; // For showing discounts
  bookType?: "free" | "paid";
  status: BookStatus;
  rating: number;
  reviewCount: number;
  pageCount?: number;
  language: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Admin UID
  // Internal fields (not exposed to client)
  ebookPublicId?: string; // Cloudinary public_id (new format — preferred)
  ebookUrl?: string;      // Legacy: direct Cloudinary URL (old format — backward-compat)
  totalDownloads: number;
  totalSales: number;
}

// ============================================================
// Order
// ============================================================
export type OrderStatus =
  | "pending"
  | "payment_initiated"
  | "paid"
  | "failed"
  | "refunded";

export interface Order {
  id: string;
  customerId: string;
  customerEmail: string;
  bookId: string;
  bookTitle: string;
  bookCoverUrl: string;
  amount: number; // In paise (Razorpay standard)
  currency: string;
  status: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  couponCode?: string;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  refundedAt?: string;
  downloadCount: number;
  maxDownloads: number; // Default 5
  downloadExpiresAt?: string; // 24 or 72 hours from purchase
}

// ============================================================
// Coupon
// ============================================================
export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // Percentage (0-100) or fixed amount in rupees
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil?: string;
  applicableBookIds?: string[]; // Empty = applies to all
  createdAt: string;
  createdBy: string; // Admin UID
}

// ============================================================
// Review
// ============================================================
export interface Review {
  id: string;
  bookId: string;
  customerId: string;
  customerName: string;
  customerPhotoURL?: string;
  rating: number; // 1-5
  title: string;
  content: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Audit Log
// ============================================================
export type AuditAction =
  | "BOOK_CREATED"
  | "BOOK_UPDATED"
  | "BOOK_DELETED"
  | "PRICE_CHANGED"
  | "COUPON_CREATED"
  | "COUPON_DELETED"
  | "REFUND_ISSUED"
  | "CUSTOMER_DELETED"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "SETTINGS_CHANGED"
  | "PDF_DOWNLOADED"
  | "ORDER_VERIFIED";

export interface AuditLog {
  id: string;
  action: AuditAction;
  adminId: string;
  adminName: string;
  adminEmail: string;
  targetId?: string; // Book ID, Customer ID, etc.
  targetName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

// ============================================================
// Settings
// ============================================================
export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maxDownloadsPerOrder: number;
  downloadExpiryHours: number;
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  featuredBookIds: string[];
  updatedAt: string;
  updatedBy: string;
}

// ============================================================
// API Response Types
// ============================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface DownloadTokenResponse {
  downloadUrl: string;
  expiresAt: string;
}

// ============================================================
// Cart / Checkout
// ============================================================
export interface CartItem {
  bookId: string;
  title: string;
  author: string;
  coverImageUrl: string;
  price: number;
  originalPrice?: number;
}

export interface CheckoutSession {
  cartItem: CartItem;
  couponCode?: string;
  discountAmount: number;
  finalAmount: number;
}
