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
