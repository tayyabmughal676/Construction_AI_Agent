import { useEffect, useState } from 'react';

interface InventoryItem {
  component: string;
  sku: string;
  stock: number;
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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<MfgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, statsRes] = await Promise.all([
          fetch('/api/manufacturing/inventory', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/manufacturing/stats', { headers: { 'Authorization': `Bearer ${token}` } })
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

    fetchData();
  }, [token]);

  if (loading) return <div className="text-white">Loading Manufacturing Data...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-xl shadow-xl">
            <h3 className="text-sm text-slate-400 mb-1">OEE (Overall Equipment Effectiveness)</h3>
            <p className="text-2xl font-bold text-white">{stats.oee}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-xl shadow-xl">
            <h3 className="text-sm text-slate-400 mb-1">Active Production Lines</h3>
            <p className="text-2xl font-bold text-white">{stats.activeLines}</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 rounded-xl shadow-xl">
            <h3 className="text-sm text-slate-400 mb-1">QC Pass Rate</h3>
            <p className="text-2xl font-bold text-green-400">{stats.qcPassRate}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl mb-4 text-white">Manufacturing Plant - Inventory</h2>
        {inventory.length === 0 ? (
          <p className="text-slate-400">No inventory found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="p-3 font-semibold text-white">Component</th>
                  <th className="p-3 font-semibold text-white">SKU</th>
                  <th className="p-3 font-semibold text-white">Stock Level</th>
                  <th className="p-3 font-semibold text-white">Location</th>
                  <th className="p-3 font-semibold text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {inventory.map(item => (
                  <tr key={item.sku} className="hover:bg-slate-700/30">
                    <td className="p-3 font-medium text-white">{item.component}</td>
                    <td className="p-3 font-mono text-xs">{item.sku}</td>
                    <td className="p-3">{item.stock.toLocaleString()} units</td>
                    <td className="p-3">{item.location}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.status === 'Optimal' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
