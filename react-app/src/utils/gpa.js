// PolyU 4.3 Grade Scale
export const POLYU_GRADES = {
  'A+': 4.3,
  'A':  4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B':  3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C':  2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D':  1.0,
  'F':  0.0,
};

// WES 4.0 conversion for US master applicants
// WES treats A+ same as A (4.0 cap), and maps other grades accordingly
export const WES_GRADES = {
  'A+': 4.0,
  'A':  4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B':  3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C':  2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D':  1.0,
  'F':  0.0,
};

export const GRADE_LIST = Object.keys(POLYU_GRADES);

export const GRADE_COLORS = {
  'A+': '#16a34a', 'A': '#22c55e', 'A-': '#4ade80',
  'B+': '#2563eb', 'B': '#3b82f6', 'B-': '#60a5fa',
  'C+': '#d97706', 'C': '#f59e0b', 'C-': '#fbbf24',
  'D+': '#dc2626', 'D': '#ef4444',
  'F':  '#7f1d1d',
};

// Calculate GPA for a list of courses using the given scale
export function calcGPA(courses, scale = POLYU_GRADES) {
  const valid = courses.filter(c => c.grade && scale[c.grade] !== undefined);
  if (!valid.length) return { gpa: 0, totalCredits: 0, totalPoints: 0 };

  let totalCredits = 0;
  let totalPoints = 0;
  for (const c of valid) {
    const cr = parseFloat(c.credit) || 0;
    totalCredits += cr;
    totalPoints += scale[c.grade] * cr;
  }
  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  return { gpa, totalCredits, totalPoints };
}

// Calculate cGPA across multiple semesters
export function calcProjectGPA(semesters, scale = POLYU_GRADES) {
  const allCourses = semesters.flatMap(s => s.courses);
  return calcGPA(allCourses, scale);
}

// Grade distribution for a list of courses
export function gradeDistribution(courses) {
  const dist = {};
  for (const g of GRADE_LIST) dist[g] = 0;
  for (const c of courses) {
    if (c.grade && dist[c.grade] !== undefined) dist[c.grade]++;
  }
  return dist;
}

// WES GPA label for US schools
export function wesLabel(gpa) {
  if (gpa >= 3.7) return 'A / Excellent';
  if (gpa >= 3.3) return 'A- / Very Good';
  if (gpa >= 3.0) return 'B+ / Good';
  if (gpa >= 2.7) return 'B / Above Average';
  if (gpa >= 2.0) return 'C / Average';
  if (gpa >= 1.0) return 'D / Below Average';
  return 'F / Failing';
}

// Admission likelihood hint based on WES GPA
export function admissionHint(gpa) {
  if (gpa >= 3.5) return { label: 'Strong Applicant', color: '#16a34a' };
  if (gpa >= 3.0) return { label: 'Competitive', color: '#2563eb' };
  if (gpa >= 2.7) return { label: 'Borderline', color: '#d97706' };
  return { label: 'Challenging', color: '#dc2626' };
}
