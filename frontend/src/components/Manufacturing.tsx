import { useEffect, useState } from 'react';
import { useToast } from './Toast';
import { Factory, Plus, Eye, Edit, Trash2, X, Search, MapPin } from 'lucide-react';

interface InventoryItem {
  id: string;
  mongoId?: string;
  itemCode: string;
  component: string;
  name?: string;
  category?: string;
  sku: string;
  stock: number;
  quantity?: number;
  unitCost?: number;
  reorderPoint?: number;
  status: string;
  location: string;
}

interface MfgStats {
  oee: string;
  activeLines: string;
  qcPassRate: string;
}

interface ManufacturingProps {
  token: string;
}

export default function Manufacturing({ token }: ManufacturingProps) {
  const { showToast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<MfgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [detailModal, setDetailModal] = useState<InventoryItem | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState<InventoryItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Raw Materials',
    itemCode: '',
    quantity: '500',
    unitCost: '25.0',
    reorderPoint: '100',
    location: 'Warehouse A',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, statsRes] = await Promise.all([
        fetch('/api/manufacturing/inventory', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/manufacturing/stats', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!invRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch Manufacturing data');
      }

      const invData = await invRes.json();
      const statsData = await statsRes.json();

      setInventory(invData.inventory || []);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/manufacturing/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          unitCost: Number(formData.unitCost),
          reorderPoint: Number(formData.reorderPoint),
        }),
      });
      if (response.ok) {
        setAddModalOpen(false);
        showToast(`Added component ${formData.name} to warehouse inventory`, 'success', 'Stock Item Created');
        setFormData({
          name: '',
          category: 'Raw Materials',
          itemCode: '',
          quantity: '500',
          unitCost: '25.0',
          reorderPoint: '100',
          location: 'Warehouse A',
        });
        fetchData();
      } else {
        showToast('Failed to add component to inventory.', 'error');
      }
    } catch (err) {
      showToast('Error connecting to inventory service.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      const response = await fetch(`/api/manufacturing/inventory/${editModal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editModal,
          quantity: Number(editModal.stock),
        }),
      });
      if (response.ok) {
        setEditModal(null);
        showToast(`Updated stock levels for ${editModal.component} (${editModal.itemCode || editModal.sku})`, 'success', 'Inventory Updated');
        fetchData();
      } else {
        showToast('Failed to update inventory item.', 'error');
      }
    } catch (err) {
      showToast('Error saving inventory updates.', 'error');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      const response = await fetch(`/api/manufacturing/inventory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        showToast(`Removed ${name} from inventory catalog`, 'info', 'Item Deleted');
        fetchData();
      } else {
        showToast('Failed to delete item.', 'error');
      }
    } catch (err) {
      showToast('Error deleting item.', 'error');
    }
  };

  const filtered = inventory.filter(
    (item) =>
      item.component.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.itemCode && item.itemCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-xl">
            <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              OEE (Equipment Effectiveness)
            </h3>
            <p className="text-2xl font-bold text-blue-400">{stats.oee}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-xl">
            <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Active Production Lines
            </h3>
            <p className="text-2xl font-bold text-white">{stats.activeLines}</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl shadow-xl">
            <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Quality Control Pass Rate
            </h3>
            <p className="text-2xl font-bold text-emerald-400">{stats.qcPassRate}</p>
          </div>
        </div>
      )}

      {/* Main Inventory Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Factory className="w-6 h-6 text-blue-400" />
            <span>Fabrication Node — Inventory Stock</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitor raw components, hardware SKUs, warehouse locations, and reorder levels
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by SKU, component..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2.5 pl-8 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Component</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading manufacturing inventory...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No matching inventory items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/60 border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4">SKU / Item Code</th>
                  <th className="p-4">Component Name</th>
                  <th className="p-4">Stock Level</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 font-mono font-medium text-blue-400">{item.itemCode || item.sku}</td>
                    <td className="p-4 font-semibold text-white">{item.component}</td>
                    <td className="p-4 font-mono font-bold text-white">
                      {item.stock.toLocaleString()} units
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-700 text-slate-300 border border-slate-600 inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.location}</span>
                      </span>
                    </td>
                    <td className="p-4 font-mono text-emerald-400">
                      ${(item.unitCost || 0).toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full font-semibold text-[10px] ${
                          item.status === 'Optimal'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setDetailModal(item)}
                        className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs transition-all inline-flex items-center"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditModal(item)}
                        className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 rounded-lg text-xs border border-blue-500/30 transition-all inline-flex items-center"
                        title="Edit Item"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.component)}
                        className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 rounded-lg text-xs border border-rose-500/30 transition-all inline-flex items-center"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                <h3 className="text-lg font-bold text-white">{detailModal.component}</h3>
                <p className="text-xs font-mono text-blue-400">SKU: {detailModal.itemCode || detailModal.sku}</p>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-slate-400 hover:text-white text-lg font-bold">
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Warehouse Location</span>
                <span className="font-medium text-white">{detailModal.location}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Current Stock</span>
                <span className="font-mono text-white font-bold">{detailModal.stock.toLocaleString()} units</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Unit Cost</span>
                <span className="font-mono text-emerald-400">${(detailModal.unitCost || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-700/50">
                <span className="text-slate-500">Reorder Threshold</span>
                <span className="font-mono text-amber-400">{detailModal.reorderPoint || 100} units</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Stock Health</span>
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

      {/* Add Item Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white">+ Add Inventory Component</h3>
              <button type="button" onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Component Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">SKU / Item Code</label>
                <input
                  type="text"
                  placeholder="e.g. STEEL-009"
                  value={formData.itemCode}
                  onChange={(e) => setFormData({ ...formData, itemCode: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Fasteners">Fasteners</option>
                  <option value="Finishing">Finishing</option>
                  <option value="Hardware">Hardware</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Warehouse Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Reorder Threshold</label>
                <input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
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
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-blue-600/20"
              >
                Save Component
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Item Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEditSubmit} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Component Stock</h3>
                <p className="text-xs font-mono text-blue-400">SKU: {editModal.itemCode || editModal.sku}</p>
              </div>
              <button type="button" onClick={() => setEditModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Component Name</label>
              <input
                type="text"
                required
                value={editModal.component}
                onChange={(e) => setEditModal({ ...editModal, component: e.target.value })}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={editModal.stock}
                  onChange={(e) => setEditModal({ ...editModal, stock: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Warehouse Location</label>
                <input
                  type="text"
                  required
                  value={editModal.location}
                  onChange={(e) => setEditModal({ ...editModal, location: e.target.value })}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
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
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-blue-600/20"
              >
                Update Component
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
