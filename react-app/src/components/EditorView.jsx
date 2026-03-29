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
    <div className="flex-1 flex items-center justify-center text-slate-400">
      Select or create a major option from the sidebar.
    </div>
  );

  const activeSemester = project.semesters.find(s => s.id === project.activeSemesterId)
    ?? project.semesters[0];

  return (
    <div className="flex flex-1 min-h-0">
      {/* Main content */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: project.color }} />
            <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
          </div>
          {/* PDF Import button */}
          <button
            onClick={() => setShowPDF(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-700 hover:bg-red-50 transition-all"
          >
            <span>📄</span> Import PDF Transcript
          </button>
        </div>

        {/* Semester tabs */}
        <SemesterTabs project={project} />

        {/* Course table */}
        {activeSemester && (
          <CourseTable project={project} semester={activeSemester} />
        )}
      </div>

      {/* Right panel */}
      <div className="w-72 border-l border-slate-200 p-4 overflow-y-auto bg-slate-50/50">
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
