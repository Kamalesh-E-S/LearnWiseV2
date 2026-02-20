import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useRoadmapStore } from '../store/roadmapStore';
import Quiz from './Quiz';
import api from '../lib/axios';

// const parseDescription = (description) => {
//   if (!description || typeof description !== 'string') {
//     console.log('No description provided');
//     return { text: '', ytLinks: [], siteLinks: [] };
//   }
  
//   try {
//     console.log('Raw description:', description);
    
//     // Split by comma and get the description part
//     const parts = description.split(',');
//     const text = parts[0] || '';
//     console.log('Description text:', text);
    
//     // Extract links from the remaining part
//     const linksPart = parts[1] || '';
//     console.log('Links part:', linksPart);
    
//     // Extract all YouTube links
//     const ytMatch = linksPart.match(/youtube links:\s*([^,]+(?:\s*,\s*[^,]+)*)/);
//     console.log('YouTube match:', ytMatch);
//     const ytLinks = ytMatch 
//       ? ytMatch[1].split(',').map(link => link.trim())
//       : [];
//     console.log('Parsed YouTube links:', ytLinks);
    
//     // Extract all website links
//     const siteMatch = linksPart.match(/website links:\s*([^,]+(?:\s*,\s*[^,]+)*)/);
//     console.log('Website match:', siteMatch);
//     const siteLinks = siteMatch 
//       ? siteMatch[1].split(',').map(link => link.trim())
//       : [];
//     console.log('Parsed website links:', siteLinks);
    
//     return {
//       text: text.trim(),
//       ytLinks,
//       siteLinks
//     };
//   } catch (error) {
//     console.error('Error parsing description:', error);
//     return { text: '', ytLinks: [], siteLinks: [] };
//   }
// };

// const parseDescription = (description) => {
//   if (!description || typeof description !== 'string') {
//     console.log('No description provided');
//     return { text: '', ytLinks: [], siteLinks: [] };
//   }

//   try {
//     console.log('Raw description:', description);

//     // Extract YouTube links
//     const ytMatch = description.match(/youtube links:\s*([^,]+(?:\s*,\s*[^,]+)*)/);
//     const ytLinks = ytMatch ? ytMatch[1].split(',').map(link => link.trim()) : [];

//     // Extract Website links
//     const siteMatch = description.match(/website links:\s*([^,]+(?:\s*,\s*[^,]+)*)/);
//     const siteLinks = siteMatch ? siteMatch[1].split(',').map(link => link.trim()) : [];

//     // Remove extracted links from the description to get pure text
//     let text = description
//       .replace(/youtube links:.*$/, '') // Remove everything after 'youtube links'
//       .replace(/website links:.*$/, '') // Remove everything after 'website links'
//       .trim(); 

//     return { text, ytLinks, siteLinks };
//   } catch (error) {
//     console.error('Error parsing description:', error);
//     return { text: '', ytLinks: [], siteLinks: [] };
//   }
// };

const parseDescription = (description) => {
  if (!description || typeof description !== 'string') {
    console.log('No description provided');
    return { text: '', ytLinks: [], siteLinks: [] };
  }

  try {
    console.log('Raw description:', description);

    // Extract YouTube links
    const ytMatch = description.match(/youtube links:\s*([^,]+(?:,\s*https?:\/\/[^,]+)*)/);
    const ytLinks = ytMatch ? ytMatch[1].split(',').map(link => link.trim()) : [];

    // Extract Website links
    const siteMatch = description.match(/website links:\s*([^,]+(?:,\s*https?:\/\/[^,]+)*)/);
    const siteLinks = siteMatch ? siteMatch[1].split(',').map(link => link.trim()) : [];

    // Extract text before 'youtube links' or 'website links'
    let text = description.split('youtube links:')[0].split('website links:')[0].trim();

    return { text, ytLinks, siteLinks };
  } catch (error) {
    console.error('Error parsing description:', error);
    return { text: '', ytLinks: [], siteLinks: [] };
  }
};

export function NodeInfo({ node, onComplete, onClose }) {
  const currentRoadmap = useRoadmapStore((state) => state.currentRoadmap);
  const setShowQuizFor = useRoadmapStore((s) => s.setShowQuizFor);
  const quizRefreshKey = useRoadmapStore((s) => s.quizRefreshKey);
  const [attemptsInfo, setAttemptsInfo] = useState({ attempts: 0, best_score: null, best_total: null, passed: false });

  if (!node?.data) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-40">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Error</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Invalid node data</span>
          </div>
        </div>
      </div>
    );
  }

  // Get node description from node_desc
  console.log('Current roadmap:', currentRoadmap);
  console.log('Node varName:', node.data.varName);
  console.log('Node descriptions:', currentRoadmap?.descriptions);
  console.log('Node node_desc:', currentRoadmap?.node_desc);
  
  const nodeDescription = currentRoadmap?.node_desc?.[node.data.varName] || '';
  console.log('Node description:', nodeDescription);
  
  const { text, ytLinks, siteLinks } = parseDescription(nodeDescription);
  console.log('Parsed result:', { text, ytLinks, siteLinks });

  // Determine if this node is a "day" time node.
  // Use varName length === 2 (e.g., 'a4', 'b6') as primary heuristic for level-2/time nodes,
  // fall back to level === 2 and label patterns if varName unavailable.
  const varName = node?.data?.varName || '';
  const isVarNameTime = typeof varName === 'string' && varName.length === 2;
  const isLabelDay = /^day\s*\d+/i.test(node.data.label || '') || /^\d+$/.test((node.data.label || '').trim());
  const isDayNode = isVarNameTime || (node?.data?.level === 2 && isLabelDay);

  // fetch attempts info when NodeInfo mounts
  React.useEffect(() => {
    let mounted = true;
    async function loadAttempts() {
      try {
        const roadmapId = currentRoadmap?.id;
        // prefer varName as node identifier (matches how quizzes are generated)
        const nodeId = node?.data?.varName || node?.id;
        if (!roadmapId || !nodeId) return;
        const res = await api.get('/quizzes/attempts', { params: { roadmap_id: roadmapId, node_id: nodeId } });
        if (mounted && res.data && res.data.success) {
          setAttemptsInfo(res.data.data || {});
        }
      } catch (e) {
        console.error('Failed to load attempts', e);
      }
    }

    loadAttempts();
    return () => { mounted = false; };
  }, [currentRoadmap?.id, node, currentRoadmap?.marked_nodes, quizRefreshKey]);

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-40 transform transition-transform">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Node Details</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <p className="mt-1 text-lg font-medium">{node.data.label || 'Untitled'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Variable Name</label>
            <p className="mt-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded">{node.data.varName || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <div className="mt-1 flex items-center justify-between">
              <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${node.data.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {node.data.completed ? 'Completed' : 'In Progress'}
              </p>
              <div className="flex items-center gap-3">
                {!isDayNode && (
                  <>
                <button
                  onClick={() => setShowQuizFor(node.data.varName)}
                  className="ml-3 px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  Take Quiz
                </button>
                
                <div className="text-xs text-gray-600">
                  <div>Attempts: {attemptsInfo.attempts}</div>
                  <div>Best: {attemptsInfo.best_score !== null ? `${attemptsInfo.best_score}/${attemptsInfo.best_total}` : 'N/A'}</div>
                </div>
              </>
                )}
              </div>
              {/* <button
                onClick={() => onComplete(node.data.id)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors
                  ${node.data.completed 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
              >
                {node.data.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </button> */}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="mt-1 text-sm text-gray-600">
              {text || 'No description available.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Resources</label>
            <div className="mt-2 space-y-2">
              {ytLinks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Video Tutorials:</p>
                  {ytLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.startsWith('http') ? link : `https://${link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      📺 Watch Tutorial Video {index + 1}
                    </a>
                  ))}
                </div>
              )}
              {siteLinks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Web Resources:</p>
                  {siteLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.startsWith('http') ? link : `https://${link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:text-blue-800"
                    >
                      🔗 Visit Resource Website {index + 1}
                    </a>
                  ))}
                </div>
              )}
              {ytLinks.length === 0 && siteLinks.length === 0 && (
                <p className="text-sm text-gray-500 italic">No external resources available.</p>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Quiz modal rendered at top-level via store in RoadmapViewer */}
    </div>
  );
}