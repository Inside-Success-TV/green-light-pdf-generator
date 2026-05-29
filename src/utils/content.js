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
const GUEST_NAME_PLACEHOLDER_PATTERN =
  /\[\s*(?:guest|client)\s+name\s*\]|^(?:guest|client)\s+name$/i;

const cleanTemplateLine = (line) =>
  String(line || "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^\s*["“”]+|["“”]+\s*$/g, "")
    .replace(/^\[([^\]]+)\]$/, "$1")
    .trim();

const normalizeNameForCompare = (name) =>
  cleanTemplateLine(name)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const isInvalidClientName = (name) => {
  const cleanName = cleanTemplateLine(name);
  if (!cleanName || GUEST_NAME_PLACEHOLDER_PATTERN.test(cleanName)) return true;
  if (!/[A-Za-z]/.test(cleanName)) return true;
  return /^(?:iphone|phone|caller|guest|client|document|unknown|n\/a)$/i.test(
    cleanName,
  );
};

const getNameFromStorySummary = (line) => {
  const cleaned = cleanTemplateLine(line);
  const match = cleaned.match(/^(.+?)(?:['’]s)?\s+Story Summary$/i);
  if (!match) return "";

  const name = cleanTemplateLine(match[1]);
  return isInvalidClientName(name) ? "" : name;
};

const findFirstNonEmptyLine = (lines) =>
  lines.findIndex((line) => cleanTemplateLine(line) !== "");

const findNextLine = (lines, startIndex, predicate, maxLookahead = 12) => {
  const endIndex = Math.min(lines.length, startIndex + maxLookahead + 1);
  for (let index = startIndex + 1; index < endIndex; index += 1) {
    if (predicate(cleanTemplateLine(lines[index]), index)) return index;
  }
  return -1;
};

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
 * The AI sometimes places "Name's Story Summary" directly after X and skips
 * the standalone client name line. Repair only the opening Greenlight block.
 */
export const repairGreenlightLetterTopSection = (content) => {
  if (!content) return "";

  const normalized = String(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const firstLineIndex = findFirstNonEmptyLine(lines);
  if (firstLineIndex === -1) return normalized;

  const xLineIndex = findNextLine(
    lines,
    firstLineIndex,
    (line) => /^x$/i.test(line),
    6,
  );
  if (xLineIndex === -1) return normalized;

  const storySummaryIndex = findNextLine(
    lines,
    xLineIndex,
    (line) => Boolean(getNameFromStorySummary(line)),
    12,
  );
  if (storySummaryIndex === -1) return normalized;

  const existingNameIndex = findNextLine(
    lines,
    xLineIndex,
    (line) =>
      line !== "" &&
      !getNameFromStorySummary(line) &&
      !isInvalidClientName(line),
    storySummaryIndex - xLineIndex - 1,
  );

  const clientName =
    existingNameIndex !== -1
      ? cleanTemplateLine(lines[existingNameIndex])
      : getNameFromStorySummary(lines[storySummaryIndex]);

  if (isInvalidClientName(clientName)) return normalized;

  const showName = cleanTemplateLine(lines[firstLineIndex]);
  const isAllCapsName =
    clientName === clientName.toUpperCase() && /[A-Z]/.test(clientName);
  const storySummaryLine = isAllCapsName
    ? `${clientName}'S STORY SUMMARY`
    : `${clientName}'s Story Summary`;
  const repairedTopSection = [
    showName,
    "",
    "X",
    "",
    clientName,
    "",
    storySummaryLine,
  ];
  const remainder = lines.slice(storySummaryIndex + 1);

  return [...repairedTopSection, ...remainder].join("\n").trim();
};

export const getGreenlightLetterTopSectionError = (content) => {
  if (!content) return "Greenlight letter content is empty.";

  const repaired = repairGreenlightLetterTopSection(content);
  const lines = repaired
    .split(/\r?\n/)
    .map(cleanTemplateLine)
    .filter(Boolean);

  if (lines.some((line) => GUEST_NAME_PLACEHOLDER_PATTERN.test(line))) {
    return "Client name placeholder is still present. Please regenerate or fix the top section before creating the PDF.";
  }

  const xLineIndex = lines.findIndex((line) => /^x$/i.test(line));
  if (xLineIndex === -1) {
    return "Greenlight letter top section is missing the X separator.";
  }

  const clientName = lines[xLineIndex + 1] || "";
  const storySummary = lines[xLineIndex + 2] || "";
  const storySummaryName = getNameFromStorySummary(storySummary);

  if (isInvalidClientName(clientName)) {
    return "Greenlight letter is missing a real client name after the X separator.";
  }

  if (!storySummaryName) {
    return "Greenlight letter is missing the client's Story Summary heading after the client name.";
  }

  if (normalizeNameForCompare(clientName) !== normalizeNameForCompare(storySummaryName)) {
    return "Client name and Story Summary heading do not match.";
  }

  return "";
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
