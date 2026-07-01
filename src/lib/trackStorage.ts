export const TRACK_BUCKET_CANDIDATES = ["tracks", "track"] as const;

export interface ParsedTrackStorageUrl {
  bucket: string;
  path: string;
}

export function parseTrackStoragePublicUrl(fileUrl: string): ParsedTrackStorageUrl | null {
  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return null;
  }

  const marker = "/storage/v1/object/public/";
  const index = parsed.pathname.indexOf(marker);
  if (index === -1) return null;

  const objectPath = parsed.pathname.slice(index + marker.length).replace(/^\/+/, "");
  const parts = objectPath.split("/");
  if (parts.length < 2) return null;

  const [bucket, ...fileParts] = parts;
  const path = fileParts.join("/");
  if (!bucket || !path) return null;

  return {
    bucket: decodeURIComponent(bucket),
    path: decodeURIComponent(path),
  };
}
