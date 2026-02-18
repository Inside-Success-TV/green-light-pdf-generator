/**
 * Robust transcript cleaner.
 * Removes timestamps in various formats:
 * - [00:00:00] or [00:00]
 * - (00:00:00) or (00:00)
 * - 00:00:00 - Speaker
 * - 00:00 Speaker
 * - Speaker: 
 */
export const cleanTranscript = (text) => {
  if (!text) return "";
  
  console.log("Cleaning transcript...", { initialLength: text.length });

  let cleaned = text
    // Remove [00:00:00] or [0:00:00] format
    .replace(/\[\d{1,2}:\d{2}(:\d{2})?\]/g, '')
    // Remove (00:00:00) format
    .replace(/\(\d{1,2}:\d{2}(:\d{2})?\)/g, '')
    // Remove 00:00:00 - format (timestamp with dash)
    .replace(/\d{1,2}:\d{2}(:\d{2})?\s*-\s*/g, '')
    // Remove standalone timestamps at start of lines like 00:00:00
    .replace(/^\s*\d{1,2}:\d{2}(:\d{2})?\s*/gm, '')
    
    // Remove Speaker identifiers if valid (e.g. "Speaker 1:", "John:")
    // Be careful not to remove normal text, so only remove if start of line
    // .replace(/^[A-Za-z\s]+:\s*/gm, '') // Optional: remove speaker names if desired? No, usually we want speaker names for context.
    
    // Remove excessive whitespace
    // .replace(/\s+/g, ' ') // Don't flatten all whitespace, keep line breaks
    .replace(/[ \t]+/g, ' ') // Flatten horizontal whitespace only
    
    // Normalize line breaks (max 2 newlines)
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    
    // Remove common filler words only if isolated? No, n8n regex was:
    // .replace(/\b(um|uh|like|you know|sort of|kind of)\b/gi, '')
    // Let's stick to timestamp removal for now to be safe.
    
    .trim();

  console.log("Transcript cleaned.", { finalLength: cleaned.length });
  return cleaned;
};
