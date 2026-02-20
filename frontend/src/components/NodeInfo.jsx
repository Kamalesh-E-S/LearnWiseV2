import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { useRoadmapStore } from '../store/roadmapStore';
import api from '../lib/axios';

const parseDescription = (description) => {
  if (!description || typeof description !== 'string') return { text: '', ytLinks: [], siteLinks: [] };
  try {
    const ytMatch = description.match(/youtube links:\s*([^,]+(?:,\s*https?:\/\/[^,]+)*)/);
    const ytLinks = ytMatch ? ytMatch[1].split(',').map(l => l.trim()).filter(Boolean) : [];
    const siteMatch = description.match(/website links:\s*([^,]+(?:,\s*https?:\/\/[^,]+)*)/);
    const siteLinks = siteMatch ? siteMatch[1].split(',').map(l => l.trim()).filter(Boolean) : [];
    const text = description.split('youtube links:')[0].split('website links:')[0].trim();
    return { text, ytLinks, siteLinks };
  } catch {
    return { text: '', ytLinks: [], siteLinks: [] };
  }
};

const getLinkLabel = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
};

export function NodeInfo({ node, onComplete, onClose }) {
  const currentRoadmap = useRoadmapStore((state) => state.currentRoadmap);
  const setShowQuizFor = useRoadmapStore((s) => s.setShowQuizFor);
  const [attemptsInfo, setAttemptsInfo] = useState({ attempts: 0, best_score: null, best_total: null, passed: false });
  const [markingComplete, setMarkingComplete] = useState(false);

  if (!node?.data) {
    return (
      <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-sage z-40 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-sage">
          <span className="font-semibold text-midnight">Error</span>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
        </div>
        <div className="p-5 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />Invalid node data
        </div>
      </div>
    );
  }

  const nodeDescription = currentRoadmap?.node_desc?.[node.data.varName] || '';
  const { text, ytLinks, siteLinks } = parseDescription(nodeDescription);
  const varName = node?.data?.varName || '';
  const isVarNameTime = typeof varName === 'string' && varName.length === 2;
  const isLabelDay = /^day\s*\d+/i.test(node.data.label || '') || /^\d+$/.test((node.data.label || '').trim());
  const isDayNode = isVarNameTime || (node?.data?.level === 2 && isLabelDay);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const roadmapId = currentRoadmap?.id;
        const nodeId = node?.data?.varName || node?.id;
        if (!roadmapId || !nodeId) return;
        const res = await api.get('/quizzes/attempts', { params: { roadmap_id: roadmapId, node_id: nodeId } });
        if (mounted && res.data?.success) setAttemptsInfo(res.data.data || {});
      } catch { /* ignore */ }
    }
    load();
    return () => { mounted = false; };
  }, [currentRoadmap?.id, node]);

  const handleToggleComplete = async () => {
    if (!onComplete || markingComplete) return;
    setMarkingComplete(true);
    try { await onComplete(node.data.varName || node.data.id); }
    finally { setMarkingComplete(false); }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-sage z-40 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-sage flex items-center justify-between flex-shrink-0 bg-parchment/60">
        <h3 className="text-sm font-bold text-midnight truncate pr-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          {node.data.label || 'Untitled'}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-midnight transition-colors flex-shrink-0">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
            ${node.data.completed ? 'bg-coral/10 text-coral' : 'bg-sage text-slate-500'}`}>
            {node.data.completed
              ? <><CheckCircle className="h-3.5 w-3.5" />Completed</>
              : <><Circle className="h-3.5 w-3.5" />In Progress</>}
          </span>

          {!isDayNode && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowQuizFor(node.data.varName)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-midnight text-white hover:opacity-80 transition-opacity"
              >
                Quiz
              </button>
              <button
                onClick={handleToggleComplete}
                disabled={markingComplete}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50
                  ${node.data.completed
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-coral/10 text-coral hover:bg-coral/20'}`}
              >
                {markingComplete ? '…' : node.data.completed ? 'Unmark' : 'Mark Done'}
              </button>
            </div>
          )}
        </div>

        {/* Quiz stats */}
        {!isDayNode && (
          <div className="bg-sage rounded-2xl px-4 py-3 text-xs text-slate-500 flex gap-4">
            <span>Attempts: <strong className="text-midnight">{attemptsInfo.attempts}</strong></span>
            <span>Best: <strong className="text-midnight">{attemptsInfo.best_score !== null ? `${attemptsInfo.best_score}/${attemptsInfo.best_total}` : '—'}</strong></span>
            {attemptsInfo.passed && <span className="text-coral font-bold">✓ Passed</span>}
          </div>
        )}

        {/* Description */}
        {text && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">About</p>
            <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
          </div>
        )}

        {/* Resources */}
        {(ytLinks.length > 0 || siteLinks.length > 0) && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Resources</p>
            <div className="space-y-2">
              {ytLinks.map((link, i) => (
                <a key={`yt-${i}`} href={link.startsWith('http') ? link : `https://${link}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 hover:underline"
                >
                  <span>📺</span>
                  <span className="truncate">{getLinkLabel(link)}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                </a>
              ))}
              {siteLinks.map((link, i) => (
                <a key={`site-${i}`} href={link.startsWith('http') ? link : `https://${link}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-coral hover:text-coral/70 hover:underline"
                >
                  <span>🔗</span>
                  <span className="truncate">{getLinkLabel(link)}</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        )}

        {!text && ytLinks.length === 0 && siteLinks.length === 0 && !isDayNode && (
          <p className="text-sm text-slate-400 italic">No resources available for this node.</p>
        )}
      </div>
    </div>
  );
}