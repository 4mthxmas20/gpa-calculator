import { useState } from 'react';
import useStore from './store/useStore';
import Sidebar from './components/Sidebar';
import EditorView from './components/EditorView';
import CompareView from './components/CompareView';
import WESView from './components/WESView';
import './index.css';

const VIEW_LABELS = { editor: '📝 Editor', compare: '⚖️ Compare', wes: '🇺🇸 WES' };

export default function App() {
  const { view, setView } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative z-50 flex">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col gap-1 p-1"
            aria-label="Open menu"
          >
            <span className="w-5 h-0.5 bg-slate-700 rounded" />
            <span className="w-5 h-0.5 bg-slate-700 rounded" />
            <span className="w-5 h-0.5 bg-slate-700 rounded" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold" style={{ background: '#a6192e' }}>G</div>
            <span className="font-bold text-slate-800 text-sm">GPA Calculator</span>
          </div>

          {/* Mobile view switcher */}
          <div className="flex gap-1">
            {Object.entries(VIEW_LABELS).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                  view === v ? 'text-white' : 'text-slate-500 bg-slate-100'
                }`}
                style={view === v ? { background: '#a6192e' } : {}}
              >
                {label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto flex flex-col">
          {view === 'editor'  && <EditorView />}
          {view === 'compare' && <CompareView />}
          {view === 'wes'     && <WESView />}
        </main>
      </div>
    </div>
  );
}
