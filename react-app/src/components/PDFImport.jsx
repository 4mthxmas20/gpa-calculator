import { useState, useRef, useCallback } from 'react';
import { extractTextFromPDF, parseCourses } from '../utils/pdfParser';
import { GRADE_LIST, POLYU_GRADES, GRADE_COLORS } from '../utils/gpa';
import useStore from '../store/useStore';
import { v4 as uuid } from 'uuid';

const STEPS = { idle: 0, parsing: 1, review: 2, done: 3 };

export default function PDFImport({ project, semesterId, onClose }) {
  const [step, setStep] = useState(STEPS.idle);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const fileRef = useRef();

  // ── File handling ─────────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    setError('');
    setStep(STEPS.parsing);
    try {
      const buffer = await file.arrayBuffer();
      const lines = await extractTextFromPDF(buffer);
      const parsed = parseCourses(lines);
      if (!parsed.length) {
        setError('No courses detected. The PDF may be scanned (image-based) or in an unsupported format.');
        setStep(STEPS.idle);
        return;
      }
      setCourses(parsed.map(c => ({ ...c, id: uuid() })));
      setSelected(new Set(parsed.map((_, i) => i)));
      setStep(STEPS.review);
    } catch (e) {
      setError(`Failed to parse PDF: ${e.message}`);
      setStep(STEPS.idle);
    }
  }, []);

  const onFileChange = (e) => processFile(e.target.files[0]);
  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  // ── Course editing ────────────────────────────────────────────────────────
  const updateField = (idx, field, value) =>
    setCourses(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  const toggleSelect = (idx) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  // ── Batch import directly via Zustand store ───────────────────────────────
  const handleImport = () => {
    const toImport = courses
      .filter((_, i) => selected.has(i))
      .map(c => ({
        id: uuid(),
        name: c.name.trim() || 'Unknown Course',
        credit: parseFloat(c.credit) || 3,
        grade: c.grade,
      }));

    // Access store state directly (no hook needed outside component render)
    useStore.setState(state => ({
      projects: state.projects.map(p =>
        p.id !== project.id ? p : {
          ...p,
          semesters: p.semesters.map(s =>
            s.id !== semesterId ? s : {
              ...s,
              courses: [...s.courses, ...toImport],
            }
          ),
        }
      ),
    }));

    setStep(STEPS.done);
    setTimeout(onClose, 1400);
  };

  const semName = project.semesters.find(s => s.id === semesterId)?.name ?? '';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Import from PDF Transcript</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically reads course name, credits &amp; grade → <b>{semName}</b>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100">×</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Step 0: Drop zone ── */}
          {step === STEPS.idle && (
            <div className="flex flex-col gap-4">
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                  dragging
                    ? 'border-red-500 bg-red-50 scale-[1.01]'
                    : 'border-slate-300 hover:border-red-400 hover:bg-slate-50'
                }`}
              >
                <div className="text-5xl mb-3 select-none">📄</div>
                <div className="font-semibold text-slate-700 text-base">Drop your transcript PDF here</div>
                <div className="text-sm text-slate-400 mt-1">or click to browse files</div>
                <div className="text-xs text-slate-300 mt-4">Works with PolyU e-transcripts and other text-based PDFs</div>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
                <b>💡 Tips:</b> Works best with <b>text-based PDFs</b> — official e-transcripts you can select &amp; copy text from.
                Scanned image PDFs won't work. After parsing you can review and edit each course before importing.
              </div>
            </div>
          )}

          {/* ── Step 1: Parsing ── */}
          {step === STEPS.parsing && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-14 h-14 border-4 border-slate-200 border-t-red-700 rounded-full animate-spin" />
              <div className="text-slate-700 font-semibold text-lg">Reading PDF…</div>
              <div className="text-slate-400 text-sm">Extracting and parsing course data</div>
            </div>
          )}

          {/* ── Step 2: Review ── */}
          {step === STEPS.review && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-700">
                  Found <span className="text-red-700 font-bold">{courses.length}</span> courses — select which to import
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelected(new Set(courses.map((_, i) => i)))}
                    className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium">All</button>
                  <button onClick={() => setSelected(new Set())}
                    className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-medium">None</button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-200">
                      <th className="w-10 px-3 py-2.5"></th>
                      <th className="text-left px-3 py-2.5 font-semibold">Course Name</th>
                      <th className="text-center px-3 py-2.5 font-semibold w-20">Credits</th>
                      <th className="text-center px-3 py-2.5 font-semibold w-28">Grade</th>
                      <th className="text-center px-3 py-2.5 font-semibold w-16">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.map((c, idx) => {
                      const pts = (POLYU_GRADES[c.grade] || 0) * (parseFloat(c.credit) || 0);
                      const isSelected = selected.has(idx);
                      return (
                        <tr key={c.id}
                          className={`transition-colors ${isSelected ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50 opacity-40'}`}
                        >
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={isSelected}
                              onChange={() => toggleSelect(idx)}
                              className="w-4 h-4 cursor-pointer rounded accent-red-700" />
                          </td>
                          <td className="px-3 py-2">
                            <input type="text" value={c.name}
                              onChange={e => updateField(idx, 'name', e.target.value)}
                              className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-blue-400 bg-transparent" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input type="number" value={c.credit}
                              min={0.5} max={12} step={0.5}
                              onChange={e => updateField(idx, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-14 text-center border border-slate-200 rounded-lg px-1 py-1 text-sm focus:outline-none focus:border-blue-400" />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <select value={c.grade}
                              onChange={e => updateField(idx, 'grade', e.target.value)}
                              className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-400 font-semibold"
                              style={{ color: GRADE_COLORS[c.grade] }}>
                              {GRADE_LIST.map(g => (
                                <option key={g} value={g} style={{ color: GRADE_COLORS[g], fontWeight: 600 }}>{g}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center text-slate-500 tabular-nums text-xs font-semibold">
                            {pts.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-400">
                ✏️ You can edit any field before importing. Deselect rows you don't want.
              </p>
            </div>
          )}

          {/* ── Step 3: Done ── */}
          {step === STEPS.done && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="text-6xl animate-bounce">✅</div>
              <div className="font-bold text-slate-800 text-xl">Imported Successfully!</div>
              <div className="text-slate-500 text-sm">{selected.size} courses added to <b>{semName}</b></div>
            </div>
          )}
        </div>

        {/* Footer (review step only) */}
        {step === STEPS.review && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-shrink-0 bg-slate-50/50 rounded-b-2xl">
            <div className="text-sm text-slate-500">
              <b className="text-slate-700">{selected.size}</b> / {courses.length} courses selected
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setStep(STEPS.idle); setCourses([]); setSelected(new Set()); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors font-medium"
              >← Re-upload</button>
              <button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="px-5 py-2 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{ background: '#a6192e' }}
              >
                Import {selected.size} Courses →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
