"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createBookSchema, type CreateBookInput } from "@/lib/validators";
import { uploadToCloudinary, uploadRawToCloudinary } from "@/lib/cloudinary";
import {
  Upload,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  FileText,
  Lock,
} from "lucide-react";

export default function NewBookPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateBookInput>({
    resolver: zodResolver(createBookSchema),
    defaultValues: {
      bookType: "paid",
      status: "draft",
      language: "English",
      tags: [],
      price: 0,
    },
  });

  const bookType = watch("bookType") || "paid";

  useEffect(() => {
    if (bookType === "free") {
      setValue("price", 0);
      setValue("originalPrice", undefined);
    }
  }, [bookType, setValue]);

  const title = watch("title");
  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    setValue("slug", slug);
  };

  const onSubmit = async (data: CreateBookInput) => {
    if (!coverFile) { setServerError("Cover image is required"); return; }
    if (!ebookFile) { setServerError("PDF ebook file is required"); return; }
    if (!user) return;

    setUploading(true);
    setServerError("");
    setUploadProgress(0);

    try {
      // Upload cover image to Cloudinary
      const coverUrl = await uploadToCloudinary(coverFile);
      setUploadProgress(40);

      // Upload ebook PDF to Cloudinary (raw file) — store public_id for server-side signed URL generation
      const { publicId: ebookPublicId } = await uploadRawToCloudinary(ebookFile);
      setUploadProgress(80);

      // Save to Firestore
      await addDoc(collection(db, "books"), {
        ...data,
        price: Math.round(data.price * 100), // Store in paise
        originalPrice: data.originalPrice ? Math.round(data.originalPrice * 100) : null,
        coverImageUrl: coverUrl,
        ebookPublicId: ebookPublicId,
        totalDownloads: 0,
        totalSales: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.uid,
        _createdAt: serverTimestamp(),
      });

      setUploadProgress(100);
      router.push("/admin/books");
    } catch (err) {
      console.error(err);
      setServerError("Failed to create book. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const inputClass = (fieldName: keyof CreateBookInput) =>
    `input ${errors[fieldName] ? "input-error" : ""}`;

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 800 }}>
      <div style={{ marginBottom: "2rem" }}>
        <button onClick={() => router.back()} className="btn btn-outline btn-sm" style={{ marginBottom: "1rem" }}>
          <ArrowLeft size={15} /> Back
        </button>
        <h1>Add New Book</h1>
        <p>Upload a new ebook to your store</p>
      </div>

      {serverError && (
        <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>{serverError}</div>
      )}

      {uploading && (
        <div className="nb-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Uploading...</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>{uploadProgress}%</span>
          </div>
          <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 999, border: "1.5px solid var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--accent-yellow)", transition: "width 0.3s ease", borderRadius: 999 }} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="grid-2" style={{ gap: "1.5rem" }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="label">Title *</label>
              <input
                className={inputClass("title")}
                placeholder="Enter book title"
                {...register("title", { onChange: handleTitleChange })}
              />
              {errors.title && <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.title.message}</p>}
            </div>

            <div>
              <label className="label">Slug *</label>
              <input className={inputClass("slug")} placeholder="auto-generated-from-title" {...register("slug")} />
              {errors.slug && <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.slug.message}</p>}
            </div>

            <div>
              <label className="label">Author *</label>
              <input className={inputClass("author")} placeholder="Author name" {...register("author")} />
              {errors.author && <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.author.message}</p>}
            </div>

             <div className="grid-2" style={{ gap: "1rem" }}>
              <div>
                <label className="label">Book Type *</label>
                <select className="input" {...register("bookType")}>
                  <option value="paid">Paid</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div />
            </div>

            {bookType === "paid" && (
              <div className="grid-2" style={{ gap: "1rem" }}>
                <div>
                  <label className="label">Price (₹) *</label>
                  <input type="number" className={inputClass("price")} placeholder="299" step="0.01" min="0" {...register("price", { valueAsNumber: true })} />
                  {errors.price && <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.price.message}</p>}
                </div>
                <div>
                  <label className="label">Original Price (₹)</label>
                  <input type="number" className="input" placeholder="499" step="0.01" min="0" {...register("originalPrice", { valueAsNumber: true })} />
                </div>
              </div>
            )}

            <div className="grid-2" style={{ gap: "1rem" }}>
              <div>
                <label className="label">Category *</label>
                <select className={inputClass("category")} {...register("category")}>
                  <option value="">Select...</option>
                  {["Fiction","Non-Fiction","Technology","Business","Science","Self-Help","History","Biography"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.category.message}</p>}
              </div>
              <div>
                <label className="label">Status *</label>
                <select className="input" {...register("status")}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ gap: "1rem" }}>
              <div>
                <label className="label">Language</label>
                <input className="input" defaultValue="English" {...register("language")} />
              </div>
              <div>
                <label className="label">Page Count</label>
                <input type="number" className="input" placeholder="320" {...register("pageCount", { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Cover Upload */}
            <div>
              <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ImageIcon size={14} /> Cover Image *
              </label>
              <label
                style={{
                  display: "block",
                  cursor: "pointer",
                  border: "2.5px dashed var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  aspectRatio: "3/4",
                  background: coverPreview ? "transparent" : "var(--gray-100)",
                  position: "relative",
                  transition: "border-color 0.2s",
                }}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="flex-center" style={{ height: "100%", flexDirection: "column", gap: 8, color: "var(--text-muted)" }}>
                    <Upload size={28} />
                    <span style={{ fontSize: "0.85rem" }}>Click to upload cover</span>
                    <span style={{ fontSize: "0.75rem" }}>JPG, PNG, WebP</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverFile(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>

            {/* PDF Upload */}
            <div>
              <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={14} /> Ebook PDF * <span className="badge badge-pink" style={{ fontSize: "0.65rem" }}>Private</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "1rem",
                  border: "2.5px dashed var(--border)",
                  borderRadius: 10,
                  cursor: "pointer",
                  background: ebookFile ? "rgba(0,230,118,0.06)" : "var(--gray-100)",
                  transition: "all 0.2s",
                }}
              >
                <FileText size={28} style={{ color: ebookFile ? "var(--accent-green)" : "var(--text-muted)", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    {ebookFile ? ebookFile.name : "Click to upload PDF"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {ebookFile ? `${(ebookFile.size / 1024 / 1024).toFixed(1)} MB` : "PDF files only"}
                  </div>
                </div>
                <input type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setEbookFile(e.target.files?.[0] ?? null)} />
              </label>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <Lock size={11} /> Stored in a private Firebase Storage folder. Never publicly accessible.
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="label">Short Description *</label>
          <textarea
            className={inputClass("description")}
            rows={3}
            placeholder="A compelling short description (max 500 chars)..."
            {...register("description")}
            style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
          />
          {errors.description && <p style={{ color: "var(--accent-pink)", fontSize: "0.8rem", marginTop: 4 }}>{errors.description.message}</p>}
        </div>

        <div>
          <label className="label">Long Description</label>
          <textarea
            className="input"
            rows={6}
            placeholder="Detailed description..."
            {...register("longDescription")}
            style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
          />
        </div>

        {/* Submit */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={uploading} className="btn btn-primary btn-lg">
            {uploading ? <><Loader2 size={18} className="animate-spin" /> Uploading {uploadProgress}%...</> : <><Upload size={18} /> Publish Book</>}
          </button>
        </div>
      </form>
    </div>
  );
}
