import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

const STORAGE_KEY = 'gpa_calc_v1';

function newSemester(name = 'Semester 1') {
  return { id: uuid(), name, courses: [] };
}

function newProject(name = 'Major Option') {
  const semId = uuid();
  return {
    id: uuid(),
    name,
    color: '#a6192e',
    semesters: [{ id: semId, name: 'Semester 1', courses: [] }],
    activeSemesterId: semId,
  };
}

const PROJECT_COLORS = [
  '#a6192e', '#1d4ed8', '#059669', '#d97706', '#7c3aed', '#db2777',
];

function pickColor(projects) {
  const used = projects.map(p => p.color);
  return PROJECT_COLORS.find(c => !used.includes(c)) || PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
}

const initialProject = newProject('Current Plan');
initialProject.color = '#a6192e';
// Add a demo course
initialProject.semesters[0].courses = [
  { id: uuid(), name: 'Introduction to Computing', credit: 3, grade: 'A' },
  { id: uuid(), name: 'Engineering Mathematics', credit: 3, grade: 'B+' },
  { id: uuid(), name: 'English Communication', credit: 2, grade: 'A-' },
];

const useStore = create(
  persist(
    (set, get) => ({
      projects: [initialProject],
      activeProjectId: initialProject.id,
      view: 'editor', // 'editor' | 'compare' | 'wes'

      // ── Project actions ──────────────────────────────────────────
      addProject: (name) => {
        set(state => {
          const p = newProject(name);
          p.color = pickColor(state.projects);
          return {
            projects: [...state.projects, p],
            activeProjectId: p.id,
          };
        });
      },

      deleteProject: (id) => {
        set(state => {
          const projects = state.projects.filter(p => p.id !== id);
          const activeProjectId =
            state.activeProjectId === id
              ? projects[0]?.id ?? null
              : state.activeProjectId;
          return { projects, activeProjectId };
        });
      },

      renameProject: (id, name) => {
        set(state => ({
          projects: state.projects.map(p => p.id === id ? { ...p, name } : p),
        }));
      },

      setProjectColor: (id, color) => {
        set(state => ({
          projects: state.projects.map(p => p.id === id ? { ...p, color } : p),
        }));
      },

      setActiveProject: (id) => set({ activeProjectId: id }),

      // ── Semester actions ─────────────────────────────────────────
      addSemester: (projectId, name) => {
        set(state => ({
          projects: state.projects.map(p => {
            if (p.id !== projectId) return p;
            const sem = newSemester(name);
            return {
              ...p,
              semesters: [...p.semesters, sem],
              activeSemesterId: sem.id,
            };
          }),
        }));
      },

      deleteSemester: (projectId, semId) => {
        set(state => ({
          projects: state.projects.map(p => {
            if (p.id !== projectId) return p;
            const semesters = p.semesters.filter(s => s.id !== semId);
            const activeSemesterId =
              p.activeSemesterId === semId
                ? semesters[0]?.id ?? null
                : p.activeSemesterId;
            return { ...p, semesters, activeSemesterId };
          }),
        }));
      },

      renameSemester: (projectId, semId, name) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId ? p : {
              ...p,
              semesters: p.semesters.map(s => s.id === semId ? { ...s, name } : s),
            }
          ),
        }));
      },

      setActiveSemester: (projectId, semId) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId ? p : { ...p, activeSemesterId: semId }
          ),
        }));
      },

      // ── Course actions ───────────────────────────────────────────
      addCourse: (projectId, semId) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId ? p : {
              ...p,
              semesters: p.semesters.map(s =>
                s.id !== semId ? s : {
                  ...s,
                  courses: [...s.courses, { id: uuid(), name: '', credit: 3, grade: 'B+' }],
                }
              ),
            }
          ),
        }));
      },

      updateCourse: (projectId, semId, courseId, field, value) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId ? p : {
              ...p,
              semesters: p.semesters.map(s =>
                s.id !== semId ? s : {
                  ...s,
                  courses: s.courses.map(c =>
                    c.id !== courseId ? c : { ...c, [field]: value }
                  ),
                }
              ),
            }
          ),
        }));
      },

      deleteCourse: (projectId, semId, courseId) => {
        set(state => ({
          projects: state.projects.map(p =>
            p.id !== projectId ? p : {
              ...p,
              semesters: p.semesters.map(s =>
                s.id !== semId ? s : {
                  ...s,
                  courses: s.courses.filter(c => c.id !== courseId),
                }
              ),
            }
          ),
        }));
      },

      // ── View ─────────────────────────────────────────────────────
      setView: (view) => set({ view }),

      // ── Data export / import ─────────────────────────────────────
      exportData: () => {
        const state = get();
        const data = JSON.stringify({ projects: state.projects }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gpa_data_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },

      importData: (jsonString) => {
        try {
          const { projects } = JSON.parse(jsonString);
          if (!Array.isArray(projects)) throw new Error('Invalid format');
          set({ projects, activeProjectId: projects[0]?.id ?? null });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: STORAGE_KEY,
    }
  )
);

export default useStore;
