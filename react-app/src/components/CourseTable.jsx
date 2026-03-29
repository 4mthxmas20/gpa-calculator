import useStore from '../store/useStore';
import { GRADE_LIST, POLYU_GRADES, GRADE_COLORS, calcGPA } from '../utils/gpa';

function GradeSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-400 bg-white"
      style={{ color: GRADE_COLORS[value] || '#1e293b', fontWeight: 600 }}
    >
      {GRADE_LIST.map(g => (
        <option key={g} value={g} style={{ color: GRADE_COLORS[g], fontWeight: 600 }}>
          {g} ({POLYU_GRADES[g].toFixed(1)})
        </option>
      ))}
    </select>
  );
}

export default function CourseTable({ project, semester }) {
  const { addCourse, updateCourse, deleteCourse } = useStore();
  const courses = semester.courses;
  const { gpa, totalCredits } = calcGPA(courses);

  return (
    <div className="flex flex-col gap-3">
      {/* Semester GPA summary */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5">
        <div className="text-sm text-slate-500">
          Semester GPA &nbsp;·&nbsp; <span className="font-semibold text-slate-700">{courses.length} courses</span> &nbsp;·&nbsp; <span className="font-semibold text-slate-700">{totalCredits} credits</span>
        </div>
        <div className="text-xl font-bold tabular-nums" style={{ color: project.color }}>
          {gpa.toFixed(2)}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-semibold">Course Name</th>
              <th className="text-center px-3 py-3 font-semibold w-24">Credits</th>
              <th className="text-center px-3 py-3 font-semibold w-40">Grade</th>
              <th className="text-center px-3 py-3 font-semibold w-24">Points</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-8 text-sm">
                  No courses yet. Click "+ Add Course" to get started.
                </td>
              </tr>
            )}
            {courses.map((course, idx) => {
              const points = (POLYU_GRADES[course.grade] || 0) * (parseFloat(course.credit) || 0);
              return (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={course.name}
                      placeholder={`Course ${idx + 1}`}
                      onChange={e => updateCourse(project.id, semester.id, course.id, 'name', e.target.value)}
                      className="w-full bg-transparent border-0 focus:outline-none focus:bg-white focus:border focus:border-blue-300 focus:rounded-lg px-2 py-1 text-slate-700 placeholder:text-slate-300"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="number"
                      value={course.credit}
                      min={0}
                      max={12}
                      step={0.5}
                      onChange={e => updateCourse(project.id, semester.id, course.id, 'credit', parseFloat(e.target.value) || 0)}
                      className="w-16 text-center border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-400"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <GradeSelect
                      value={course.grade}
                      onChange={val => updateCourse(project.id, semester.id, course.id, 'grade', val)}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums font-semibold text-slate-600">
                    {points.toFixed(2)}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <button
                      onClick={() => deleteCourse(project.id, semester.id, course.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none"
                    >×</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {courses.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td className="px-4 py-2.5 font-semibold text-slate-600">Total</td>
                <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{totalCredits}</td>
                <td className="px-3 py-2.5 text-center font-bold text-base" style={{ color: project.color }}>
                  GPA {gpa.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-center font-semibold text-slate-600 tabular-nums">
                  {courses.reduce((sum, c) => sum + (POLYU_GRADES[c.grade] || 0) * (parseFloat(c.credit) || 0), 0).toFixed(2)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <button
        onClick={() => addCourse(project.id, semester.id)}
        className="mt-1 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm hover:border-slate-400 hover:text-slate-600 transition-colors font-medium"
      >
        + Add Course
      </button>
    </div>
  );
}
