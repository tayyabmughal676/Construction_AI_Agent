import { useEffect, useState } from 'react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  status: string;
}

interface HRProps {
  token: string;
}

export default function HR({ token }: HRProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/hr/employees', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch HR data');
        }
        
        const data = await response.json();
        setEmployees(data.employees || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [token]);

  if (loading) return <div className="text-white">Loading HR Data...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl shadow-xl">
      <h2 className="text-xl mb-4 text-white">HR Hub - Employee Directory</h2>
      {employees.length === 0 ? (
        <p className="text-slate-400">No employees found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="p-3 font-semibold text-white">Name</th>
                <th className="p-3 font-semibold text-white">Role</th>
                <th className="p-3 font-semibold text-white">Department</th>
                <th className="p-3 font-semibold text-white">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {employees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-700/30">
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3">{emp.role}</td>
                  <td className="p-3">{emp.department}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      emp.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
