import { useState } from 'react';
import useStore from '../store/useStore';
import { calcProjectGPA } from '../utils/gpa';
import { POLYU_GRADES } from '../utils/gpa';

const COLOR_PALETTE = [
  '#a6192e', '#1d4ed8', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#65a30d',
];

export default function Sidebar() {
  const { projects, activeProjectId, view, setActiveProject, addProject, deleteProject, renameProject, setProjectColor, setView, exportData, importData } = useStore();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(null);

  const handleAdd = () => {
    const name = newName.trim() || `Option ${projects.length + 1}`;
    addProject(name);
    setNewName('');
  };

  const handleRename = (id) => {
    if (editName.trim()) renameProject(id, editName.trim());
    setEditingId(null);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const ok = importData(ev.target.result);
        if (!ok) alert('Invalid file format');
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: '#a6192e' }}>G</div>
          <div>
            <div className="font-bold text-slate-800 text-sm leading-tight">GPA Calculator</div>
            <div className="text-xs text-slate-400">PolyU 4.3 Scale</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 border-b border-slate-200 flex flex-col gap-1">
        {[
          { id: 'editor', label: 'Course Editor', icon: '📝' },
          { id: 'compare', label: 'Compare Majors', icon: '⚖️' },
          { id: 'wes', label: 'WES Conversion', icon: '🇺🇸' },
        ].map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
              view === id
                ? 'bg-red-50 text-red-700'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* Projects */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Major Options</div>
        <div className="flex flex-col gap-1">
          {projects.map(p => {
            const { gpa } = calcProjectGPA(p.semesters, POLYU_GRADES);
            return (
              <div key={p.id} className="relative group">
                {editingId === p.id ? (
                  <div className="flex gap-1">
                    <input
                      autoFocus
                      className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded-lg"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(p.id); if (e.key === 'Escape') setEditingId(null); }}
                    />
                    <button onClick={() => handleRename(p.id)} className="px-2 py-1 bg-green-500 text-white text-xs rounded-lg">✓</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setActiveProject(p.id); if (view === 'compare' || view === 'wes') return; setView('editor'); }}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                      activeProjectId === p.id
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span className="flex-1 text-left text-slate-700 truncate font-medium">{p.name}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: p.color }}>{gpa.toFixed(2)}</span>
                  </button>
                )}

                {/* Context buttons */}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-0.5">
                  {editingId !== p.id && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowColorPicker(showColorPicker === p.id ? null : p.id); }}
                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 text-xs"
                        title="Change color"
                      >🎨</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name); }}
                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 text-xs"
                        title="Rename"
                      >✏️</button>
                      {projects.length > 1 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${p.name}"?`)) deleteProject(p.id); }}
                          className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500 text-xs"
                          title="Delete"
                        >✕</button>
                      )}
                    </>
                  )}
                </div>

                {/* Color picker */}
                {showColorPicker === p.id && (
                  <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex flex-wrap gap-1 w-40">
                    {COLOR_PALETTE.map(c => (
                      <button
                        key={c}
                        onClick={() => { setProjectColor(p.id, c); setShowColorPicker(null); }}
                        className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ background: c, borderColor: p.color === c ? '#1e293b' : 'transparent' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add project */}
        <div className="mt-3 flex gap-1">
          <input
            className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-red-400"
            placeholder="New major option..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium"
          >+</button>
        </div>
      </div>

      {/* Data actions */}
      <div className="px-3 py-3 border-t border-slate-200 flex flex-col gap-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1 mb-1">Data</div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span>⬇️</span> Export JSON
        </button>
        <button
          onClick={handleImport}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <span>⬆️</span> Import JSON
        </button>
      </div>
    </aside>
  );
}
