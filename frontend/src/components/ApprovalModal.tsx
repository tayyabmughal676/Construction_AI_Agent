import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle2, XCircle, DollarSign, AlertCircle } from 'lucide-react';

interface ApprovalModalData {
  sessionId?: string;
  threadId?: string;
  amount: number;
  description: string;
}

interface ApprovalModalProps {
  modalData: ApprovalModalData | null;
  onReject: () => void;
  onApprove: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ modalData, onReject, onApprove }) => {
  return (
    <AnimatePresence>
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-amber-500/10"
          >
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Human-in-the-Loop Approval Required</h3>
                <p className="text-xs text-amber-400 font-medium">LangGraph Interrupt Node · Threshold Exceeded</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 mb-5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300 pb-2 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  Total Purchase Commit:
                </span>
                <span className="text-base font-bold text-emerald-400">${modalData.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Interrupt Rule:
                </span>
                <span className="text-slate-200 font-mono">High-Value PO &gt; $10,000</span>
              </div>
              <div className="text-slate-400 pt-2 border-t border-slate-800">
                <p className="text-[11px] leading-relaxed text-slate-300">{modalData.description}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onReject}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>Reject Order</span>
              </button>
              <button
                onClick={onApprove}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Resume Swarm</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
