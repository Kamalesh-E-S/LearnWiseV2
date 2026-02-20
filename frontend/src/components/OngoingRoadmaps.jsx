import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Trash2, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import api from '../lib/axios';
import { Sidebar } from './Sidebar';
import { RoadmapViewer } from './RoadmapViewer';
import { useRoadmapStore } from '../store/roadmapStore';

export function OngoingRoadmaps() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const setRoadmaps = useRoadmapStore((state) => state.setRoadmaps);
  const setCurrentRoadmap = useRoadmapStore((state) => state.setCurrentRoadmap);
  const roadmaps = useRoadmapStore((state) => state.roadmaps);

  useEffect(() => { fetchOngoingRoadmaps(); }, []);

  useEffect(() => {
    if (id) {
      const numericId = parseInt(id, 10);
      const roadmap = useRoadmapStore.getState().roadmaps.find(r => r.id === numericId);
      if (roadmap) setCurrentRoadmap({ ...roadmap, nodes: roadmap.nodes || [], edges: roadmap.edges || [], marked_nodes: roadmap.marked_nodes || [] });
    }
  }, [id, setCurrentRoadmap]);

  const fetchOngoingRoadmaps = async () => {
    try {
      const response = await api.get('/roadmap/ongoing');
      if (response.data.roadmaps) {
        const processed = response.data.roadmaps.map(r => ({
          ...r, nodes: r.nodes || [], marked_nodes: r.marked_nodes || [], edges: r.edges || [], descriptions: r.descriptions || {}
        }));
        setRoadmaps(processed);
        if (id) {
          const numericId = parseInt(id, 10);
          const current = processed.find(r => r.id === numericId);
          if (current) setCurrentRoadmap(current);
        }
      } else {
        setError('No roadmaps data in response');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, roadmapId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this roadmap? This cannot be undone.')) return;
    setDeletingId(roadmapId);
    try {
      await api.delete(`/roadmap/${roadmapId}`);
      setRoadmaps(useRoadmapStore.getState().roadmaps.filter(r => r.id !== roadmapId));
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRoadmaps = roadmaps.filter(r =>
    r.skill?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-72">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-coral border-t-transparent" />
    </div>
  );

  if (id) return (
    <div className="flex gap-6">
      <Sidebar />
      <div className="flex-1 min-w-0"><RoadmapViewer /></div>
    </div>
  );

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-4xl font-bold text-midnight" style={{ fontFamily: "'Playfair Display', serif" }}>
          My Roadmaps
        </h1>
        <div className="relative w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-midnight/10 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-coral/30"
          />
        </div>
      </div>

      {filteredRoadmaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-72 bg-white rounded-3xl border border-midnight/5 shadow-sm">
          <BookOpen className="h-12 w-12 text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">
            {search ? 'No results found.' : 'No ongoing roadmaps yet.'}
          </p>
          {!search && <p className="text-slate-400 text-sm mt-1">Click "+ New Roadmap" to get started.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRoadmaps.map((roadmap) => {
            const total = roadmap.nodes?.length || 0;
            const completed = roadmap.marked_nodes?.length || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const done = pct === 100;

            return (
              <div
                key={roadmap.id}
                onClick={() => {
                  setCurrentRoadmap({ ...roadmap, nodes: roadmap.nodes || [], edges: roadmap.edges || [], marked_nodes: roadmap.marked_nodes || [] });
                  navigate(`/ongoing/${roadmap.id}`);
                }}
                className="group relative bg-white rounded-3xl border border-midnight/5 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* Delete */}
                <button
                  onClick={(e) => handleDelete(e, roadmap.id)}
                  disabled={deletingId === roadmap.id}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {/* Done badge */}
                {done && <span className="absolute top-4 left-4"><CheckCircle className="h-5 w-5 text-coral" /></span>}

                <div className={done ? 'pt-4' : ''}>
                  <h3 className="text-lg font-bold text-midnight mb-1 pr-8">{roadmap.skill}</h3>
                  <div className="flex gap-3 text-xs text-slate-400 mb-5">
                    <span>⏱ {roadmap.timeframe}</span>
                    <span>🎯 {roadmap.target_level}</span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                      <span>{completed}/{total} topics</span>
                      <span className="font-semibold text-coral">{pct}%</span>
                    </div>
                    <div className="w-full bg-sage rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-coral transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-coral transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
