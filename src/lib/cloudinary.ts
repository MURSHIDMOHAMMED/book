export async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset || cloudName === "your_cloud_name" || preset === "your_unsigned_preset") {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Failed to upload image to Cloudinary: ${errorData.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return data.secure_url;
}

/**
 * Uploads a raw file (e.g. PDF) to Cloudinary.
 * Returns both the public_id (used for server-side URL generation)
 * and the secure_url (for reference only — do NOT expose this to clients directly).
 *
 * IMPORTANT: For PDFs to be deliverable, you must also disable
 * "Restrict PDF and ZIP files delivery" in Cloudinary Dashboard → Settings → Security.
 */
export async function uploadRawToCloudinary(file: File): Promise<{ publicId: string; secureUrl: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset || cloudName === "your_cloud_name" || preset === "your_unsigned_preset") {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  // Explicitly request public delivery — prevents Cloudinary from marking as "authenticated"
  formData.append("access_mode", "public");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Failed to upload PDF to Cloudinary: ${errorData.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return { publicId: data.public_id, secureUrl: data.secure_url };
}
