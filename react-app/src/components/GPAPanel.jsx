import { calcProjectGPA, POLYU_GRADES, WES_GRADES, gradeDistribution, GRADE_COLORS, admissionHint } from '../utils/gpa';

function Ring({ value, max = 4.3, color, size = 100 }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = circ * pct;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
      <circle
        cx="50" cy="50" r={r}
        fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.5s ease' }}
      />
    </svg>
  );
}

export default function GPAPanel({ project }) {
  const allCourses = project.semesters.flatMap(s => s.courses);
  const { gpa: polyuGPA, totalCredits } = calcProjectGPA(project.semesters, POLYU_GRADES);
  const { gpa: wesGPA } = calcProjectGPA(project.semesters, WES_GRADES);
  const hint = admissionHint(wesGPA);
  const dist = gradeDistribution(allCourses);

  const gradeGroups = [
    { label: 'A Range', grades: ['A+', 'A', 'A-'], color: '#16a34a' },
    { label: 'B Range', grades: ['B+', 'B', 'B-'], color: '#2563eb' },
    { label: 'C Range', grades: ['C+', 'C', 'C-'], color: '#d97706' },
    { label: 'D / F', grades: ['D+', 'D', 'F'], color: '#dc2626' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: two GPA cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* PolyU GPA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">cGPA (PolyU 4.3)</div>
          <div className="relative">
            <Ring value={polyuGPA} max={4.3} color={project.color} size={110} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums" style={{ color: project.color }}>{polyuGPA.toFixed(2)}</span>
              <span className="text-xs text-slate-400">/ 4.30</span>
            </div>
          </div>
          <div className="text-xs text-slate-500">{totalCredits} credits total</div>
        </div>

        {/* WES GPA */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center gap-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">WES GPA (4.0)</div>
          <div className="relative">
            <Ring value={wesGPA} max={4.0} color="#1d4ed8" size={110} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-blue-700">{wesGPA.toFixed(2)}</span>
              <span className="text-xs text-slate-400">/ 4.00</span>
            </div>
          </div>
          <div
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: hint.color + '20', color: hint.color }}
          >{hint.label}</div>
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Grade Distribution</div>
        <div className="flex flex-col gap-2">
          {gradeGroups.map(group => {
            const count = group.grades.reduce((sum, g) => sum + (dist[g] || 0), 0);
            const total = allCourses.length;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={group.label} className="flex items-center gap-2">
                <div className="w-16 text-xs text-slate-500 text-right">{group.label}</div>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: group.color }}
                  />
                </div>
                <div className="w-10 text-xs font-semibold text-slate-600 text-right tabular-nums">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
