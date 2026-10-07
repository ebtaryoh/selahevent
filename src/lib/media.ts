import { randomUUID } from "crypto";

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 4 * 1024 * 1024;
export const MAX_MEDIA_FILES = 8;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function hasPrefix(bytes: Buffer, prefix: number[]) {
  return prefix.every((value, index) => bytes[index] === value);
}

function detectType(bytes: Buffer): "jpg" | "png" | "webp" | "gif" | "mp4" | "webm" | null {
  if (hasPrefix(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (bytes.subarray(0, 6).toString("ascii") === "GIF87a" || bytes.subarray(0, 6).toString("ascii") === "GIF89a") return "gif";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (hasPrefix(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "webm";
  if (bytes.length >= 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp") return "mp4";
  return null;
}

export async function validateMediaFile(file: File) {
  if (!file || file.size <= 0) return "Empty media files are not allowed.";

  const declaredType = file.type.toLowerCase();
  const isImage = ALLOWED_IMAGE_TYPES.has(declaredType);
  const isVideo = ALLOWED_VIDEO_TYPES.has(declaredType);

  if (!isImage && !isVideo) {
    return "Unsupported media type. Use JPG, PNG, WebP, GIF, MP4, WebM, or MOV.";
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) return "Images must be 4 MB or smaller.";
  if (isVideo && file.size > MAX_VIDEO_BYTES) return "Videos must be 4 MB or smaller.";

  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = detectType(bytes);

  if (!detected) return "The uploaded file could not be verified.";

  if (isImage && !new Set(["jpg", "png", "webp", "gif"]).has(detected)) {
    return "The uploaded file contents do not match the selected media type.";
  }

  if (isVideo && !new Set(["mp4", "webm"]).has(detected)) {
    return "The uploaded file contents do not match the selected media type.";
  }

  if (
    (declaredType === "image/jpeg" && detected !== "jpg") ||
    (declaredType === "image/png" && detected !== "png") ||
    (declaredType === "image/webp" && detected !== "webp") ||
    (declaredType === "image/gif" && detected !== "gif") ||
    (declaredType === "video/mp4" && detected !== "mp4") ||
    (declaredType === "video/webm" && detected !== "webm") ||
    (declaredType === "video/quicktime" && detected !== "mp4")
  ) {
    return "The uploaded file contents do not match the declared MIME type.";
  }

  return null;
}

export function mediaFilename(file: File) {
  const ext = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";
  return Date.now() + "-" + randomUUID() + "." + ext;
}
