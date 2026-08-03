import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from './Toast';
import { Users, Building2, Factory, GitBranch, Rocket, Check, CheckCircle2, XCircle, AlertTriangle, RotateCw, X, Zap } from 'lucide-react';

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

const PARAM_DEFAULTS: Record<string, Record<string, string>> = {
  companyControl: { companyName: 'BuildCorp Industries', departmentFilter: 'All' },
  onboarding: { employeeId: 'EMP001', name: 'Alex Johnson', position: 'Site Engineer', department: 'Construction' },
  projectKickoff: { projectId: 'PRJ-001', name: 'Skyline Tower Phase 1', budget: '15000000', location: 'Downtown Hub' },
  inventoryRestock: { sku: 'STEEL-001', itemCode: 'STEEL-001', component: 'Structural Steel Beams', minStock: '500', restockQuantity: '1000' },
  offboarding: { employeeId: 'EMP001', exitDate: '2026-08-30', reason: 'Resignation' },
  executiveReport: { month: 'August 2026', includeFinancials: 'true', recipientEmail: 'executives@buildcorp.com' },
};

const DEPT_COLORS: Record<string, string> = {
  HR: 'purple',
  Construction: 'amber',
  Manufacturing: 'blue',
  Multi: 'emerald',
};

const DEPT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  HR: Users,
  Construction: Building2,
  Manufacturing: Factory,
  Multi: GitBranch,
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
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch workflows');
        const data = await response.json();
        setWorkflows(data.workflows || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching workflows');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkflows();
  }, [token]);

  const openWizard = (wf: WorkflowItem) => {
    setWizardWorkflow(wf);
    setWizardStep(0);
    setWizardParams({ ...(PARAM_DEFAULTS[wf.id] || {}) });
  };

  const closeWizard = () => {
    setWizardWorkflow(null);
    setWizardStep(0);
    setWizardParams({});
  };

  const executeWorkflow = async () => {
    if (!wizardWorkflow) return;
    const wf = wizardWorkflow;
    setWizardStep(2); // Running state
    setExecutingId(wf.id);

    try {
      const response = await fetch(wf.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(wizardParams),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Workflow execution failed');
      }

      setExecutionResult(prev => ({
        ...prev,
        [wf.id]: {
          sessionId: data.sessionId || 'N/A',
          success: data.success !== false,
          status: data.status || 'completed',
          results: data.results || [],
          errors: data.errors || [],
          finalData: data.finalData || data.data,
        },
      }));

      setWizardStep(3); // Results state
      showToast(`Workflow "${wf.name}" executed successfully`, 'success', 'Graph Execution Done');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Execution error';
      setExecutionResult(prev => ({
        ...prev,
        [wf.id]: {
          sessionId: 'FAILED',
          success: false,
          status: 'failed',
          results: [],
          errors: [errorMsg],
        },
      }));
      setWizardStep(3);
      showToast(`Workflow "${wf.name}" failed: ${errorMsg}`, 'error', 'Execution Error');
    } finally {
      setExecutingId(null);
    }
  };

  const deptColor = (dept: string) => DEPT_COLORS[dept] || 'slate';

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-2xl shadow-xl">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GitBranch className="w-6 h-6 text-construction-gold" />
              <span>LangGraph Multi-Agent Workflows (6 Operational)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Autonomous state graph orchestration engines for cross-department operations
            </p>
          </div>
        </div>

        {loading && <div className="text-slate-400 text-sm text-center py-8">Loading available workflows...</div>}
        {error && <div className="text-red-400 text-sm text-center py-8">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows.map(wf => {
            const isRunning = executingId === wf.id;
            const result = executionResult[wf.id];
            const color = deptColor(wf.department);
            const DeptIconComp = DEPT_ICONS[wf.department] || GitBranch;

            return (
              <motion.div
                key={wf.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-700/40 border border-slate-600/60 p-5 rounded-lg flex flex-col justify-between hover:border-slate-500/60 transition-colors"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <DeptIconComp className="w-5 h-5 text-construction-gold" />
                      <span>{wf.name}</span>
                    </h3>
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
                      <>
                        <Rocket className="w-4 h-4" />
                        <span>Configure & Launch</span>
                      </>
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
                            <div key={idx} className="bg-slate-800/80 p-2 rounded text-slate-300 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{resItem.node}</span>
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
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {(() => {
                        const IconComponent = DEPT_ICONS[wizardWorkflow.department] || GitBranch;
                        return <IconComponent className="w-5 h-5 text-construction-gold" />;
                      })()}
                      <span>{wizardWorkflow.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{wizardWorkflow.description}</p>
                  </div>
                  {wizardStep !== 2 && (
                    <button onClick={closeWizard} className="text-slate-400 hover:text-white p-1">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {/* Stepper Indicator */}
                <div className="flex items-center gap-2 mt-4">
                  {['Parameters', 'Review', 'Execution', 'Results'].map((label, idx) => (
                    <div key={label} className="flex-1 flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        wizardStep === idx ? 'bg-construction-gold text-black' :
                        wizardStep > idx ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {wizardStep > idx ? <Check className="w-3 h-3" /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-medium hidden sm:inline ${wizardStep === idx ? 'text-white font-bold' : 'text-slate-500'}`}>{label}</span>
                      {idx < 3 && <div className="flex-1 h-0.5 bg-slate-700" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {/* Step 0: Parameters */}
                {wizardStep === 0 && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Configure Parameters</p>
                    {Object.keys(wizardParams).length === 0 ? (
                      <p className="text-sm text-slate-400 italic">No customizable parameters required for this workflow.</p>
                    ) : (
                      Object.entries(wizardParams).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-xs font-mono text-slate-300 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => setWizardParams(prev => ({ ...prev, [key]: e.target.value }))}
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-construction-gold"
                          />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Step 1: Review & Confirm */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Review Configuration</p>
                    <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Workflow</span>
                        <span className="text-white font-bold">{wizardWorkflow.name}</span>
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
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-amber-300 text-xs">This will execute the workflow with the parameters above. The process runs autonomously through all graph nodes.</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Running */}
                {wizardStep === 2 && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-600 border-t-construction-gold"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-construction-gold" />
                      </div>
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
                        {result?.success ? (
                          <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
                        ) : (
                          <XCircle className="w-8 h-8 text-red-400 shrink-0" />
                        )}
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
                    <button onClick={executeWorkflow} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-500 transition-colors text-sm flex items-center gap-1.5">
                      <Rocket className="w-4 h-4" />
                      <span>Execute Workflow</span>
                    </button>
                  </>
                )}
                {wizardStep === 2 && (
                  <div className="w-full text-center text-xs text-slate-500">Running... Please wait.</div>
                )}
                {wizardStep === 3 && (
                  <>
                    <button onClick={closeWizard} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Close</button>
                    <button onClick={() => { setWizardStep(0); }} className="px-6 py-2 bg-construction-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors text-sm flex items-center gap-1.5">
                      <RotateCw className="w-4 h-4" />
                      <span>Run Again</span>
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
