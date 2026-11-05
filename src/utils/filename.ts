export function generateVideoFilename(
  title: string,
  extension = "mp4",
): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const time = now.toTimeString().slice(0, 6).replace(/:/g, "_");
  const sanitized = title
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_");
  return `${date}_${time}_${sanitized}.${extension}`;
}
