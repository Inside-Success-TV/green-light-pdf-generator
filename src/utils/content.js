/**
 * Utility to strip HTML tags and convert structure into clean text/markdown.
 */
export const stripHtml = (html) => {
  if (!html) return "";
  
  // 1. First, preserve line breaks from block elements
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h1>/gi, "\n\n")
    .replace(/<\/h2>/gi, "\n\n")
    .replace(/<\/h3>/gi, "\n\n")
    .replace(/<\/h4>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n");

  // 2. Remove <head> and its contents completely (including <style>)
  text = text.replace(/<head[\s\S]*?<\/head>/gi, "");
  
  // 3. Remove all other HTML tags
  text = text.replace(/<[^>]*>/g, "");

  // 4. Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // 5. Clean up excessive whitespace and newlines
  return text
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const OUTCOME_DISCLAIMER_PATTERN =
  /We do not guarantee exact outcomes\s*[\u002d\u2013\u2014]\s*results may vary!?/i;
const PDF_DISCLAIMER_GUARD = "\u2060".repeat(80);

/**
 * Remove bold formatting from the standard outcome disclaimer only.
 * Other markdown/HTML bold content is intentionally preserved.
 */
export const unboldOutcomeDisclaimer = (content) => {
  if (!content) return "";

  return content
    .replace(
      new RegExp(
        String.raw`(?:\*\*|__)\s*(${OUTCOME_DISCLAIMER_PATTERN.source})\s*(?:\*\*|__)`,
        "gi",
      ),
      "$1",
    )
    .replace(
      new RegExp(
        String.raw`<\s*(?:strong|b)\s*>\s*(${OUTCOME_DISCLAIMER_PATTERN.source})\s*<\s*\/\s*(?:strong|b)\s*>`,
        "gi",
      ),
      "$1",
    );
};

/**
 * The PDF webhook applies its own formatting after receiving plain text.
 * Add invisible word-joiners only in the PDF payload so the disclaimer does
 * not get detected as a short heading while keeping the visible output intact.
 */
export const preparePdfContent = (content) => {
  const normalizedContent = unboldOutcomeDisclaimer(content);

  return normalizedContent.replace(
    new RegExp(`(${OUTCOME_DISCLAIMER_PATTERN.source})(?!${PDF_DISCLAIMER_GUARD})`, "gi"),
    `$1${PDF_DISCLAIMER_GUARD}`,
  );
};
