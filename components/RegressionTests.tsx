import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { streamInference } from '../services/InferenceEngine';
import { RegressionTestResult, Message } from '../types';

export const RegressionTests: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RegressionTestResult[]>([
    {
      id: 'A',
      category: 'Response Coherence',
      input: 'Explain how speculative decoding works and why it improves quality.',
      status: 'pending'
    },
    {
      id: 'B',
      category: 'Continuation Integrity',
      input: 'Write a Kotlin function that streams tokens. Then stop.',
      status: 'pending'
    },
    {
      id: 'C',
      category: 'Voice/Text Alignment',
      input: 'Explain battery-aware scheduling.',
      status: 'pending'
    },
    {
      id: 'D',
      category: 'Min Intelligence Floor',
      input: 'List 10 app ideas for a conversational AI.',
      status: 'pending'
    }
  ]);

  const runTest = async (test: RegressionTestResult) => {
    // Update status to running
    setResults(prev => prev.map(r => r.id === test.id ? { ...r, status: 'running', output: '' } : r));

    let fullOutput = '';
    try {
      // Create a temporary message history
      const history: Message[] = [];
      const stream = streamInference(history, test.input, false); // Use API if available for real quality check

      for await (const chunk of stream) {
        if (chunk.text) fullOutput += chunk.text;
      }

      // Validation Logic (Automated Fail Criteria)
      let status: 'pass' | 'fail' = 'pass';
      let reason = '';

      // Test A: Coherence
      if (test.id === 'A') {
        if (fullOutput.split('\n\n').length < 2) {
            status = 'fail';
            reason = 'Fewer than 2 paragraphs';
        }
      }
      
      // Test D: Min Floor
      if (test.id === 'D') {
          if (fullOutput.length < 200) {
              status = 'fail';
              reason = 'Output too short for list of 10';
          }
      }

      setResults(prev => prev.map(r => 
        r.id === test.id ? { ...r, status, output: fullOutput, reason } : r
      ));

    } catch (e: any) {
      setResults(prev => prev.map(r => 
        r.id === test.id ? { ...r, status: 'fail', reason: e.message } : r
      ));
    }
  };

  const runAll = async () => {
    setIsRunning(true);
    for (const test of results) {
        await runTest(test);
    }
    setIsRunning(false);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 bg-nexus-900 text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-nexus-700 pb-4">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="text-yellow-500" />
                    Regression Diagnostics
                </h2>
                <p className="text-nexus-dim text-sm mt-1">Automated Quality Assurance Suite • Build 2025.04.12</p>
            </div>
            <button 
                onClick={runAll}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 bg-nexus-700 hover:bg-nexus-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
                {isRunning ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                Run Suite
            </button>
        </div>

        <div className="grid gap-4">
            {results.map(test => (
                <div key={test.id} className="bg-nexus-800 border border-nexus-700 rounded-xl p-4 transition-all">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <span className="text-xs font-mono text-nexus-highlight uppercase tracking-wider mb-1 block">{test.category}</span>
                            <h3 className="font-medium text-white">{test.input}</h3>
                        </div>
                        <div className="shrink-0 ml-4">
                            {test.status === 'pending' && <span className="px-2 py-1 bg-white/5 rounded text-xs text-nexus-dim">PENDING</span>}
                            {test.status === 'running' && <Loader2 className="animate-spin text-nexus-highlight" size={20} />}
                            {test.status === 'pass' && <div className="flex items-center gap-1 text-emerald-500"><CheckCircle size={18} /><span className="text-xs font-bold">PASS</span></div>}
                            {test.status === 'fail' && <div className="flex items-center gap-1 text-red-500"><XCircle size={18} /><span className="text-xs font-bold">FAIL</span></div>}
                        </div>
                    </div>
                    
                    {test.output && (
                        <div className="mt-3 p-3 bg-black/30 rounded-lg border border-white/5">
                            <div className="text-xs text-nexus-dim font-mono mb-2">OUTPUT STREAM:</div>
                            <p className="text-sm text-gray-300 font-mono leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                                {test.output}
                            </p>
                        </div>
                    )}
                    
                    {test.reason && (
                        <div className="mt-2 text-xs text-red-400 font-medium bg-red-500/10 px-2 py-1 rounded inline-block">
                            Failure Reason: {test.reason}
                        </div>
                    )}
                </div>
            ))}
        </div>

      </div>
    </div>
  );
};