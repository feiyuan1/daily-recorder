export function generateVideoFilename({
  title,
  extension = "mp4",
  timestamp = Date.now(),
}: {
  title: string;
  extension?: string;
  timestamp?: number;
}): string {
  const now = new Date(timestamp);
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 5).replace(/:/g, "_");
  const sanitized = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_");
  return `${date}_${time}_${sanitized}.${extension}`;
}
