import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, ArrowRight, Zap, Monitor, Shield, Layout, Navigation, Type } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const ScoreBadge = ({ score }) => {
    let color = 'bg-red-500';
    if (score >= 80) color = 'bg-green-500';
    else if (score >= 50) color = 'bg-yellow-500';

    return (
        <div className="flex flex-col items-center">
            <div className={cn("text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600",
                score >= 80 ? "from-green-600 to-green-900" : (score >= 50 ? "from-yellow-600 to-yellow-900" : "from-red-600 to-red-900")
            )}>
                {score}
            </div>
            <div className="text-sm text-gray-400 font-medium uppercase tracking-wider mt-2">UX Score</div>
        </div>
    );
};

// Polling hook
function useAuditStatus(auditId) {
    const [status, setStatus] = useState('pending');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!auditId) return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`/api/status/${auditId}`);
                console.log("Polling result:", res.data);
                if (res.data.status === 'completed') {
                    setResult(res.data.result); // ensure parsed json
                    setStatus('completed');
                    clearInterval(interval);
                } else if (res.data.status === 'failed') {
                    setError(res.data.error);
                    setStatus('failed');
                    clearInterval(interval);
                }
                // keep polling if pending/processing
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [auditId]);

    return { status, result, error };
}

export default function App() {
    const [view, setView] = useState('home');
    const [url, setUrl] = useState('');
    const [auditId, setAuditId] = useState(null);
    const { status, result, error } = useAuditStatus(auditId);
    const [recentAudits, setRecentAudits] = useState([]);

    useEffect(() => {
        fetchRecent();
    }, [status]); // refresh list when status changes

    const fetchRecent = async () => {
        try {
            const res = await axios.get('/api/history');
            setRecentAudits(res.data);
        } catch (e) { console.error(e); }
    };

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!url) return;
        try {
            const res = await axios.post('/api/analyze', { url });
            setAuditId(res.data.auditId);
        } catch (e) {
            alert("Failed to start audit: " + e.message);
        }
    };

    const reset = () => {
        setAuditId(null);
        setUrl('');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-12">
                <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setView('home')}
                >
                    <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                        <Zap className="text-white w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">UX Reviewer</h1>
                </div>
                <div className="text-sm font-medium text-gray-500">
                    <button
                        onClick={() => setView('status')}
                        className="hover:text-blue-600 transition-colors"
                    >
                        System Status
                    </button>
                </div>
            </header>

            <main className="max-w-3xl mx-auto">
                {view === 'status' ? <SystemStatus onBack={() => setView('home')} /> : (
                    <>
                        {!auditId ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 text-center"
                            >
                                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                                    Review your UX <span className="text-blue-600">in seconds</span>.
                                </h2>
                                <p className="text-lg text-gray-500 mb-10 max-w-lg mx-auto">
                                    Get an AI-powered comprehensive audit of your landing page focusing on clarity, layout, and trust.
                                </p>

                                <form onSubmit={handleAnalyze} className="relative max-w-lg mx-auto mb-12">
                                    <input
                                        type="url"
                                        placeholder="https://example.com"
                                        className="w-full pl-6 pr-32 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-lg shadow-sm"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        Audit <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>

                                <div className="border-t border-gray-100 pt-8">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Recent Analyses</h3>
                                    <div className="grid gap-3">
                                        {recentAudits.map(a => (
                                            <div key={a.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg text-sm group hover:bg-white hover:shadow-md transition-all cursor-default border border-transparent hover:border-gray-100">
                                                <span className="font-medium truncate max-w-[200px]">{a.url}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                                                        a.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                            a.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                    )}>
                                                        {a.status}
                                                    </span>
                                                    {a.score && <span className="font-bold text-gray-900">{a.score}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-8">
                                {status !== 'completed' && status !== 'failed' && (
                                    <div className="text-center py-20 bg-white rounded-2xl shadow-xl border border-gray-100">
                                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-6" />
                                        <h3 className="text-xl font-semibold mb-2">Analyzing {url}...</h3>
                                        <p className="text-gray-500">This involves capturing screenshots and running vision models.<br />It may take up to 30 seconds.</p>
                                    </div>
                                )}

                                {status === 'failed' && (
                                    <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center">
                                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-red-900 mb-2">Analysis Failed</h3>
                                        <p className="text-red-700 mb-6">{error}</p>
                                        <button onClick={reset} className="text-sm font-semibold text-red-600 hover:text-red-800 underline">Try Again</button>
                                    </div>
                                )}

                                {status === 'completed' && result && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-6"
                                    >
                                        <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                                            ← Analyze another
                                        </button>

                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                                                <div>
                                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Audit Report</h2>
                                                    <p className="text-gray-500 max-w-md">{result.summary_reasoning}</p>
                                                </div>
                                                <ScoreBadge score={result.overall_score} />
                                            </div>

                                            <div className="p-8 bg-gray-50/50">
                                                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                                    <AlertCircle className="w-5 h-5 text-red-500" /> Critical Issues
                                                </h3>
                                                <div className="grid gap-4">
                                                    {result.top_severe_issues?.map((issue, i) => (
                                                        <div key={i} className="bg-white p-6 rounded-xl border border-red-100 shadow-sm relative overflow-hidden">
                                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                                                            <div className="flex justify-between items-start mb-4">
                                                                <h4 className="font-bold text-gray-900 text-lg">{issue.title}</h4>
                                                                <span className={cn("px-2 py-1 rounded text-xs font-bold uppercase tracking-wide",
                                                                    issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                                                        issue.severity === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                                                                )}>
                                                                    {issue.severity} Severity
                                                                </span>
                                                            </div>

                                                            <div className="grid md:grid-cols-2 gap-6 mb-4">
                                                                <div>
                                                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Source Element</div>
                                                                    <div className="font-mono text-xs bg-gray-100 p-2 rounded text-gray-700 break-all border border-gray-200">
                                                                        {issue.evidence || "General Page Structure"}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Current State</div>
                                                                    <p className="text-sm text-gray-700">{issue.current_state || issue.description}</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                                                <div className="text-xs font-bold text-green-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                                                                    <Zap className="w-3 h-3" /> Recommended Fix
                                                                </div>
                                                                <p className="text-sm text-gray-800 font-medium">
                                                                    {issue.recommended_fix || issue.suggestion}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-8">
                                                <h3 className="text-lg font-bold text-gray-900 mb-6">Detailed Breakdown</h3>
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <CategoryList icon={Layout} title="Layout" items={result.category_breakdown?.layout} />
                                                    <CategoryList icon={Type} title="Clarity" items={result.category_breakdown?.clarity} />
                                                    <CategoryList icon={Navigation} title="Navigation" items={result.category_breakdown?.navigation} />
                                                    <CategoryList icon={Shield} title="Trust & Security" items={result.category_breakdown?.trust} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

function SystemStatus({ onBack }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/api/status')
            .then(res => setStats(res.data))
            .catch(err => setStats({ status: 'error', error: err.message }))
            .finally(() => setLoading(false));
    }, []);

    const StatusItem = ({ label, value, good, description }) => (
        <div className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
            <div>
                <span className="font-medium text-gray-700 block">{label}</span>
                <span className="text-xs text-gray-500">{description}</span>
            </div>
            <div className="flex items-center gap-2">
                {good ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                <span className={cn("text-sm font-semibold uppercase", good ? "text-green-700" : "text-yellow-700")}>
                    {(value === 'demo_mode' || value === 'missing_key') ? 'Demo Mode' : value}
                </span>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-xl mx-auto"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">System Status</h2>
                    <p className="text-xs text-gray-500 mt-1">Last Verified: {stats?.timestamp ? new Date(stats.timestamp).toLocaleTimeString() : 'Just now'}</p>
                </div>
                <button onClick={onBack} className="text-sm text-blue-600 hover:underline">Back to Home</button>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            ) : (
                <div className="space-y-3">
                    <StatusItem
                        label="Backend API"
                        description="Express server and API routes health check."
                        value={stats?.status || 'Error'}
                        good={stats?.status === 'ok'}
                    />
                    <StatusItem
                        label="Database (MongoDB)"
                        description="Connection pool to local MongoDB instance."
                        value={stats?.database || 'Disconnected'}
                        good={stats?.database === 'connected'}
                    />
                    <StatusItem
                        label="AI Engine (GPT-4)"
                        description={(stats?.llm === 'demo_mode' || stats?.llm === 'missing_key') ? 'Using synthetic responses (No API Key).' : 'Connected to OpenAI API.'}
                        value={stats?.llm || 'Config Error'}
                        good={stats?.llm === 'configured' || stats?.llm === 'demo_mode' || stats?.llm === 'missing_key'}
                    />
                </div>
            )}
        </motion.div>
    );
}

const CategoryList = ({ icon: Icon, title, items }) => (
    <div>
        <h4 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
            <Icon className="w-4 h-4 text-gray-400" /> {title}
        </h4>
        <ul className="space-y-3">
            {items?.map((item, i) => (
                <li key={i} className="text-sm">
                    <span className="font-medium text-gray-900 block mb-1">• {item.issue}</span>
                    <span className="text-gray-500">{item.impact}</span>
                </li>
            )) || <li className="text-sm text-gray-400 italic">No specific issues found.</li>}
        </ul>
    </div>
);
