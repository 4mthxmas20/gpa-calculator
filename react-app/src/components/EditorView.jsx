import { useState } from 'react';
import useStore from '../store/useStore';
import SemesterTabs from './SemesterTabs';
import CourseTable from './CourseTable';
import GPAPanel from './GPAPanel';
import PDFImport from './PDFImport';

export default function EditorView() {
  const { projects, activeProjectId } = useStore();
  const project = projects.find(p => p.id === activeProjectId);
  const [showPDF, setShowPDF] = useState(false);

  if (!project) return (
    <div className="flex-1 flex items-center justify-center text-slate-400 p-8 text-center">
      Select or create a major option from the menu.
    </div>
  );

  const activeSemester = project.semesters.find(s => s.id === project.activeSemesterId)
    ?? project.semesters[0];

  return (
    <div className="flex flex-col md:flex-row flex-1 min-h-0">

      {/* ── Main content ── */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col gap-4 md:gap-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: project.color }} />
            <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">{project.name}</h1>
          </div>
          <button
            onClick={() => setShowPDF(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-semibold rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-700 hover:bg-red-50 transition-all"
          >
            <span>📄</span>
            <span className="hidden sm:inline">Import PDF Transcript</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>

        {/* Semester tabs */}
        <SemesterTabs project={project} />

        {/* Course table */}
        {activeSemester && (
          <CourseTable project={project} semester={activeSemester} />
        )}

        {/* GPA Panel — mobile only (shows below table) */}
        <div className="md:hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Summary</div>
          <GPAPanel project={project} />
        </div>
      </div>

      {/* ── Right panel — desktop only ── */}
      <div className="hidden md:flex w-72 border-l border-slate-200 p-4 overflow-y-auto bg-slate-50/50 flex-col">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Summary</div>
        <GPAPanel project={project} />
      </div>

      {/* PDF Import Modal */}
      {showPDF && activeSemester && (
        <PDFImport
          project={project}
          semesterId={activeSemester.id}
          onClose={() => setShowPDF(false)}
        />
      )}
    </div>
  );
}
