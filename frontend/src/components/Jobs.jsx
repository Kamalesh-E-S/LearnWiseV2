import React, { useEffect, useState } from 'react';
import { Briefcase, DollarSign, MapPin, Tag } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

export function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completedSkills, setCompletedSkills] = useState([]);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      fetchJobRecommendations();
    }
  }, [isAuthenticated]);

  const fetchJobRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/roadmap/jobs/recommendations');
      
      if (response.data.success) {
        setJobs(response.data.jobs || []);
        setCompletedSkills(response.data.completed_skills || []);
      } else {
        setError(response.data.message || 'Failed to fetch job recommendations');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err.response?.data?.detail || 'Failed to fetch job recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getJobTypeColor = (jobType) => {
    switch (jobType.toLowerCase()) {
      case 'full-time':
        return 'bg-green-100 text-green-800';
      case 'part-time':
        return 'bg-blue-100 text-blue-800';
      case 'contract':
        return 'bg-yellow-100 text-yellow-800';
      case 'remote':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'entry-level':
      case 'entry level':
        return 'bg-green-50 border-green-200';
      case 'mid-level':
      case 'mid level':
        return 'bg-blue-50 border-blue-200';
      case 'senior':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-12">Job Opportunities</h1>
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Opportunities</h1>
          {completedSkills.length > 0 && (
            <p className="text-gray-600 text-lg">
              Recommended jobs based on your completed skills: <span className="font-semibold text-blue-600">{completedSkills.join(', ')}</span>
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {jobs.length === 0 && !error && (
          <div className="text-center py-24 bg-gray-50 rounded-lg">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              Complete your first learning roadmap to unlock job recommendations!
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, index) => (
            <div
              key={index}
              className={`rounded-lg border-2 p-6 hover:shadow-lg transition-shadow ${getLevelColor(job.level)}`}
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                    <p className="text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" />
                      {job.company}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getJobTypeColor(job.job_type)}`}>
                    {job.job_type}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-700 text-sm mb-4 line-clamp-3">{job.description}</p>

              {/* Salary and Level */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-1 text-gray-700">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold text-sm">{job.salary_range}</span>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-200 text-gray-700">
                  {job.level}
                </span>
              </div>

              {/* Required Skills */}
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Required Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills && job.required_skills.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
