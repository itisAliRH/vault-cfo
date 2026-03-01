import type { TranscriptEntry } from "@/types/meeting";

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `[${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}]`;
}

/**
 * Export transcript as plain text with optional timestamps.
 */
export function exportAsText(
  entries: TranscriptEntry[],
  meetingTitle: string,
  includeTimestamps = true
): string {
  const lines = entries.map((e) => {
    const prefix = includeTimestamps && e.timestamp != null
      ? `${formatTimestamp(e.timestamp)} `
      : "";
    const speaker = e.role === "user" ? "You" : "Consultant";
    return `${prefix}${speaker}: ${e.text}`;
  });
  const header = `${meetingTitle}\n${"=".repeat(meetingTitle.length)}\n\n`;
  return header + lines.join("\n\n");
}

/**
 * Export transcript as JSON.
 */
export function exportAsJSON(entries: TranscriptEntry[]): string {
  return JSON.stringify(
    entries.map((e) => ({
      role: e.role,
      text: e.text,
      ...(e.timestamp != null && { timestamp: e.timestamp }),
    })),
    null,
    2
  );
}

/**
 * Trigger download of a blob as a file.
 */
export function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
