import React, { useEffect, useState, useRef } from 'react';
import { Briefcase, DollarSign, MapPin, Tag, Search, RefreshCw, X, ArrowRight, Sparkles, ExternalLink } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

/* ── Badge colours ─────────────────────────────────────────────── */
const JOB_TYPE_STYLES = {
  'full-time': 'bg-green-50  text-green-700  border-green-200',
  'part-time': 'bg-sage      text-midnight   border-sage',
  'contract': 'bg-amber-50  text-amber-700  border-amber-200',
  'remote': 'bg-coral/10  text-coral      border-coral/20',
};

const SOURCE_STYLES = {
  'LinkedIn': 'bg-blue-50   text-blue-600   border-blue-200',
  'Naukri': 'bg-orange-50 text-orange-600  border-orange-200',
  'AI-generated': 'bg-sage      text-slate-500   border-sage',
};

const POPULAR_SKILLS = [
  'Python', 'React', 'Machine Learning', 'Data Science',
  'Node.js', 'SQL', 'DevOps', 'UI/UX Design', 'Java', 'Cybersecurity',
];

export function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceLabel, setSourceLabel] = useState('');   // human-readable origin of results
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState(null); // skill being searched manually
  const [mode, setMode] = useState('auto');              // 'auto' | 'search'
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const inputRef = useRef(null);

  /* Load auto-recommendations on mount */
  useEffect(() => {
    if (isAuthenticated) fetchRecommendations();
  }, [isAuthenticated]);

  /* ── Auto-recommendation (from user's own roadmaps) ─────────── */
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    setMode('auto');
    setActiveSearch(null);
    try {
      const res = await api.get('/roadmap/jobs/recommendations', { timeout: 60000 });
      if (res.data.success) {
        setJobs(res.data.jobs || []);
        const skills = res.data.skills || res.data.completed_skills || [];
        if (skills.length > 0) {
          setSourceLabel(`Live jobs matched to: ${skills.join(', ')}`);
        } else {
          // No roadmaps yet — auto-search a popular skill to show something real
          setSourceLabel('No roadmaps yet — showing trending tech jobs');
          await handleSearch('Software Engineer');
        }
      } else {
        setError(res.data.message || 'Could not load jobs right now.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || '';
      setError(msg || 'Could not reach the job boards. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Free-form skill search ─────────────────────────────────── */
  const handleSearch = async (skill) => {
    if (!skill?.trim()) return;
    setLoading(true);
    setError(null);
    setMode('search');
    setActiveSearch(skill.trim());
    try {
      const res = await api.post('/roadmap/jobs/search', { skill: skill.trim() }, { timeout: 60000 });
      if (res.data.success) {
        setJobs(res.data.jobs || []);
        setSourceLabel(`Jobs for: "${res.data.skill}"`);
      } else {
        setError('No jobs found for that skill.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setActiveSearch(null);
    fetchRecommendations();
    inputRef.current?.focus();
  };

  const jobTypeCls = (type) =>
    `text-xs font-semibold px-2.5 py-1 rounded-full border ${JOB_TYPE_STYLES[type?.toLowerCase()] ?? 'bg-sage text-midnight border-sage'
    }`;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1
          className="text-4xl font-bold text-midnight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Job Opportunities
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Discover roles that match any skill — yours or any you're curious about.
        </p>
      </div>

      {/* ── Search bar ──────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-midnight/5 shadow-sm p-5 mb-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5" />Search any skill
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g., Python, React, Data Science…"
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-full border border-midnight/10 bg-sage/40 text-midnight placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral/30 transition"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-midnight"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!searchInput.trim() || loading}
            className="px-5 py-2.5 bg-coral text-white text-sm font-semibold rounded-full hover:opacity-90 disabled:opacity-40 transition-all shadow-sm flex items-center gap-2"
          >
            <Search className="h-4 w-4" />Find Jobs
          </button>
        </form>

        {/* Popular skill chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {POPULAR_SKILLS.map((s) => (
            <button
              key={s}
              onClick={() => { setSearchInput(s); handleSearch(s); }}
              className={`text-xs px-3 py-1 rounded-full border transition-all
                ${activeSearch === s
                  ? 'bg-coral text-white border-coral'
                  : 'bg-sage text-slate-600 border-midnight/5 hover:border-coral/40 hover:text-coral'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Source label + refresh ───────────────────────────────── */}
      {!loading && (
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-coral" />
            {sourceLabel || 'Live jobs from LinkedIn & Naukri'}
          </p>
          <div className="flex gap-2">
            {mode === 'search' && (
              <button
                onClick={clearSearch}
                className="text-xs text-slate-400 hover:text-midnight flex items-center gap-1 transition-colors"
              >
                <X className="h-3.5 w-3.5" />Clear search
              </button>
            )}
            <button
              onClick={mode === 'search' && activeSearch ? () => handleSearch(activeSearch) : fetchRecommendations}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-coral border border-midnight/10 bg-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />Refresh
            </button>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────── */}
      {error && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-medium text-amber-800 mb-1">⚠️ Could not load live jobs</p>
          <p className="text-sm text-amber-700 mb-3">{error}</p>
          <button
            onClick={mode === 'search' && activeSearch ? () => handleSearch(activeSearch) : fetchRecommendations}
            className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 border border-amber-300 px-3 py-1.5 rounded-full hover:bg-amber-100 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />Try Again
          </button>
        </div>
      )}


      {/* ── Loading ───────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-60 bg-white rounded-3xl border border-midnight/5">
          <div className="h-8 w-8 rounded-full border-2 border-coral border-t-transparent animate-spin mb-3" />
          <p className="text-sm font-medium text-midnight">Fetching live jobs…</p>
          <p className="text-xs text-slate-400 mt-1">Scraping LinkedIn &amp; Naukri — takes ~10–20s</p>
        </div>
      )}


      {/* ── Empty state ──────────────────────────────────────────── */}
      {!loading && jobs.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center h-56 bg-white rounded-3xl border border-midnight/5 text-center px-6">
          <Briefcase className="h-12 w-12 text-slate-200 mb-4" />
          <p className="text-slate-600 font-medium">No jobs found yet</p>
          <p className="text-slate-400 text-sm mt-1">
            Search a skill above or start a roadmap to get personalised recommendations.
          </p>
        </div>
      )}

      {/* ── Job grid ─────────────────────────────────────────────── */}
      {!loading && jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-midnight/5 shadow-sm p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Source badge + job type */}
              <div className="flex items-center justify-between gap-2 mb-2">
                {job.source && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SOURCE_STYLES[job.source] ?? 'bg-sage text-slate-500 border-sage'
                    }`}>
                    {job.source}
                  </span>
                )}
                {job.job_type && <span className={jobTypeCls(job.job_type)}>{job.job_type}</span>}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-midnight leading-snug mb-1">{job.title}</h3>

              {/* Company + location */}
              <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                <MapPin className="h-3.5 w-3.5" />{job.company}{job.location ? ` · ${job.location}` : ''}
              </p>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3 mb-4 flex-1">
                {job.description}
              </p>

              {/* Salary + level */}
              <div className="flex items-center justify-between py-3 border-t border-sage mb-4 text-sm">
                <span className="flex items-center gap-1 font-semibold text-midnight">
                  <DollarSign className="h-3.5 w-3.5 text-coral" />{job.salary_range}
                </span>
                {job.level && (
                  <span className="px-2.5 py-0.5 rounded-full bg-sage text-xs font-semibold text-slate-500">
                    {job.level}
                  </span>
                )}
              </div>

              {/* Required skills */}
              {job.required_skills?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 flex items-center gap-1 mb-2">
                    <Tag className="h-3.5 w-3.5" />Required Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.required_skills.map((s, si) => (
                      <button
                        key={si}
                        onClick={() => { setSearchInput(s); handleSearch(s); }}
                        className="px-2 py-0.5 bg-coral/10 text-coral text-xs rounded-full font-medium hover:bg-coral/20 transition-colors flex items-center gap-1"
                        title={`Search jobs for "${s}"`}
                      >
                        {s}
                        <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply button */}
              {job.job_url && (
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-full border border-coral text-coral text-xs font-semibold hover:bg-coral hover:text-white transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />Apply Now
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
