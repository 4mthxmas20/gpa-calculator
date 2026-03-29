import useStore from './store/useStore';
import Sidebar from './components/Sidebar';
import EditorView from './components/EditorView';
import CompareView from './components/CompareView';
import WESView from './components/WESView';
import './index.css';

export default function App() {
  const { view } = useStore();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">
        {view === 'editor' && <EditorView />}
        {view === 'compare' && <CompareView />}
        {view === 'wes' && <WESView />}
      </main>
    </div>
  );
}
