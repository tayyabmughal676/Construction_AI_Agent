import { useEffect, useState } from 'react';

interface Project {
  id: string;
  name: string;
  location: string;
  budget: string;
  progress: number;
  status: string;
}

interface ConstructionProps {
  token: string;
}

export default function Construction({ token }: ConstructionProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/construction/projects', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch Construction data');
        }
        
        const data = await response.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [token]);

  if (loading) return <div className="text-white">Loading Construction Data...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl shadow-xl">
      <h2 className="text-xl mb-4 text-white">Construction Site - Active Projects</h2>
      {projects.length === 0 ? (
        <p className="text-slate-400">No active projects.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-white">{project.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  project.status === 'On Track' ? 'bg-green-500/20 text-green-400' :
                  project.status === 'Finished' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {project.status}
                </span>
              </div>
              
              <div className="text-sm text-slate-300 space-y-1 mb-4">
                <p>📍 {project.location}</p>
                <p>💰 {project.budget}</p>
              </div>

              <div className="w-full bg-slate-600 rounded-full h-2.5">
                <div className="bg-construction-gold h-2.5 rounded-full transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
              </div>
              <p className="text-right text-xs text-slate-400 mt-1">{project.progress}% Complete</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
