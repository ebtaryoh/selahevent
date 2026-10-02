import { fileTypeFromBuffer } from "file-type";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_MEDIA_FILES = 8;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function validateMediaFile(file: File) {
  if (!file || file.size <= 0) return "Empty media files are not allowed.";

  const declaredType = file.type.toLowerCase();
  const isImage = ALLOWED_IMAGE_TYPES.has(declaredType);
  const isVideo = ALLOWED_VIDEO_TYPES.has(declaredType);

  if (!isImage && !isVideo) {
    return "Unsupported media type. Use JPG, PNG, WebP, GIF, MP4, WebM, or MOV.";
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) return "Images must be 10 MB or smaller.";
  if (isVideo && file.size > MAX_VIDEO_BYTES) return "Videos must be 100 MB or smaller.";

  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(bytes);

  if (!detected) {
    return "The uploaded file could not be verified.";
  }

  const allowedDetected = new Set(
    isImage
      ? ["jpg", "png", "webp", "gif"]
      : ["mp4", "webm", "mov"],
  );

  if (!allowedDetected.has(detected.ext)) {
    return "The uploaded file contents do not match the selected media type.";
  }

  if (
    (declaredType === "image/jpeg" && detected.ext !== "jpg") ||
    (declaredType === "image/png" && detected.ext !== "png") ||
    (declaredType === "image/webp" && detected.ext !== "webp") ||
    (declaredType === "image/gif" && detected.ext !== "gif") ||
    (declaredType === "video/mp4" && detected.ext !== "mp4") ||
    (declaredType === "video/webm" && detected.ext !== "webm") ||
    (declaredType === "video/quicktime" && detected.ext !== "mov")
  ) {
    return "The uploaded file contents do not match the declared MIME type.";
  }

  return null;
}

export function mediaFilename(file: File) {
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";

  return Date.now() + "-" + crypto.randomUUID() + "." + ext;
}
