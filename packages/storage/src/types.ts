/**
 * Accepted body shapes for uploads. Providers normalize to `Uint8Array`
 * or pass through to their native API.
 */
export type StorageUploadBody = ArrayBuffer | Uint8Array | Blob

/**
 * Options controlling an upload.
 */
export interface UploadOptions {
  /**
   * Override the object key. When omitted, providers generate a random
   * key (typically `${randomUUID()}` — UUID v4 where available).
   */
  key?: string
  /** MIME content type (e.g. `"image/png"`). */
  contentType?: string
  /** Custom metadata; persisted by providers that support it (R2, S3). */
  metadata?: Record<string, string>
}

/**
 * Result of a successful upload.
 */
export interface StorageObject {
  /** Object key inside the bucket/store. */
  key: string
  /**
   * Public URL for the object when the provider exposes one. Empty string
   * when the object is private and can only be accessed via `signedUrl`.
   */
  url: string
}

/**
 * Pluggable object storage provider.
 *
 * Built-in implementations:
 * - `local` — in-memory, for dev and tests
 * - `r2`    — Cloudflare R2 via the workers binding
 * - `s3`    — Amazon S3 / S3-compatible via SigV4
 */
export interface StorageProvider {
  /** Unique provider name (e.g. `"r2"`, `"s3"`, `"local"`). */
  readonly name: string
  /** Upload an object. */
  upload(body: StorageUploadBody, options?: UploadOptions): Promise<StorageObject>
  /** Delete an object by key. No-op if the key does not exist. */
  delete(key: string): Promise<void>
  /**
   * Produce a time-limited URL that grants GET access to the object.
   * `expiresIn` is in seconds.
   */
  signedUrl(key: string, expiresIn: number): Promise<string>
  /**
   * Fetch an object's bytes. Returns `null` when the object is absent.
   */
  get(key: string): Promise<ArrayBuffer | null>
}
