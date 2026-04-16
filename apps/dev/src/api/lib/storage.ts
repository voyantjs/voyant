import type { StorageProvider } from "@voyantjs/voyant-storage"
import { createR2Provider } from "@voyantjs/voyant-storage/providers/r2"

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  xml: "application/xml",
  zip: "application/zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

/** Best-effort MIME type guess from a file key/path. Used by the /v1/media/* serve route. */
export function guessMimeType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? ""
  return MIME_BY_EXT[ext] ?? "application/octet-stream"
}

/**
 * Resolve the media storage provider from the environment.
 *
 * This is the single place to swap storage backends. The default uses
 * **Cloudflare R2 via the Workers binding** (`MEDIA_BUCKET`) — the native,
 * zero-signing path. Alternatives:
 *
 *   - **R2 via S3 API** (if you need cross-cloud parity or signed URLs):
 *     ```ts
 *     import { createS3Provider } from "@voyantjs/voyant-storage/providers/s3"
 *     return createS3Provider({
 *       accessKeyId: env.R2_ACCESS_KEY_ID!,
 *       secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
 *       region: "auto",
 *       bucket: env.R2_BUCKET!,
 *       endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
 *     })
 *     ```
 *
 *   - **AWS S3 / S3-compatible** (Wasabi, MinIO, Backblaze B2, Spaces, etc.):
 *     ```ts
 *     return createS3Provider({
 *       accessKeyId: env.S3_ACCESS_KEY_ID!,
 *       secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
 *       region: env.S3_REGION ?? "us-east-1",
 *       bucket: env.S3_BUCKET!,
 *       endpoint: env.S3_ENDPOINT, // optional, for S3-compatible services
 *       publicBaseUrl: `${appUrl}/api/v1/media/`,
 *     })
 *     ```
 *
 *   - **Local in-memory** (dev/tests only):
 *     ```ts
 *     import { createLocalStorageProvider } from "@voyantjs/voyant-storage/providers/local"
 *     return createLocalStorageProvider({ baseUrl: `${appUrl}/api/v1/media/` })
 *     ```
 *
 *   - **Custom** (GCS, Azure Blob, etc.): Implement the `StorageProvider`
 *     interface (upload/delete/signedUrl/get) and return it here.
 *
 * Returns `null` when no storage is configured — the upload/serve routes
 * will respond with 503.
 */
export function createMediaStorage(env: CloudflareBindings): StorageProvider | null {
  // Default: R2 via Workers binding. Replace with createS3Provider / createLocalStorageProvider
  // / your own StorageProvider to switch backends.
  const bucket = env.MEDIA_BUCKET
  if (!bucket) return null

  const appUrl = env.APP_URL?.replace(/\/api$/, "") ?? ""
  return createR2Provider({
    bucket,
    publicBaseUrl: `${appUrl}/api/v1/media/`,
  })
}
