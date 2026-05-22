import { useState, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import {
  calcProjectGPA,
  POLYU_GRADES,
  calcRequiredGPA,
  feasibilityTier,
  nearestGradeAbove,
  gradePlanSuggestions,
} from '../utils/gpa';

const SCALE_MAX = 4.3;

function NumberField({ label, value, onChange, step = 1, max, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-base font-semibold tabular-nums border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-red-400 bg-white"
      />
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export default function TargetView() {
  const { projects, activeProjectId } = useStore();
  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) || projects[0],
    [projects, activeProjectId]
  );

  // Pre-fill from active project on mount / project change
  const projectStats = useMemo(
    () => activeProject ? calcProjectGPA(activeProject.semesters, POLYU_GRADES) : { gpa: 0, totalCredits: 0 },
    [activeProject]
  );

  const [totalCredits, setTotalCredits] = useState('120');
  const [completedCredits, setCompletedCredits] = useState('');
  const [currentGPA, setCurrentGPA] = useState('');
  const [targetGPA, setTargetGPA] = useState('3.50');

  useEffect(() => {
    setCompletedCredits(projectStats.totalCredits ? String(projectStats.totalCredits) : '');
    setCurrentGPA(projectStats.gpa ? projectStats.gpa.toFixed(2) : '');
  }, [projectStats.totalCredits, projectStats.gpa]);

  // Parse numbers
  const nums = {
    total: parseFloat(totalCredits),
    done: parseFloat(completedCredits),
    cur: parseFloat(currentGPA),
    tgt: parseFloat(targetGPA),
  };
  const allFilled = Object.values(nums).every(v => !Number.isNaN(v));

  // Validation
  const errors = [];
  if (allFilled) {
    if (nums.cur > SCALE_MAX) errors.push(`Current GPA can’t exceed ${SCALE_MAX}.`);
    if (nums.tgt > SCALE_MAX) errors.push(`Target GPA can’t exceed ${SCALE_MAX}.`);
    if (nums.done > nums.total) errors.push('Completed credits exceed total credits.');
    if (nums.total <= 0) errors.push('Total credits must be greater than 0.');
  }

  // Compute
  const { required, remaining } = allFilled && !errors.length
    ? calcRequiredGPA({
        totalCredits: nums.total,
        completedCredits: nums.done,
        currentGPA: nums.cur,
        targetGPA: nums.tgt,
      })
    : { required: null, remaining: 0 };

  const tier = feasibilityTier(required);
  const letter = required !== null && required > 0 && required <= SCALE_MAX
    ? nearestGradeAbove(required)
    : null;
  const plans = gradePlanSuggestions(required, remaining);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Target GPA</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Tell us your graduation target and we’ll back-solve what your remaining credits need to average. Defaults pull from your active major.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Input card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Inputs</h2>
            {activeProject && (
              <span className="text-xs text-slate-400">
                Prefilled from <span className="font-semibold" style={{ color: activeProject.color }}>{activeProject.name}</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberField
              label="Total Credits"
              value={totalCredits}
              onChange={setTotalCredits}
              step={1}
              hint="Required for graduation"
            />
            <NumberField
              label="Completed Credits"
              value={completedCredits}
              onChange={setCompletedCredits}
              step={1}
              hint="What you’ve finished"
            />
            <NumberField
              label="Current GPA"
              value={currentGPA}
              onChange={setCurrentGPA}
              step={0.01}
              max={SCALE_MAX}
              hint={`On PolyU 4.3 scale`}
            />
            <NumberField
              label="Target GPA"
              value={targetGPA}
              onChange={setTargetGPA}
              step={0.01}
              max={SCALE_MAX}
              hint="Your graduation goal"
            />
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex flex-col gap-1">
              {errors.map((e, i) => (
                <div key={i} className="text-sm text-red-700">{e}</div>
              ))}
            </div>
          )}
        </div>

        {/* ── Result card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
          <h2 className="font-bold text-slate-800">Result</h2>

          {!allFilled || errors.length > 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-12">
              {errors.length > 0 ? 'Fix the inputs above to see results.' : 'Fill in all four fields to see your required GPA.'}
            </div>
          ) : (
            <>
              {/* Big required-GPA number */}
              <div className="bg-slate-50 rounded-xl p-5 text-center">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Required Average · Remaining {remaining} credits
                </div>
                <div
                  className="text-5xl font-bold tabular-nums my-1"
                  style={{ color: tier?.color || '#0f172a' }}
                >
                  {required > 4.3 ? '> 4.30' : required <= 0 ? 'Done' : required.toFixed(2)}
                </div>
                {letter && (
                  <div className="text-sm text-slate-500">
                    ≈ <span className="font-semibold text-slate-700">{letter}</span> ({POLYU_GRADES[letter].toFixed(1)})
                  </div>
                )}
              </div>

              {/* Feasibility badge */}
              {tier && (
                <div
                  className="px-4 py-3 rounded-xl font-bold"
                  style={{ background: `${tier.color}15`, color: tier.color }}
                >
                  {tier.label}
                </div>
              )}

              {/* Plans */}
              {plans.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Ways to Get There
                  </div>
                  <div className="flex flex-col gap-2">
                    {plans.map((p, i) => (
                      <div
                        key={i}
                        className="border border-slate-200 rounded-xl px-4 py-3 bg-slate-50/50 text-sm text-slate-700"
                      >
                        <span className="font-semibold text-slate-500 mr-2">#{i + 1}</span>
                        {p.desc}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Impossible / Achieved messages */}
              {required > 4.3 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  Even an A+ in every remaining course won’t get you there. Lower the target or finish more credits at higher grades first.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
