import useStore from '../store/useStore';
import { calcProjectGPA, POLYU_GRADES, WES_GRADES, wesLabel, admissionHint } from '../utils/gpa';

const US_SCHOOLS = [
  { name: 'MIT', minWES: 3.8, program: 'Graduate Engineering' },
  { name: 'Stanford', minWES: 3.7, program: 'MS Computer Science' },
  { name: 'Carnegie Mellon', minWES: 3.5, program: 'MS Programs' },
  { name: 'UC Berkeley', minWES: 3.5, program: 'MEng' },
  { name: 'Cornell', minWES: 3.3, program: 'MS Programs' },
  { name: 'University of Michigan', minWES: 3.3, program: 'MS Programs' },
  { name: 'Georgia Tech', minWES: 3.0, program: 'MS Programs' },
  { name: 'Purdue University', minWES: 3.0, program: 'MS Programs' },
  { name: 'Arizona State', minWES: 2.75, program: 'MS Programs' },
  { name: 'Northeastern', minWES: 2.5, program: 'MS Programs' },
];

function ProjectWESCard({ project }) {
  const { gpa: polyuGPA, totalCredits } = calcProjectGPA(project.semesters, POLYU_GRADES);
  const { gpa: wesGPA } = calcProjectGPA(project.semesters, WES_GRADES);
  const hint = admissionHint(wesGPA);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ background: project.color }} />
        <h3 className="font-bold text-slate-800">{project.name}</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-400 mb-1">PolyU GPA</div>
          <div className="text-2xl font-bold tabular-nums" style={{ color: project.color }}>{polyuGPA.toFixed(2)}</div>
          <div className="text-xs text-slate-400">/ 4.30</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-xs text-blue-500 mb-1">WES GPA</div>
          <div className="text-2xl font-bold tabular-nums text-blue-700">{wesGPA.toFixed(2)}</div>
          <div className="text-xs text-blue-400">/ 4.00</div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <div className="text-xs text-slate-400 mb-1">Credits</div>
          <div className="text-2xl font-bold tabular-nums text-slate-700">{totalCredits}</div>
          <div className="text-xs text-slate-400">total</div>
        </div>
      </div>

      {/* Letter equivalent */}
      <div className="text-sm text-slate-600 mb-4">
        <span className="font-semibold">WES Equivalent: </span>{wesLabel(wesGPA)}
      </div>

      {/* School compatibility */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">School Compatibility</div>
        <div className="flex flex-col gap-1.5">
          {US_SCHOOLS.map(school => {
            const ok = wesGPA >= school.minWES;
            const diff = wesGPA - school.minWES;
            return (
              <div key={school.name} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${ok ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className={`text-base ${ok ? 'text-green-600' : 'text-red-400'}`}>{ok ? '✓' : '✗'}</span>
                <span className={`flex-1 font-medium ${ok ? 'text-green-800' : 'text-red-700'}`}>{school.name}</span>
                <span className={`text-xs ${ok ? 'text-green-600' : 'text-red-500'}`}>
                  {ok ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">≥ {school.minWES}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function WESView() {
  const { projects } = useStore();

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">WES Conversion</h1>
        <p className="text-slate-500 mt-1 text-sm">
          World Education Services (WES) evaluation for US Master's applications. WES caps A+ at 4.0 and converts PolyU grades to the US 4.0 scale.
        </p>
      </div>

      {/* WES Grade Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="text-sm font-semibold text-slate-700 mb-3">PolyU → WES Grade Mapping</div>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(POLYU_GRADES).map(([grade, pts]) => (
            <div key={grade} className="text-center bg-slate-50 rounded-lg p-2">
              <div className="font-bold text-slate-800">{grade}</div>
              <div className="text-xs text-slate-500">{pts.toFixed(1)}</div>
              <div className="text-xs font-semibold text-blue-600">→ {WES_GRADES[grade]?.toFixed(1)}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">* A+ is capped at 4.0 in WES evaluation. All other grades remain the same.</p>
      </div>

      {/* Per project */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map(p => (
          <ProjectWESCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
