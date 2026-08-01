import { useEffect, useState } from 'react';
import { useToast } from './Toast';

interface Project {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  location: string;
  budget: string;
  rawBudget?: number;
  progress: number;
  status: string;
  startDate?: string;
}

interface ConstructionProps {
  token: string;
}

export default function Construction({ token }: ConstructionProps) {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [detailModal, setDetailModal] = useState<Project | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<Project | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: 'Site Alpha',
    budget: '2500000',
    progress: '15',
    status: 'On Track',
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/construction/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch Construction projects');
      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching Construction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/construction/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          budget: Number(formData.budget),
          progress: Number(formData.progress),
        }),
      });
      if (response.ok) {
        setAddModalOpen(false);
        showToast(`Construction site ${formData.name} initialized!`, 'success', 'Project Created');
        setFormData({
          name: '',
          description: '',
          location: 'Site Alpha',
          budget: '2500000',
          progress: '15',
          status: 'On Track',
        });
        fetchProjects();
      } else {
        showToast('Failed to create project record.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to site service.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      const response = await fetch(`/api/construction/projects/${editModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editModal,
          budget: editModal.rawBudget ?? Number(editModal.budget.replace(/[^0-9.]/g, '')),
        }),
      });
      if (response.ok) {
        setEditModal(null);
        showToast(`Updated site metrics for ${editModal.name} (${editModal.projectId})`, 'success', 'Project Updated');
        fetchProjects();
      } else {
        showToast('Failed to update project metrics.', 'error');
      }
    } catch (err) {
      showToast('Error saving project updates.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete project ${name}?`)) return;
    try {
      const response = await fetch(`/api/construction/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        showToast(`Removed project ${name} from active site list`, 'info', 'Project Deleted');
        fetchProjects();
      } else {
        showToast('Failed to delete project.', 'error');
      }
    } catch (err) {
      showToast('Error deleting project.', 'error');
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🏗️</span> Site Terminal — Active Projects
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track site construction progress, material budgets, safety phases, and project timelines
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by project ID, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
          />
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+</span> Add Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm bg-slate-800/60 border border-slate-700/50 rounded-2xl">
          Loading projects...
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-400 text-sm bg-slate-800/60 border border-slate-700/50 rounded-2xl">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm bg-slate-800/60 border border-slate-700/50 rounded-2xl">
          No matching projects found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((project) => (
            <div
              key={project.id}
              className="bg-slate-800/60 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all shadow-xl flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {project.projectId}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{project.name}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                      project.status === 'On Track'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : project.status === 'Finished'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5 my-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  <p className="flex justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-medium text-white">📍 {project.location}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-500">Budget:</span>
                    <span className="font-mono text-emerald-400 font-bold">{project.budget}</span>
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>Progress</span>
                  <span className="font-mono text-amber-400 font-semibold">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/50">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-amber-400/50"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-700/50">
                  <button
                    onClick={() => setDetailModal(project)}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-all"
                    title="View Site Details"
                  >
                    👁️ Details
                  </button>
                  <button
                    onClick={() => setEditModal(project)}
                    className="p-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs border border-amber-500/30 transition-all"
                    title="Edit Project"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs border border-rose-500/30 transition-all"
                    title="Delete Project"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{detailModal.name}</h3>
                <p className="text-xs font-mono text-amber-400">ID: {detailModal.projectId}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-white">{detailModal.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Allocated Budget</span>
                <span className="font-mono text-emerald-400">{detailModal.budget}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Completion</span>
                <span className="font-mono text-amber-400">{detailModal.progress}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status</span>
                <span className="font-medium text-emerald-400">{detailModal.status}</span>
              </div>
            </div>
            <button
              onClick={() => setDetailModal(null)}
              className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">+ Add New Construction Project</h3>
              <button type="button" onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Project Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Location Site</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Budget ($ USD)</label>
                <input
                  type="number"
                  required
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="On Track">On Track</option>
                  <option value="Planned">Planned</option>
                  <option value="Finished">Finished</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Project Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEditSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Construction Project</h3>
                <p className="text-xs font-mono text-amber-400">ID: {editModal.projectId}</p>
              </div>
              <button type="button" onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Project Name</label>
              <input
                type="text"
                required
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Location Site</label>
                <input
                  type="text"
                  required
                  value={editModal.location}
                  onChange={(e) => setEditModal({ ...editModal, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={editModal.status}
                  onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="On Track">On Track</option>
                  <option value="Planned">Planned</option>
                  <option value="Finished">Finished</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editModal.progress}
                  onChange={(e) => setEditModal({ ...editModal, progress: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20"
              >
                Update Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
