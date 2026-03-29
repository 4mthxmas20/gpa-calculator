import { useState } from 'react';
import useStore from '../store/useStore';

export default function SemesterTabs({ project }) {
  const { addSemester, deleteSemester, renameSemester, setActiveSemester } = useStore();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    const name = newName.trim() || `Semester ${project.semesters.length + 1}`;
    addSemester(project.id, name);
    setNewName('');
    setAdding(false);
  };

  const handleRename = (semId) => {
    if (editName.trim()) renameSemester(project.id, semId, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {project.semesters.map(sem => (
        <div key={sem.id} className="relative group flex items-center">
          {editingId === sem.id ? (
            <div className="flex gap-1">
              <input
                autoFocus
                className="px-2 py-1 text-sm border border-slate-300 rounded-lg w-36"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(sem.id); if (e.key === 'Escape') setEditingId(null); }}
              />
              <button onClick={() => handleRename(sem.id)} className="px-2 py-1 bg-green-500 text-white text-xs rounded-lg">✓</button>
            </div>
          ) : (
            <button
              onClick={() => setActiveSemester(project.id, sem.id)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors flex items-center gap-1 ${
                project.activeSemesterId === sem.id
                  ? 'text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              style={project.activeSemesterId === sem.id ? { background: project.color } : {}}
            >
              {sem.name}
              <span className="text-xs opacity-60 ml-0.5">({sem.courses.length})</span>
            </button>
          )}
          {/* hover actions */}
          {editingId !== sem.id && (
            <div className="absolute -top-1 -right-1 hidden group-hover:flex gap-0.5 z-10">
              <button
                onClick={(e) => { e.stopPropagation(); setEditingId(sem.id); setEditName(sem.name); }}
                className="w-4 h-4 bg-white border border-slate-300 rounded text-slate-500 hover:text-slate-800 text-xs flex items-center justify-center shadow-sm"
              >✏</button>
              {project.semesters.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${sem.name}"?`)) deleteSemester(project.id, sem.id); }}
                  className="w-4 h-4 bg-white border border-slate-300 rounded text-slate-400 hover:text-red-500 text-xs flex items-center justify-center shadow-sm"
                >✕</button>
              )}
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="flex gap-1">
          <input
            autoFocus
            className="px-2 py-1 text-sm border border-slate-300 rounded-lg w-32"
            placeholder="Semester name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
          />
          <button onClick={handleAdd} className="px-2 py-1 bg-slate-800 text-white text-xs rounded-lg">Add</button>
          <button onClick={() => setAdding(false)} className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded-lg">✕</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="px-3 py-1.5 text-sm bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg font-medium transition-colors"
        >
          + Semester
        </button>
      )}
    </div>
  );
}
