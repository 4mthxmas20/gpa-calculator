import useStore from '../store/useStore';
import { calcProjectGPA, POLYU_GRADES, WES_GRADES, admissionHint } from '../utils/gpa';

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-sm font-bold tabular-nums w-10 text-right" style={{ color }}>{value.toFixed(2)}</span>
    </div>
  );
}

function RankBadge({ rank }) {
  const labels = ['🥇', '🥈', '🥉'];
  return rank < 3 ? <span className="text-lg">{labels[rank]}</span> : <span className="text-sm font-bold text-slate-400">#{rank + 1}</span>;
}

export default function CompareView() {
  const { projects, setActiveProject, setView } = useStore();

  const data = projects.map(p => {
    const allCourses = p.semesters.flatMap(s => s.courses);
    const { gpa: polyuGPA, totalCredits } = calcProjectGPA(p.semesters, POLYU_GRADES);
    const { gpa: wesGPA } = calcProjectGPA(p.semesters, WES_GRADES);
    const hint = admissionHint(wesGPA);
    const semCount = p.semesters.length;
    const courseCount = allCourses.length;
    return { project: p, polyuGPA, wesGPA, totalCredits, semCount, courseCount, hint };
  });

  const sorted = [...data].sort((a, b) => b.polyuGPA - a.polyuGPA);

  const maxPolyuGPA = Math.max(...data.map(d => d.polyuGPA), 0.01);
  const maxWesGPA = Math.max(...data.map(d => d.wesGPA), 0.01);
  const maxCredits = Math.max(...data.map(d => d.totalCredits), 1);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Compare Major Options</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Side-by-side comparison to help decide between major plans.
        </p>
      </div>

      {data.length < 2 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-700 text-sm">
          Add at least 2 major options in the sidebar to compare.
        </div>
      )}

      {/* Ranked summary cards */}
      <div className="flex flex-col gap-3">
        {sorted.map((d, rank) => (
          <div
            key={d.project.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => { setActiveProject(d.project.id); setView('editor'); }}
          >
            <div className="flex items-center gap-3">
              <RankBadge rank={rank} />
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.project.color }} />
              <h3 className="font-bold text-slate-800 flex-1">{d.project.name}</h3>
              <div
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: d.hint.color + '20', color: d.hint.color }}
              >
                {d.hint.label}
              </div>
              <span className="text-xs text-slate-400 hover:text-blue-600">Edit →</span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-xs text-slate-400 mb-1 font-medium">PolyU cGPA (4.3)</div>
                <MiniBar value={d.polyuGPA} max={4.3} color={d.project.color} />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1 font-medium">WES GPA (4.0)</div>
                <MiniBar value={d.wesGPA} max={4.0} color="#1d4ed8" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1 font-medium">Credits Completed</div>
                <MiniBar value={d.totalCredits} max={maxCredits} color="#6b7280" />
              </div>
            </div>

            <div className="flex gap-6 text-sm text-slate-500">
              <span><b className="text-slate-700">{d.semCount}</b> semesters</span>
              <span><b className="text-slate-700">{d.courseCount}</b> courses</span>
              <span><b className="text-slate-700">{d.totalCredits}</b> credits</span>
            </div>
          </div>
        ))}
      </div>

      {/* GPA comparison table */}
      {data.length >= 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <div className="text-sm font-semibold text-slate-700">Detailed Comparison</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="text-left px-5 py-3 font-semibold">Metric</th>
                  {data.map(d => (
                    <th key={d.project.id} className="text-center px-4 py-3 font-semibold">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.project.color }} />
                        {d.project.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { label: 'PolyU cGPA', key: 'polyuGPA', fmt: v => v.toFixed(3), bold: true },
                  { label: 'WES GPA', key: 'wesGPA', fmt: v => v.toFixed(3), bold: true },
                  { label: 'Admission Outlook', key: 'hint', fmt: v => v.label },
                  { label: 'Total Credits', key: 'totalCredits', fmt: v => v },
                  { label: 'Semesters', key: 'semCount', fmt: v => v },
                  { label: 'Courses', key: 'courseCount', fmt: v => v },
                ].map(row => {
                  // Find best value for numeric rows
                  const vals = data.map(d => row.key === 'hint' ? null : d[row.key]);
                  const maxVal = vals[0] !== null ? Math.max(...vals) : null;

                  return (
                    <tr key={row.label} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500 font-medium">{row.label}</td>
                      {data.map(d => {
                        const val = row.key === 'hint' ? d.hint : d[row.key];
                        const isBest = maxVal !== null && val === maxVal;
                        return (
                          <td key={d.project.id} className="px-4 py-3 text-center">
                            {row.key === 'hint' ? (
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: val.color + '20', color: val.color }}
                              >{val.label}</span>
                            ) : (
                              <span className={`tabular-nums ${row.bold ? 'font-bold text-base' : 'font-medium'} ${isBest ? 'text-green-600' : 'text-slate-700'}`}>
                                {row.fmt(val)}
                                {isBest && row.bold && <span className="text-xs ml-1">★</span>}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
