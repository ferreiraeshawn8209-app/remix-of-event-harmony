import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_MAX_TRACK_UPLOAD_MB,
  TrackUploadError,
  buildDeterministicTrackPath,
  mapStorageError,
  resolveMaxTrackUploadBytes,
  uploadTrackFile,
  validateFallbackTrackUrl,
  validateTrackFile,
} from "@/lib/trackUpload";

function makeFile(contents: string, name: string, type = "audio/mpeg") {
  return new File([contents], name, { type });
}

describe("track upload hardening", () => {
  it("accepts .mp3 files when MIME type is missing", () => {
    const file = makeFile("fake", "song.mp3", "");

    expect(() => validateTrackFile(file)).not.toThrow();
  });

  it("rejects invalid type when MIME does not match MP3/WAV", () => {
    const file = makeFile("fake", "song.mp3", "audio/ogg");

    expect(() => validateTrackFile(file)).toThrowError(TrackUploadError);
    expect(() => validateTrackFile(file)).toThrow("Please upload a valid MP3 or WAV file");
  });

  it("rejects oversized file", () => {
    const file = makeFile("123456", "song.mp3");

    expect(() => validateTrackFile(file, 5)).toThrow("Maximum allowed size is");
  });

  it("rejects empty file", () => {
    const file = makeFile("", "song.mp3");

    expect(() => validateTrackFile(file)).toThrow("empty");
  });

  it("maps permission and config-related storage failures", () => {
    expect(mapStorageError({ code: "403", message: "permission denied" })).toMatchObject({ kind: "permission_or_config" });
    expect(mapStorageError({ code: "unauthorized", message: "invalid signature" })).toMatchObject({ kind: "permission_or_config" });
  });

  it("uses default max upload setting when env is missing", () => {
    expect(resolveMaxTrackUploadBytes(0)).toBe(DEFAULT_MAX_TRACK_UPLOAD_MB * 1024 * 1024);
  });

  it("accepts valid direct MP3/WAV fallback URLs", () => {
    expect(validateFallbackTrackUrl("https://cdn.example/audio/mix.mp3")).toBe("https://cdn.example/audio/mix.mp3");
    expect(validateFallbackTrackUrl("https://cdn.example/audio/mix.wav")).toBe("https://cdn.example/audio/mix.wav");
  });

  it("rejects unsupported fallback URLs", () => {
    expect(() => validateFallbackTrackUrl("https://cdn.example/audio/mix.ogg")).toThrow(".mp3 or .wav");
  });

  it("retries transient upload error and succeeds", async () => {
    const file = makeFile("beat", "mix.mp3");
    const upload = vi
      .fn()
      .mockResolvedValueOnce({ error: { code: "ETIMEDOUT", message: "request timed out", status: 503 } })
      .mockResolvedValueOnce({ error: null });
    const list = vi.fn().mockImplementation(async (_path?: string, options?: { search?: string }) => ({
      data: [{ name: options?.search || "" }],
      error: null,
    }));
    const insertTrack = vi.fn().mockResolvedValue(undefined);

    const result = await uploadTrackFile(
      file,
      "Mix",
      {
        storage: {
          upload,
          getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example/tracks/${path}` } }),
          list,
          remove: vi.fn().mockResolvedValue({ error: null }),
        },
        findTrackByUrl: vi.fn().mockResolvedValue(null),
        insertTrack,
      },
      { maxAttempts: 3, baseDelayMs: 0, jitterMs: 0, sleep: async () => {} },
    );

    expect(upload).toHaveBeenCalledTimes(2);
    expect(insertTrack).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("uploaded");
  });

  it("does not retry permanent missing-bucket errors", async () => {
    const file = makeFile("beat", "mix.mp3");
    const upload = vi.fn().mockResolvedValue({ error: { code: "NoSuchBucket", message: "Bucket not found", status: 404 } });

    await expect(
      uploadTrackFile(
        file,
        "Mix",
        {
          storage: {
            upload,
            getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example/tracks/${path}` } }),
            list: vi.fn().mockResolvedValue({ data: [], error: null }),
            remove: vi.fn().mockResolvedValue({ error: null }),
          },
          findTrackByUrl: vi.fn().mockResolvedValue(null),
          insertTrack: vi.fn().mockResolvedValue(undefined),
        },
        { maxAttempts: 3, baseDelayMs: 0, jitterMs: 0, sleep: async () => {} },
      ),
    ).rejects.toMatchObject({ kind: "missing_bucket" });

    expect(upload).toHaveBeenCalledTimes(1);
  });

  it("fails when uploaded object cannot be confirmed", async () => {
    const file = makeFile("beat", "mix.mp3");

    await expect(
      uploadTrackFile(
        file,
        "Mix",
        {
          storage: {
            upload: vi.fn().mockResolvedValue({ error: null }),
            getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example/tracks/${path}` } }),
            list: vi.fn().mockResolvedValue({ data: [], error: null }),
            remove: vi.fn().mockResolvedValue({ error: null }),
          },
          findTrackByUrl: vi.fn().mockResolvedValue(null),
          insertTrack: vi.fn().mockResolvedValue(undefined),
        },
        { maxAttempts: 1, baseDelayMs: 0, jitterMs: 0, sleep: async () => {} },
      ),
    ).rejects.toMatchObject({ kind: "transient_network" });
  });

  it("exhausts retries for transient upload failures", async () => {
    const file = makeFile("beat", "mix.mp3");
    const upload = vi.fn().mockResolvedValue({ error: { code: "ETIMEDOUT", message: "timed out", status: 503 } });

    await expect(
      uploadTrackFile(
        file,
        "Mix",
        {
          storage: {
            upload,
            getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example/tracks/${path}` } }),
            list: vi.fn().mockResolvedValue({ data: [], error: null }),
            remove: vi.fn().mockResolvedValue({ error: null }),
          },
          findTrackByUrl: vi.fn().mockResolvedValue(null),
          insertTrack: vi.fn().mockResolvedValue(undefined),
        },
        { maxAttempts: 2, baseDelayMs: 0, jitterMs: 0, sleep: async () => {} },
      ),
    ).rejects.toMatchObject({ kind: "transient_network" });

    expect(upload).toHaveBeenCalledTimes(2);
  });

  it("is idempotent for duplicate uploads", async () => {
    const file = makeFile("beat", "mix.mp3");

    const upload = vi.fn().mockResolvedValue({ error: null });
    const list = vi.fn().mockImplementation(async (_path?: string, options?: { search?: string }) => ({
      data: [{ name: options?.search || "" }],
      error: null,
    }));

    const existing = { id: "track-1" };
    const result = await uploadTrackFile(
      file,
      "Mix",
      {
        storage: {
          upload,
          getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example/tracks/${path}` } }),
          list,
          remove: vi.fn().mockResolvedValue({ error: null }),
        },
        findTrackByUrl: vi.fn().mockResolvedValue(existing),
        insertTrack: vi.fn().mockResolvedValue(undefined),
      },
      { maxAttempts: 3, baseDelayMs: 0, jitterMs: 0, sleep: async () => {} },
    );

    expect(result.status).toBe("existing");
    expect(upload).not.toHaveBeenCalled();
  });

  it("uses deterministic path for same MP3 content", async () => {
    const fileA = makeFile("same-beat", "Night Set.mp3");
    const fileB = makeFile("same-beat", "Night Set.mp3");

    const [pathA, pathB] = await Promise.all([buildDeterministicTrackPath(fileA), buildDeterministicTrackPath(fileB)]);

    expect(pathA).toBe(pathB);
    expect(pathA.endsWith("-night-set.mp3")).toBe(true);
  });

  it("cleans up object when DB insert fails after upload", async () => {
    const file = makeFile("beat", "mix.mp3");
    const remove = vi.fn().mockResolvedValue({ error: null });

    await expect(
      uploadTrackFile(
        file,
        "Mix",
        {
          storage: {
            upload: vi.fn().mockResolvedValue({ error: null }),
            getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example/tracks/${path}` } }),
            list: vi.fn().mockImplementation(async (_path?: string, options?: { search?: string }) => ({
              data: [{ name: options?.search || "" }],
              error: null,
            })),
            remove,
          },
          findTrackByUrl: vi.fn().mockResolvedValue(null),
          insertTrack: vi.fn().mockRejectedValue(new Error("db is down")),
        },
        { maxAttempts: 1, sleep: async () => {} },
      ),
    ).rejects.toMatchObject({ message: expect.stringContaining("cleaned up") });

    expect(remove).toHaveBeenCalledTimes(1);
  });
});