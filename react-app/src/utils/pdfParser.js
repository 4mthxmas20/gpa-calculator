import * as pdfjsLib from 'pdfjs-dist';
// Import worker as a URL so Vite bundles it locally (no CDN dependency)
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

/**
 * Extract all text lines from a PDF ArrayBuffer
 */
export async function extractTextFromPDF(arrayBuffer) {
  // pdfjs-dist 5 expects binary data as Uint8Array in the browser.
  const data = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data }).promise;
  } catch {
    // Some mobile browsers are less reliable with the worker path; retry without it.
    pdf = await pdfjsLib.getDocument({ data, disableWorker: true }).promise;
  }
  const allLines = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    allLines.push(...groupByLines(content.items));
    page.cleanup();
  }
  pdf.destroy();
  return allLines;
}

/** Group text items into lines by y-coordinate proximity */
function groupByLines(items) {
  if (!items.length) return [];
  const tolerance = 3;
  const lineMap = new Map();
  for (const item of items) {
    const y = Math.round(item.transform[5] / tolerance) * tolerance;
    if (!lineMap.has(y)) lineMap.set(y, []);
    lineMap.get(y).push(item);
  }
  return [...lineMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, items]) =>
      items
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map(i => normalizeExtractedText(i.str))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(line => line.length > 0);
}

// ─── Parsing constants ────────────────────────────────────────────────────────
const VALID_GRADES = new Set(['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']);
const CREDIT_RE    = /\b(\d(?:\.\d)?)\b/;
const CODE_RE      = /\b([A-Z]{2,5}\d{4}[A-Z]?)\b/;

/**
 * Parse extracted lines into course candidates.
 * Returns: [{ name, credit, grade, confidence, raw }]
 */
export function parseCourses(lines) {
  const results = [];

  for (const rawLine of lines) {
    const line = normalizeExtractedText(rawLine);
    const creditMatch = line.match(CREDIT_RE);
    if (!creditMatch) continue;

    const grade = extractGrade(line, creditMatch.index + creditMatch[0].length);
    if (!grade) continue;

    const credit = parseFloat(creditMatch[1]);
    if (!VALID_GRADES.has(grade)) continue;
    if (credit < 0.5 || credit > 12) continue;

    const codeMatch = line.match(CODE_RE);

    let name = cleanCourseName(line)
      .replace(CODE_RE, '')
      .replace(buildGradeRemovalRe(grade), ' ')
      .replace(CREDIT_RE, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)]+$/g, '')
      .trim();

    if (codeMatch) {
      name = `${codeMatch[1]} ${name}`.trim();
    } else if (!name) {
      name = 'Unknown Course';
    }

    results.push({ name, credit, grade, confidence: codeMatch ? 'high' : 'medium', raw: line });
  }

  // Deduplicate
  const seen = new Set();
  return results.filter(r => {
    const key = `${r.name}|${r.credit}|${r.grade}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractGrade(text, startIndex = 0) {
  const preferredText = text.slice(startIndex);
  const gradeFromTail = extractGradeFromTokens(preferredText);
  if (gradeFromTail) return gradeFromTail;
  return extractGradeFromTokens(text);
}

function extractGradeFromTokens(text) {
  const tokens = text
    .replace(/([+-])/g, ' $1 ')
    .split(/\s+/)
    .map(token => token.replace(/^[^A-Z0-9+-]+|[^A-Z0-9+-]+$/gi, ''))
    .filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i].toUpperCase();
    const next = tokens[i + 1]?.toUpperCase();

    if (/^[ABCD]$/.test(current) && (next === '+' || next === '-')) {
      return `${current}${next}`;
    }

    if (current === 'F') {
      return current;
    }

    if (VALID_GRADES.has(current)) {
      return current;
    }
  }

  return null;
}

function buildGradeRemovalRe(grade) {
  const letter = grade[0];
  const sign = grade[1];

  if (!sign) {
    return new RegExp(`(^|[^A-Z0-9])${escapeRe(letter)}(?=$|[^A-Z0-9])`, 'i');
  }

  return new RegExp(`(^|[^A-Z0-9])${escapeRe(letter)}\\s*${escapeRe(sign)}(?=$|[^A-Z0-9])`, 'i');
}

function normalizeExtractedText(text = '') {
  return text
    .normalize('NFKC')
    .replace(/\uE088/g, '-')
    .replace(/\uE09D/g, '+')
    .split('')
    .filter(char => {
      const code = char.charCodeAt(0);
      return !(
        code <= 31 ||
        (code >= 127 && code <= 159) ||
        (code >= 8203 && code <= 8205) ||
        (code >= 57344 && code <= 63743) ||
        code === 65279 ||
        code === 65533
      );
    })
    .join('')
    .replace(/[−–—]/g, '-')
    .replace(/(^|[^A-Z0-9])([A-DF])\s*([+-])(?=$|[^A-Z0-9])/gi, '$1$2$3')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanCourseName(text) {
  return normalizeExtractedText(text)
    .replace(/[|¦•·]/g, ' ')
    .replace(/\s+/g, ' ');
}
