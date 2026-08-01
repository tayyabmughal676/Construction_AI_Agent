import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  department: string;
}

interface WorkflowExecutionResult {
  sessionId: string;
  success: boolean;
  status: string;
  results: Array<{ node: string; result: any }>;
  errors: string[];
  finalData?: any;
}

interface WorkflowProps {
  token: string;
}

// Default parameter templates for each workflow
const WORKFLOW_PARAMS: Record<string, { fields: Array<{ key: string; label: string; type: string; defaultValue: string; placeholder?: string }> }> = {
  employee_onboarding: {
    fields: [
      { key: 'firstName', label: 'First Name', type: 'text', defaultValue: 'Sarah', placeholder: 'Enter first name' },
      { key: 'lastName', label: 'Last Name', type: 'text', defaultValue: 'Connor', placeholder: 'Enter last name' },
      { key: 'email', label: 'Email', type: 'email', defaultValue: 'sarah.connor@construction-ai.com', placeholder: 'employee@company.com' },
      { key: 'department', label: 'Department', type: 'text', defaultValue: 'Construction', placeholder: 'e.g. Construction, HR' },
      { key: 'position', label: 'Position', type: 'text', defaultValue: 'Senior Project Engineer', placeholder: 'Job title' },
    ]
  },
  company_control: {
    fields: [
      { key: 'message', label: 'Control Directive', type: 'textarea', defaultValue: 'Analyze current inventory and trigger restock if steel beams are below 1000', placeholder: 'Describe what the orchestrator should do...' },
    ]
  },
  project_kickoff: {
    fields: [
      { key: 'projectName', label: 'Project Name', type: 'text', defaultValue: 'Downtown Skybridge Phase 2', placeholder: 'Enter project name' },
      { key: 'location', label: 'Location', type: 'text', defaultValue: 'Site Delta', placeholder: 'Job site location' },
      { key: 'budget', label: 'Budget ($)', type: 'number', defaultValue: '18000000', placeholder: 'Project budget' },
    ]
  },
  inventory_restock: {
    fields: [
      { key: 'item', label: 'Item Name', type: 'text', defaultValue: 'Steel Beams', placeholder: 'What to restock' },
      { key: 'quantity', label: 'Quantity', type: 'number', defaultValue: '300', placeholder: 'Units to order' },
      { key: 'supplier', label: 'Supplier', type: 'text', defaultValue: 'Apex Heavy Metal Ltd', placeholder: 'Supplier company name' },
    ]
  },
  employee_offboarding: {
    fields: [
      { key: 'employeeId', label: 'Employee ID', type: 'text', defaultValue: 'EMP003', placeholder: 'e.g. EMP003' },
      { key: 'reason', label: 'Reason', type: 'text', defaultValue: 'Contract completion', placeholder: 'Reason for departure' },
    ]
  },
  executive_report: {
    fields: [
      { key: 'period', label: 'Report Period', type: 'text', defaultValue: 'Q3 2026', placeholder: 'e.g. Q3 2026, July 2026' },
      { key: 'departments', label: 'Departments (comma separated)', type: 'text', defaultValue: 'HR, Construction, Manufacturing', placeholder: 'Included departments' },
    ]
  }
};

const DEPT_COLORS: Record<string, string> = {
  HR: 'purple',
  Construction: 'amber',
  Manufacturing: 'blue',
  Multi: 'emerald',
};

const DEPT_ICONS: Record<string, string> = {
  HR: '👥',
  Construction: '🏗️',
  Manufacturing: '🏭',
  Multi: '🌐',
};

export default function Workflow({ token }: WorkflowProps) {
  const { showToast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{ [id: string]: WorkflowExecutionResult }>({});

  // Wizard state
  const [wizardWorkflow, setWizardWorkflow] = useState<WorkflowItem | null>(null);
  const [wizardStep, setWizardStep] = useState(0); // 0 = params, 1 = confirm, 2 = running, 3 = done
  const [wizardParams, setWizardParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('/api/workflows/list', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch workflows');
        }

        const data = await response.json();
        setWorkflows(data.workflows || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [token]);

  const openWizard = (wf: WorkflowItem) => {
    const paramDef = WORKFLOW_PARAMS[wf.id];
    const defaults: Record<string, string> = {};
    if (paramDef) {
      paramDef.fields.forEach(f => { defaults[f.key] = f.defaultValue; });
    }
    setWizardParams(defaults);
    setWizardWorkflow(wf);
    setWizardStep(0);
  };

  const closeWizard = () => {
    setWizardWorkflow(null);
    setWizardStep(0);
    setWizardParams({});
  };

  const executeWorkflow = async () => {
    if (!wizardWorkflow) return;
    setWizardStep(2);
    setExecutingId(wizardWorkflow.id);
    showToast(`Initializing ${wizardWorkflow.name}...`, 'info', 'LangGraph Executing');

    try {
      let body: any = {};

      if (wizardWorkflow.id === 'company_control') {
        body = { message: wizardParams.message || '' };
      } else if (wizardWorkflow.id === 'executive_report') {
        body = {
          context: {
            period: wizardParams.period,
            includeDepartments: (wizardParams.departments || '').split(',').map((s: string) => s.trim())
          }
        };
      } else {
        const context: Record<string, any> = { ...wizardParams };
        if (context.budget) context.budget = Number(context.budget);
        if (context.quantity) context.quantity = Number(context.quantity);
        body = { context };
      }

      const response = await fetch(wizardWorkflow.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const resData = await response.json();
      setExecutionResult(prev => ({ ...prev, [wizardWorkflow.id]: resData }));
      setWizardStep(3);

      if (resData.success) {
        showToast(`Workflow ${wizardWorkflow.name} completed successfully!`, 'success', 'StateGraph Complete');
      } else {
        showToast(`Workflow ${wizardWorkflow.name} finished with errors.`, 'error', 'StateGraph Issue');
      }
    } catch (err) {
      console.error('Workflow execution error:', err);
      showToast(`Workflow ${wizardWorkflow.name} failed to complete.`, 'error', 'Execution Error');
      setWizardStep(3);
    } finally {
      setExecutingId(null);
    }
  };

  if (loading) return <div className="text-white">Loading LangGraph Workflows...</div>;
  if (error) return <div className="text-red-400">Error: {error}</div>;

  const deptColor = (dept: string) => DEPT_COLORS[dept] || 'slate';

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-6 rounded-xl shadow-xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">LangGraph Enterprise Workflow Center</h2>
            <p className="text-sm text-slate-400">Multi-step autonomous agent state graphs and orchestrators</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
            {workflows.length} Active Workflows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows.map(wf => {
            const isRunning = executingId === wf.id;
            const result = executionResult[wf.id];
            const color = deptColor(wf.department);
            const icon = DEPT_ICONS[wf.department] || '⚙️';

            return (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-700/40 border border-slate-600/60 p-5 rounded-lg flex flex-col justify-between hover:border-slate-500/60 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white">{icon} {wf.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium bg-${color}-500/20 text-${color}-300`}>
                      {wf.department}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mb-4">{wf.description}</p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => openWizard(wf)}
                    disabled={isRunning}
                    className="w-full py-2.5 px-4 bg-construction-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        <span>Executing Graph...</span>
                      </>
                    ) : (
                      <span>🚀 Configure & Launch</span>
                    )}
                  </button>

                  {result && (
                    <div className="bg-slate-900/80 p-3 rounded border border-slate-700 text-xs font-mono space-y-2">
                      <div className="flex justify-between text-slate-400">
                        <span>Status: <strong className={result.success ? 'text-green-400' : 'text-red-400'}>{result.status || (result.success ? 'completed' : 'failed')}</strong></span>
                        <span>Steps: {result.results?.length || 0}</span>
                      </div>

                      {result.results && result.results.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-slate-400 font-sans font-semibold">Executed Steps:</p>
                          {result.results.map((resItem, idx) => (
                            <div key={idx} className="bg-slate-800/80 p-2 rounded text-slate-300">
                              ✓ {resItem.node}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Workflow Wizard Modal */}
      <AnimatePresence>
        {wizardWorkflow && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget && wizardStep !== 2) closeWizard(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-slate-900/80 p-5 border-b border-slate-700">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{DEPT_ICONS[wizardWorkflow.department] || '⚙️'} {wizardWorkflow.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{wizardWorkflow.description}</p>
                  </div>
                  {wizardStep !== 2 && (
                    <button onClick={closeWizard} className="text-slate-400 hover:text-white text-lg px-2">✕</button>
                  )}
                </div>
                {/* Progress dots */}
                <div className="flex items-center gap-2 mt-4">
                  {['Configure', 'Confirm', 'Execute', 'Results'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full transition-colors ${
                        i < wizardStep ? 'bg-green-400' :
                        i === wizardStep ? 'bg-construction-gold animate-pulse' :
                        'bg-slate-600'
                      }`} />
                      <span className={`text-xs ${i === wizardStep ? 'text-white' : 'text-slate-500'}`}>{label}</span>
                      {i < 3 && <div className={`w-4 h-px ${i < wizardStep ? 'bg-green-400' : 'bg-slate-600'}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {/* Step 0: Configure Parameters */}
                {wizardStep === 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Workflow Parameters</h4>
                    {(WORKFLOW_PARAMS[wizardWorkflow.id]?.fields || []).map(field => (
                      <div key={field.key}>
                        <label className="block text-sm text-slate-300 mb-1">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={wizardParams[field.key] || ''}
                            onChange={e => setWizardParams(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            rows={3}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-construction-gold focus:ring-1 focus:ring-construction-gold transition-colors text-sm resize-none"
                          />
                        ) : (
                          <input
                            type={field.type}
                            value={wizardParams[field.key] || ''}
                            onChange={e => setWizardParams(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-construction-gold focus:ring-1 focus:ring-construction-gold transition-colors text-sm"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 1: Confirm */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Confirm Execution</h4>
                    <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Workflow</span>
                        <span className="text-white font-medium">{wizardWorkflow.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Department</span>
                        <span className="text-white font-medium">{wizardWorkflow.department}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Endpoint</span>
                        <span className="text-slate-300 font-mono text-xs">{wizardWorkflow.endpoint}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Parameters:</p>
                      <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 space-y-1">
                        {Object.entries(wizardParams).filter(([, v]) => v).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-slate-400 font-mono">{key}</span>
                            <span className="text-white max-w-[250px] truncate text-right">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                      <p className="text-amber-300 text-xs">⚠️ This will execute the workflow with the parameters above. The process runs autonomously through all graph nodes.</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Running */}
                {wizardStep === 2 && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-600 border-t-construction-gold"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
                    </div>
                    <h4 className="text-lg font-semibold text-white">Executing Workflow Graph</h4>
                    <p className="text-sm text-slate-400 text-center">Processing {wizardWorkflow.name}...<br />Traversing state graph nodes autonomously.</p>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-construction-gold animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Results */}
                {wizardStep === 3 && (() => {
                  const result = executionResult[wizardWorkflow.id];
                  return (
                    <div className="space-y-4">
                      <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                        result?.success
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <span className="text-3xl">{result?.success ? '✅' : '❌'}</span>
                        <div>
                          <h4 className={`font-semibold ${result?.success ? 'text-green-300' : 'text-red-300'}`}>
                            {result?.success ? 'Workflow Completed Successfully' : 'Workflow Failed'}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Status: {result?.status || 'unknown'} · Steps: {result?.results?.length || 0}
                          </p>
                        </div>
                      </div>

                      {result?.results && result.results.length > 0 && (
                        <div>
                          <p className="text-sm text-slate-400 mb-2 font-semibold">Execution Graph:</p>
                          <div className="space-y-1">
                            {result.results.map((step, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center gap-2 bg-slate-900/60 border border-slate-700 rounded-lg p-3 text-sm"
                              >
                                <span className="text-green-400 font-bold text-xs">{String(idx + 1).padStart(2, '0')}</span>
                                <div className="w-px h-4 bg-slate-600" />
                                <span className="text-white font-medium">{step.node}</span>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result?.errors && result.errors.length > 0 && (
                        <div>
                          <p className="text-sm text-red-400 mb-1">Errors:</p>
                          {result.errors.map((err, i) => (
                            <div key={i} className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 p-2 rounded">{err}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="bg-slate-900/60 p-4 border-t border-slate-700 flex justify-between">
                {wizardStep === 0 && (
                  <>
                    <button onClick={closeWizard} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                    <button onClick={() => setWizardStep(1)} className="px-6 py-2 bg-construction-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors text-sm">
                      Next: Review →
                    </button>
                  </>
                )}
                {wizardStep === 1 && (
                  <>
                    <button onClick={() => setWizardStep(0)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">← Back</button>
                    <button onClick={executeWorkflow} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors text-sm">
                      🚀 Execute Workflow
                    </button>
                  </>
                )}
                {wizardStep === 2 && (
                  <div className="w-full text-center text-xs text-slate-500">Running... Please wait.</div>
                )}
                {wizardStep === 3 && (
                  <>
                    <button onClick={closeWizard} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Close</button>
                    <button onClick={() => { setWizardStep(0); }} className="px-6 py-2 bg-construction-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors text-sm">
                      🔄 Run Again
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
