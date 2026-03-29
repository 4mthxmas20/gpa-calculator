/**
 * Lazy-load pdfjs-dist only when needed (keeps main bundle small)
 */
async function getPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  return pdfjsLib;
}

/**
 * Extract all text lines from a PDF ArrayBuffer
 */
export async function extractTextFromPDF(arrayBuffer) {
  const pdfjsLib = await getPdfJs();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allLines = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const lines = groupByLines(content.items);
    allLines.push(...lines);
  }
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
        .map(i => i.str)
        .join(' ')
        .trim()
    )
    .filter(line => line.length > 0);
}

// ─── Parsing constants ────────────────────────────────────────────────────────
const VALID_GRADES = new Set(['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F']);
const GRADE_RE     = /\b(A\+|A-|A|B\+|B-|B|C\+|C-|C|D\+|D|F)\b/;
const CREDIT_RE    = /\b(\d(?:\.\d)?)\b/;
const CODE_RE      = /\b([A-Z]{2,5}\d{4}[A-Z]?)\b/;

/**
 * Parse extracted text lines into course candidates.
 * Returns: [{ name, credit, grade, confidence, raw }]
 */
export function parseCourses(lines) {
  const results = [];

  for (const line of lines) {
    const gradeMatch  = line.match(GRADE_RE);
    const creditMatch = line.match(CREDIT_RE);
    if (!gradeMatch || !creditMatch) continue;

    const grade  = gradeMatch[1];
    const credit = parseFloat(creditMatch[1]);
    if (!VALID_GRADES.has(grade)) continue;
    if (credit < 0.5 || credit > 12) continue;

    const codeMatch = line.match(CODE_RE);

    // Strip code, grade, credit tokens to get the course name
    let name = line
      .replace(CODE_RE, '')
      .replace(new RegExp(`\\b${escapeRe(grade)}\\b`), '')
      .replace(CREDIT_RE, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9)]+$/g, '')
      .trim();

    if (codeMatch) name = `${codeMatch[1]} ${name}`.trim();
    if (!name)     name = codeMatch ? codeMatch[1] : 'Unknown Course';

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
