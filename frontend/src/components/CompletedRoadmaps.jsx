import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Trophy } from 'lucide-react';
import api from '../lib/axios';
import { Sidebar } from './Sidebar';
import { RoadmapViewer } from './RoadmapViewer';
import { useRoadmapStore } from '../store/roadmapStore';

export function CompletedRoadmaps() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const setRoadmaps = useRoadmapStore((state) => state.setRoadmaps);
  const setCurrentRoadmap = useRoadmapStore((state) => state.setCurrentRoadmap);
  const roadmaps = useRoadmapStore((state) => state.roadmaps);

  useEffect(() => { fetchCompletedRoadmaps(); }, []);
  useEffect(() => { if (id) fetchSingleRoadmap(id); }, [id]);

  const fetchSingleRoadmap = async (roadmapId) => {
    try {
      const res = await api.get(`/roadmap/${roadmapId}`);
      if (res.data.success && res.data.roadmap) {
        const r = res.data.roadmap;
        setCurrentRoadmap({ ...r, nodes: r.nodes || [], edges: r.edges || [], marked_nodes: r.marked_nodes || [], descriptions: r.descriptions || {}, node_desc: r.node_desc || {} });
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch roadmap');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletedRoadmaps = async () => {
    try {
      const res = await api.get('/roadmap/completed');
      if (res.data.roadmaps) {
        setRoadmaps(res.data.roadmaps.map(r => ({
          ...r, nodes: r.nodes || [], marked_nodes: r.marked_nodes || [], edges: r.edges || [], descriptions: r.descriptions || {}, node_desc: r.node_desc || {}
        })));
      }
    } catch (e) {
      setError(e.message || 'Failed to fetch roadmaps');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-72">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-coral border-t-transparent" />
    </div>
  );

  if (id) return (
    <div className="flex gap-6">
      <Sidebar showCompleted={true} />
      <div className="flex-1 min-w-0"><RoadmapViewer /></div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-midnight flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          <Trophy className="h-8 w-8 text-coral" />Your Achievements
        </h1>
        <p className="text-slate-500 mt-2">Skills you've mastered on your journey.</p>
      </div>

      {roadmaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 bg-white rounded-3xl border border-midnight/5 shadow-sm">
          <Trophy className="h-12 w-12 text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">No completed roadmaps yet.</p>
          <p className="text-slate-400 text-sm mt-1">Finish a roadmap to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roadmaps.map((roadmap) => (
            <div
              key={roadmap.id}
              onClick={() => {
                setCurrentRoadmap({ ...roadmap, nodes: roadmap.nodes || [], edges: roadmap.edges || [], marked_nodes: roadmap.marked_nodes || {}, node_desc: roadmap.node_desc || {} });
                navigate(`/completed/${roadmap.id}`);
              }}
              className="group bg-white rounded-3xl border border-midnight/5 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-bold text-midnight">{roadmap.skill}</h3>
                <CheckCircle className="h-5 w-5 text-coral flex-shrink-0" />
              </div>

              <div className="flex gap-3 text-xs text-slate-400 mb-4">
                <span>⏱ {roadmap.timeframe}</span>
                <span>🎯 {roadmap.target_level}</span>
              </div>

              {/* Full progress bar */}
              <div className="w-full bg-sage rounded-full h-1.5 mb-4">
                <div className="h-1.5 rounded-full bg-coral w-full" />
              </div>

              {roadmap.completed_at && (
                <p className="text-xs text-slate-400 mb-3">
                  Completed {new Date(roadmap.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}

              <div className="flex justify-end">
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-coral transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
