export const DEFAULT_MAX_TRACK_UPLOAD_MB = 50;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 250;
const TRANSIENT_HTTP_STATUS_CODES = new Set([408, 425, 429]);
const FNV1A_32_OFFSET_BASIS = 2166136261;
const FNV1A_32_PRIME = 16777619;

const MP3_MIME_TYPES = new Set(["audio/mpeg", "audio/mp3"]);

export type UploadFailureKind =
  | "missing_bucket"
  | "permission_or_config"
  | "invalid_file"
  | "size_limit"
  | "transient_network"
  | "unknown";

export class TrackUploadError extends Error {
  readonly kind: UploadFailureKind;
  readonly adminDetails?: string;
  readonly originalError?: unknown;

  constructor(kind: UploadFailureKind, message: string, adminDetails?: string, originalError?: unknown) {
    super(message);
    this.kind = kind;
    this.adminDetails = adminDetails;
    this.originalError = originalError;
  }
}

export interface TrackUploadResult {
  status: "uploaded" | "existing";
  path: string;
  publicUrl: string;
  title: string;
}

interface TrackRecord {
  id: string;
}

interface TrackStorageApi {
  upload: (path: string, file: File, options: { upsert: boolean; contentType: string }) => Promise<{ error: unknown | null }>;
  getPublicUrl: (path: string) => { data: { publicUrl: string } };
  list: (path?: string, options?: { limit?: number; search?: string }) => Promise<{ data: { name: string }[] | null; error: unknown | null }>;
  remove: (paths: string[]) => Promise<{ error: unknown | null }>;
}

export interface TrackUploadDependencies {
  storage: TrackStorageApi;
  findTrackByUrl: (url: string) => Promise<TrackRecord | null>;
  insertTrack: (title: string, url: string) => Promise<void>;
}

export interface TrackUploadOptions {
  maxUploadMb?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  jitterMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

function normalizeType(value: string | undefined): string {
  return (value || "").trim().toLowerCase();
}

function stripExtension(name: string): string {
  return name.replace(/\.[^.]+$/, "");
}

function normalizeFilename(name: string): string {
  return (
    stripExtension(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "track"
  );
}

function formatAdminDetails(error: unknown): string | undefined {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message = typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  const detail = [code && `code=${code}`, message && `message=${message}`].filter(Boolean).join(", ");
  return detail || undefined;
}

export function resolveMaxTrackUploadBytes(maxUploadMb?: number): number {
  const envValue = typeof maxUploadMb === "number" ? String(maxUploadMb) : import.meta.env.VITE_MAX_TRACK_UPLOAD_MB;
  const parsed = Number(envValue);
  const mb = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_TRACK_UPLOAD_MB;
  return Math.floor(mb * 1024 * 1024);
}

export function validateTrackFile(file: File, maxBytes = resolveMaxTrackUploadBytes()): void {
  if (!file || !file.name) {
    throw new TrackUploadError("invalid_file", "Please select an MP3 file before uploading.");
  }

  if (file.size <= 0) {
    throw new TrackUploadError("invalid_file", "The selected MP3 is empty. Please choose a valid MP3 file.");
  }

  if (file.size > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 100) / 100;
    throw new TrackUploadError("size_limit", `This MP3 is too large. Maximum allowed size is ${maxMb} MB.`);
  }

  const hasMp3Extension = file.name.toLowerCase().endsWith(".mp3");
  const mimeType = normalizeType(file.type);
  const hasMp3Mime = !mimeType || MP3_MIME_TYPES.has(mimeType);

  if (!hasMp3Extension || !hasMp3Mime) {
    throw new TrackUploadError("invalid_file", "Please upload a valid MP3 file (.mp3).", `Detected file type: ${mimeType || "unknown"}`);
  }
}

export function validateFallbackTrackUrl(rawUrl: string): string {
  const value = rawUrl.trim();
  if (!value) {
    throw new TrackUploadError("invalid_file", "Enter a direct MP3 URL to use upload fallback mode.");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TrackUploadError("invalid_file", "Please enter a valid public URL (https://...).");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new TrackUploadError("invalid_file", "Only http(s) links are supported for fallback tracks.");
  }

  const pathname = parsed.pathname.toLowerCase();
  if (!pathname.endsWith(".mp3")) {
    throw new TrackUploadError("invalid_file", "Fallback links must point directly to an .mp3 file.");
  }

  return parsed.toString();
}

export function isTransientStorageError(error: unknown): boolean {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "").toLowerCase() : "";
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: unknown }).status) : undefined;
  const message = typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message ?? "").toLowerCase() : "";

  if (typeof status === "number" && (TRANSIENT_HTTP_STATUS_CODES.has(status) || status >= 500)) return true;

  return ["timeout", "timed out", "network", "temporar", "unavailable", "econnreset", "etimedout"].some((token) =>
    code.includes(token) || message.includes(token),
  );
}

export function mapStorageError(error: unknown): TrackUploadError {
  if (error instanceof TrackUploadError) return error;

  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "").toLowerCase() : "";
  const message = typeof error === "object" && error && "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  const messageLower = message.toLowerCase();
  const adminDetails = formatAdminDetails(error);

  if (["nosuchbucket", "bucket_not_found", "404"].includes(code) || (messageLower.includes("bucket") && messageLower.includes("not found"))) {
    return new TrackUploadError(
      "missing_bucket",
      "Track storage bucket is missing. Ask an admin to create the 'tracks' storage bucket.",
      adminDetails,
      error,
    );
  }

  if (
    ["accessdenied", "permission_denied", "unauthorized", "401", "403", "invalidjwt", "invalid_signature"].includes(code) ||
    messageLower.includes("permission") ||
    messageLower.includes("unauthorized")
  ) {
    return new TrackUploadError(
      "permission_or_config",
      "Upload service is not configured correctly. Please contact an admin.",
      adminDetails,
      error,
    );
  }

  if (["entity_too_large", "payload_too_large", "413"].includes(code) || messageLower.includes("too large")) {
    return new TrackUploadError("size_limit", "This MP3 exceeds the upload size limit.", adminDetails, error);
  }

  if (["invalid_file_type", "invalid_mime_type", "invalid_request"].includes(code)) {
    return new TrackUploadError("invalid_file", "Please upload a valid MP3 file (.mp3).", adminDetails, error);
  }

  if (isTransientStorageError(error)) {
    return new TrackUploadError(
      "transient_network",
      "Temporary storage issue while uploading. Please try again.",
      adminDetails,
      error,
    );
  }

  return new TrackUploadError("unknown", "Upload failed due to an unexpected storage error.", adminDetails, error);
}

export async function buildDeterministicTrackPath(file: File): Promise<string> {
  const blob = file as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> };
  const buffer = typeof blob.arrayBuffer === "function"
    ? await blob.arrayBuffer()
    : await new Response(file).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // FNV-1a 32-bit hash keeps key generation deterministic across retries.
  let hash = FNV1A_32_OFFSET_BASIS;

  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, FNV1A_32_PRIME);
  }

  const digest = (hash >>> 0).toString(16).padStart(8, "0");
  return `${digest}-${normalizeFilename(file.name)}.mp3`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function uploadTrackFile(
  file: File,
  preferredTitle: string,
  deps: TrackUploadDependencies,
  options: TrackUploadOptions = {},
): Promise<TrackUploadResult> {
  const maxBytes = resolveMaxTrackUploadBytes(options.maxUploadMb);
  validateTrackFile(file, maxBytes);

  const title = preferredTitle.trim() || stripExtension(file.name).trim() || "Untitled track";
  const path = await buildDeterministicTrackPath(file);
  const publicUrl = deps.storage.getPublicUrl(path).data.publicUrl;

  const existing = await deps.findTrackByUrl(publicUrl);
  if (existing) {
    return { status: "existing", path, publicUrl, title };
  }

  const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS);
  const jitterMs = Math.max(0, options.jitterMs ?? 125);
  const sleep = options.sleep ?? wait;

  let lastError: TrackUploadError | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { error: uploadError } = await deps.storage.upload(path, file, {
      upsert: true,
      contentType: "audio/mpeg",
    });

    if (!uploadError) {
      const slash = path.lastIndexOf("/");
      const folder = slash > -1 ? path.slice(0, slash) : "";
      const fileName = slash > -1 ? path.slice(slash + 1) : path;
      const { data: listed, error: listError } = await deps.storage.list(folder, { limit: 1, search: fileName });
      if (listError) throw mapStorageError(listError);

      const exists = (listed || []).some((entry) => entry.name === fileName);
      if (!exists) {
        throw new TrackUploadError(
          "transient_network",
          "Upload could not be confirmed in storage. Please retry.",
          `missing object path=${path}`,
        );
      }

      try {
        await deps.insertTrack(title, publicUrl);
      } catch (dbError) {
        await deps.storage.remove([path]);
        throw new TrackUploadError(
          "unknown",
          "Upload succeeded but saving track details failed. The uploaded file was cleaned up.",
          formatAdminDetails(dbError),
          dbError,
        );
      }

      return { status: "uploaded", path, publicUrl, title };
    }

    const mapped = mapStorageError(uploadError);
    lastError = mapped;

    const canRetry = mapped.kind === "transient_network" && attempt < maxAttempts;
    if (!canRetry) {
      throw mapped;
    }

    const backoff = baseDelayMs * 2 ** (attempt - 1);
    const jitter = jitterMs > 0 ? Math.floor(Math.random() * (jitterMs + 1)) : 0;
    await sleep(backoff + jitter);
  }

  throw lastError ?? new TrackUploadError("unknown", "Upload failed unexpectedly.");
}