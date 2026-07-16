/**
 * Resolves a publicly deliverable Cloudinary URL for a raw asset from its public_id.
 * Includes the `fl_attachment` flag so the browser downloads the file
 * instead of opening it in the PDF viewer.
 *
 * Security model:
 * - PDFs are uploaded as type=upload (public delivery) to Cloudinary.
 * - The public_id is stored in Firestore, but the URL is NEVER exposed to clients.
 * - All access goes through /api/download, which verifies JWT, order, and download limits
 *   before generating this URL server-side and issuing a redirect.
 *
 * @param publicId - The Cloudinary public_id stored in Firestore
 * @param filename - Optional download filename shown to the user (e.g. "my-book.pdf")
 */
/**
 * Transforms a Cloudinary URL to force a file download (Content-Disposition: attachment).
 * 
 * Cloudinary URLs have the format:
 * https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/[transformations]/[version]/<public_id>
 * 
 * We insert `fl_attachment` or `fl_attachment:filename` into the transformations section.
 *
 * @param urlOrPublicId - The existing Cloudinary URL or a raw public_id
 * @param filename - Optional custom filename for the download (e.g. "book.pdf")
 */
export function getCloudinaryDownloadUrl(urlOrPublicId: string, filename?: string): string {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured.");
  }

  const attachmentFlag = "fl_attachment";

  // If it's already a full URL, parse it and inject the flag
  if (urlOrPublicId.startsWith("http")) {
    try {
      const urlObj = new URL(urlOrPublicId);
      if (urlObj.hostname.includes("cloudinary.com")) {
        const parts = urlObj.pathname.split("/");
        
        // Find the index of "upload", "authenticated", etc.
        const typeIndex = parts.findIndex(p => ["upload", "authenticated", "private"].includes(p));
        
        if (typeIndex !== -1) {
          // Insert the attachment flag right after the type (e.g., after /upload/)
          parts.splice(typeIndex + 1, 0, attachmentFlag);
          urlObj.pathname = parts.join("/");
          return urlObj.toString();
        }
      }
      // If we can't parse it as Cloudinary, return as-is
      return urlOrPublicId;
    } catch {
      return urlOrPublicId;
    }
  }

  // If it's just a public_id, build the URL from scratch
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${attachmentFlag}/${urlOrPublicId}`;
}

