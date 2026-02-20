import React, { useState } from 'react';
import { useRoadmapStore } from '../store/roadmapStore';
import { GitBranch, CheckSquare, List, ChevronDown, ChevronUp, CheckCircle, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Sidebar({ showCompleted = false }) {
  const navigate = useNavigate();
  const roadmaps = useRoadmapStore((state) => state.roadmaps);
  const setCurrentRoadmap = useRoadmapStore((state) => state.setCurrentRoadmap);
  const currentRoadmap = useRoadmapStore((state) => state.currentRoadmap);
  const [expandedNodes, setExpandedNodes] = useState(false);

  const filteredRoadmaps = roadmaps.filter(r =>
    showCompleted ? r.is_completed : !r.is_completed
  );

  const calculateProgress = (roadmap) => {
    const total = roadmap.nodes?.length || 0;
    const done = roadmap.marked_nodes?.length || 0;
    return total > 0 ? (done / total) * 100 : 0;
  };

  const handleRoadmapClick = (roadmap) => {
    setCurrentRoadmap(roadmaps.find(r => r.id === roadmap.id) || roadmap);
    navigate(`${showCompleted ? '/completed' : '/ongoing'}/${roadmap.id}`);
    setExpandedNodes(false);
  };

  const currentNodes = currentRoadmap?.nodes || [];
  const markedSet = new Set(currentRoadmap?.marked_nodes || []);
  const topicNodes = currentNodes.filter(n => {
    const vn = n.varName || n.id || '';
    return vn.length !== 2;
  });

  return (
    <div className="w-56 bg-white rounded-3xl border border-midnight/5 shadow-sm flex flex-col h-[calc(100vh-8rem)] flex-shrink-0">
      {/* Section label */}
      <div className="px-4 py-4 border-b border-sage flex-shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          {showCompleted
            ? <><CheckSquare className="h-3.5 w-3.5 text-coral" />Completed</>
            : <><GitBranch className="h-3.5 w-3.5 text-coral" />Ongoing</>}
        </p>
      </div>

      {/* Roadmap list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {filteredRoadmaps.length > 0 ? (
          filteredRoadmaps.map((roadmap) => {
            const progress = calculateProgress(roadmap);
            const isActive = currentRoadmap?.id === roadmap.id;

            return (
              <button
                key={roadmap.id}
                onClick={() => handleRoadmapClick(roadmap)}
                className={`w-full text-left px-3 py-3 rounded-2xl mb-1 transition-all
                  ${isActive
                    ? 'bg-coral/8 border border-coral/20'
                    : 'hover:bg-sage border border-transparent'}`}
                style={isActive ? { background: 'rgba(255,127,80,0.07)' } : {}}
              >
                <p className="text-sm font-semibold text-midnight truncate">{roadmap.skill}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{roadmap.target_level}</p>
                <div className="mt-2 bg-sage rounded-full h-1">
                  <div
                    className="h-1 rounded-full bg-coral transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-right text-xs text-slate-400 mt-1">{Math.round(progress)}%</p>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs px-3">
            <p>No {showCompleted ? 'completed' : 'ongoing'} roadmaps</p>
          </div>
        )}

        {/* Topic checklist */}
        {currentRoadmap && topicNodes.length > 0 && (
          <div className="mt-3 border-t border-sage pt-2">
            <button
              onClick={() => setExpandedNodes(v => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-midnight transition-colors"
            >
              <span className="flex items-center gap-1.5"><List className="h-3 w-3" />Topics</span>
              {expandedNodes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {expandedNodes && (
              <div className="space-y-0.5 pb-2 max-h-56 overflow-y-auto px-1">
                {topicNodes.map((node) => {
                  const nodeId = node.varName || node.id;
                  const done = markedSet.has(nodeId);
                  return (
                    <div key={nodeId} className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-sage transition-colors">
                      {done
                        ? <CheckCircle className="h-3.5 w-3.5 text-coral flex-shrink-0" />
                        : <Circle className="h-3.5 w-3.5 text-slate-200 flex-shrink-0" />}
                      <span className={`text-xs truncate ${done ? 'text-slate-400 line-through' : 'text-midnight'}`}>
                        {node.text || node.label || nodeId}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}