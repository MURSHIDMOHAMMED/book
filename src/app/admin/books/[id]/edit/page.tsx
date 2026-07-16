"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { updateBookSchema, type UpdateBookInput } from "@/lib/validators";
import { uploadToCloudinary, uploadRawToCloudinary } from "@/lib/cloudinary";
import { ArrowLeft, Loader2, Save, Upload, Lock, FileText, Image as ImageIcon } from "lucide-react";
import type { Book } from "@/types";

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newEbookFile, setNewEbookFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpdateBookInput>({ resolver: zodResolver(updateBookSchema) });

  useEffect(() => {
    async function loadBook() {
      if (!bookId) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "books", bookId));
        if (!snap.exists()) { router.push("/admin/books"); return; }
        const data = { id: snap.id, ...snap.data() } as Book;
        setBook(data);
        setCoverPreview(data.coverImageUrl);
        reset({
          ...data,
          price: data.price / 100,
          originalPrice: data.originalPrice ? data.originalPrice / 100 : undefined,
          bookType: data.bookType || "paid",
        });
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [bookId, reset, router]);

  const bookType = watch("bookType") || "paid";

  useEffect(() => {
    if (bookType === "free") {
      setValue("price", 0);
      setValue("originalPrice", undefined);
    }
  }, [bookType, setValue]);

  const onSubmit = async (data: UpdateBookInput) => {
    if (!book) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    setUploadProgress(0);
    try {
      const updates: Partial<Book> & Record<string, unknown> = {
        ...data,
        price: Math.round((data.price ?? book.price / 100) * 100),
        originalPrice: data.originalPrice ? Math.round(data.originalPrice * 100) : null,
        updatedAt: new Date().toISOString(),
      };

      if (newCoverFile) {
        const coverUrl = await uploadToCloudinary(newCoverFile);
        updates.coverImageUrl = coverUrl;
        setUploadProgress(50);
      }
      if (newEbookFile) {
        const { publicId: ebookPublicId } = await uploadRawToCloudinary(newEbookFile);
        updates.ebookPublicId = ebookPublicId;
        setUploadProgress(100);
      }

      await updateDoc(doc(db, "books", book.id), updates);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem 1.5rem", maxWidth: 800 }}>
        <div className="skeleton" style={{ height: 40, width: 200, marginBottom: "2rem" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 1.5rem", maxWidth: 800 }}>
      <button onClick={() => router.back()} className="btn btn-outline btn-sm" style={{ marginBottom: "1rem" }}>
        <ArrowLeft size={15} /> Back
      </button>
      <h1 style={{ marginBottom: "0.25rem" }}>Edit Book</h1>
      <p style={{ marginBottom: "2rem" }}>{book?.title}</p>

      {error && <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>{error}</div>}
      {success && <div className="alert alert-success animate-fade-in" style={{ marginBottom: "1.5rem" }}>✓ Changes saved successfully!</div>}

      {saving && uploadProgress > 0 && (
        <div className="nb-card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
          <div className="flex-between" style={{ marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Uploading...</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>{uploadProgress}%</span>
          </div>
          <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 999, border: "1.5px solid var(--border)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${uploadProgress}%`, background: "var(--accent-yellow)", transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="grid-2" style={{ gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div>
              <label className="label">Title</label>
              <input className="input" {...register("title")} />
            </div>
            <div>
              <label className="label">Slug</label>
              <input className="input" {...register("slug")} />
            </div>
            <div>
              <label className="label">Author</label>
              <input className="input" {...register("author")} />
            </div>
             <div className="grid-2" style={{ gap: "1rem" }}>
              <div>
                <label className="label">Book Type</label>
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
                  <label className="label">Price (₹)</label>
                  <input type="number" className="input" step="0.01" min="0" {...register("price", { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="label">Original Price (₹)</label>
                  <input type="number" className="input" step="0.01" min="0" {...register("originalPrice", { valueAsNumber: true })} />
                </div>
              </div>
            )}
            <div className="grid-2" style={{ gap: "1rem" }}>
              <div>
                <label className="label">Category</label>
                <select className="input" {...register("category")}>
                  {["Fiction","Non-Fiction","Technology","Business","Science","Self-Help","History","Biography"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select className="input" {...register("status")}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Cover */}
            <div>
              <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ImageIcon size={14} /> Replace Cover
              </label>
              <label style={{ display: "block", cursor: "pointer", border: "2.5px dashed var(--border)", borderRadius: 12, overflow: "hidden", aspectRatio: "3/4", position: "relative", background: "var(--gray-100)" }}>
                {coverPreview && (
                  <img src={coverPreview} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <span style={{ color: "white", fontWeight: 700, fontSize: "0.875rem" }}>Change Cover</span>
                </div>
                <input type="file" accept="image/*" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setNewCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                  }}
                />
              </label>
            </div>

            {/* PDF */}
            <div>
              <label className="label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={14} /> Replace PDF <span className="badge badge-pink" style={{ fontSize: "0.65rem" }}>Private</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, padding: "1rem", border: "2.5px dashed var(--border)", borderRadius: 10, cursor: "pointer", background: newEbookFile ? "rgba(0,230,118,0.06)" : "var(--gray-100)" }}>
                <FileText size={24} style={{ color: newEbookFile ? "var(--accent-green)" : "var(--text-muted)", flexShrink: 0 }} />
                <div style={{ fontSize: "0.85rem" }}>
                  {newEbookFile ? newEbookFile.name : "Click to replace PDF (optional)"}
                </div>
                <input type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => setNewEbookFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Short Description</label>
          <textarea className="input" rows={3} style={{ resize: "vertical", fontFamily: "var(--font-body)" }} {...register("description")} />
        </div>
        <div>
          <label className="label">Long Description</label>
          <textarea className="input" rows={6} style={{ resize: "vertical", fontFamily: "var(--font-body)" }} {...register("longDescription")} />
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button type="button" onClick={() => router.back()} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
            {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  );
}
