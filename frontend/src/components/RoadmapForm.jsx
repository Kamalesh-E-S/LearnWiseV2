import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoadmapStore } from '../store/roadmapStore';
import { Brain, Clock, BookOpen, Target, X, Loader, ArrowRight } from 'lucide-react';
import api from '../lib/axios';

const LEVELS = ['Get Started', 'Beginner', 'Intermediate', 'Advanced', 'Master'];

const inputCls = 'w-full rounded-xl border border-midnight/10 bg-sage/40 px-4 py-2.5 text-sm text-midnight placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral/40 focus:border-coral/40 transition';

export function RoadmapForm() {
  const navigate = useNavigate();
  const [skill, setSkill] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [currentKnowledge, setCurrentKnowledge] = useState('');
  const [targetLevel, setTargetLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const roadmaps = useRoadmapStore((state) => state.roadmaps);
  const setRoadmaps = useRoadmapStore((state) => state.setRoadmaps);
  const setCurrentRoadmap = useRoadmapStore((state) => state.setCurrentRoadmap);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const isDuplicate = roadmaps.some(r => r.skill.toLowerCase() === skill.toLowerCase());
    if (isDuplicate) {
      setError('A roadmap for this skill already exists.');
      setLoading(false);
      return;
    }

    try {
      const createResponse = await api.post('/roadmap/create', {
        skill, timeframe,
        current_knowledge: currentKnowledge,
        target_level: targetLevel
      }, { timeout: 60000 });

      if (!createResponse.data.success) {
        setError(createResponse.data.error || 'Failed to create roadmap');
        return;
      }

      const newRoadmap = createResponse.data.roadmap;
      const isDuplicateAfter = roadmaps.some(r => r.id === newRoadmap.id);
      if (!isDuplicateAfter) {
        const processed = {
          ...newRoadmap,
          nodes: newRoadmap.nodes || [],
          edges: newRoadmap.edges || [],
          marked_nodes: newRoadmap.marked_nodes || [],
          descriptions: newRoadmap.descriptions || {},
          markmap: newRoadmap.markmap || ''
        };
        setRoadmaps([...roadmaps, processed]);
        setCurrentRoadmap(processed);
        if (newRoadmap?.id) navigate(`/ongoing/${String(newRoadmap.id)}`, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-midnight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Craft Your Roadmap
        </h1>
        <p className="text-slate-500 mt-2">Tell us what you want to master and we'll build a personalised path.</p>
      </div>

      <div className="bg-white rounded-3xl border border-midnight/5 shadow-sm p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <X className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Skill */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
              <Brain className="h-4 w-4 text-coral" />Skill to Learn
            </label>
            <input
              type="text"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className={inputCls}
              placeholder="e.g., React Development"
              required
            />
          </div>

          {/* Timeframe */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
              <Clock className="h-4 w-4 text-coral" />Timeframe
            </label>
            <input
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className={inputCls}
              placeholder="e.g., 3 months"
              required
            />
          </div>

          {/* Current knowledge */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
              <BookOpen className="h-4 w-4 text-coral" />Current Knowledge
            </label>
            <textarea
              value={currentKnowledge}
              onChange={(e) => setCurrentKnowledge(e.target.value)}
              className={inputCls}
              rows={3}
              placeholder="Describe what you already know..."
              required
            />
          </div>

          {/* Target level */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-midnight mb-1.5">
              <Target className="h-4 w-4 text-coral" />Target Level
            </label>
            <select
              value={targetLevel}
              onChange={(e) => setTargetLevel(e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Select a level</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-coral text-white font-semibold py-3.5 rounded-full hover:opacity-90 transition-all disabled:opacity-50 shadow-sm mt-2"
            style={!loading ? { boxShadow: '0 8px 24px rgba(255,127,80,0.25)' } : {}}
          >
            {loading ? (
              <><Loader className="h-4 w-4 animate-spin" />Generating your roadmap…</>
            ) : (
              <><Brain className="h-4 w-4" />Generate Roadmap<ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        {loading && (
          <div className="rounded-2xl bg-sage/60 border border-sage px-5 py-4 text-sm text-slate-600">
            <p className="font-medium text-midnight mb-1">⏳ AI is building your roadmap…</p>
            <p>This usually takes 30–60 seconds. Hang tight while we curate your personalised path.</p>
          </div>
        )}
      </div>
    </div>
  );
}