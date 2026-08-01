import { useEffect, useState } from 'react';
import { useToast } from './Toast';

interface Employee {
  id: string;
  mongoId?: string;
  employeeId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: string;
  position: string;
  department: string;
  email: string;
  salary: number;
  status: string;
}

interface HRProps {
  token: string;
}

export default function HR({ token }: HRProps) {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [detailModal, setDetailModal] = useState<Employee | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: 'Engineering',
    salary: '75000',
    status: 'Active',
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/hr/employees', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch employee directory');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching HR data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [token]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setAddModalOpen(false);
        showToast(`Employee ${formData.firstName} ${formData.lastName} onboarded successfully!`, 'success', 'HR Directory Updated');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          position: '',
          department: 'Engineering',
          salary: '75000',
          status: 'Active',
        });
        fetchEmployees();
      } else {
        showToast('Failed to add employee record.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to HR service.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      const response = await fetch(`/api/hr/employees/${editModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editModal),
      });
      if (response.ok) {
        setEditModal(null);
        showToast(`Updated record for ${editModal.name} (${editModal.employeeId})`, 'success', 'Employee Updated');
        fetchEmployees();
      } else {
        showToast('Failed to update employee details.', 'error');
      }
    } catch (err) {
      showToast('Error saving updates.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const response = await fetch(`/api/hr/employees/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        showToast(`Removed employee ${name} from workforce directory`, 'info', 'Record Deleted');
        fetchEmployees();
      } else {
        showToast('Failed to delete employee.', 'error');
      }
    } catch (err) {
      showToast('Error processing deletion.', 'error');
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>👥</span> HR Workforce Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage employee directory, onboarding, positions, and active statuses
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search by ID, name, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-64"
          />
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>+</span> Add Employee
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading employees...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No matching employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">Employee ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Position / Role</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono font-medium text-purple-400">{emp.employeeId}</td>
                    <td className="p-4 font-semibold text-white">{emp.name}</td>
                    <td className="p-4">{emp.role}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-600">
                        {emp.department}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-mono text-[11px]">{emp.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full font-semibold text-[10px] ${
                          emp.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setDetailModal(emp)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-all"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => setEditModal(emp)}
                        className="p-1.5 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded-lg text-xs border border-purple-500/30 transition-all"
                        title="Edit Employee"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(emp.id, emp.name)}
                        className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs border border-rose-500/30 transition-all"
                        title="Delete Employee"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{detailModal.name}</h3>
                <p className="text-xs font-mono text-purple-400">ID: {detailModal.employeeId}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Position / Role</span>
                <span className="font-medium text-white">{detailModal.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-white">{detailModal.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Email</span>
                <span className="font-mono text-white">{detailModal.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Annual Salary</span>
                <span className="font-mono text-emerald-400">${detailModal.salary.toLocaleString()}</span>
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

      {/* Add Employee Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">+ Add New Employee</h3>
              <button type="button" onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Position / Title</label>
                <input
                  type="text"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Construction">Construction</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Manufacturing">Manufacturing</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Salary ($)</label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-purple-600/20"
              >
                Save Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEditSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Employee</h3>
                <p className="text-xs font-mono text-purple-400">ID: {editModal.employeeId}</p>
              </div>
              <button type="button" onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Position / Role</label>
                <input
                  type="text"
                  required
                  value={editModal.role}
                  onChange={(e) => setEditModal({ ...editModal, role: e.target.value, position: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={editModal.department}
                  onChange={(e) => setEditModal({ ...editModal, department: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Salary ($)</label>
                <input
                  type="number"
                  value={editModal.salary}
                  onChange={(e) => setEditModal({ ...editModal, salary: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={editModal.status}
                  onChange={(e) => setEditModal({ ...editModal, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
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
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-purple-600/20"
              >
                Update Employee
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
