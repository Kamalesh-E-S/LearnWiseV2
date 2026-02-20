import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls,
  ReactFlowProvider,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRoadmapStore } from '../store/roadmapStore';
import { parseMarkmapToFlow } from '../utils/mermaidToFlow';
import RoadmapNode from './RoadmapNode';
import { NodeInfo } from './NodeInfo';
import { ZoomIn, ZoomOut, Maximize2, Trophy, Loader, X, Save } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/axios';
import Quiz from './Quiz';

const nodeTypes = {
  custom: RoadmapNode
};

const defaultEdgeOptions = {
  type: 'default',
  style: { 
    stroke: '#64748b', 
    strokeWidth: 2,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#64748b',
    width: 20,
    height: 20
  }
};

export function RoadmapViewer() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const currentRoadmap = useRoadmapStore((state) => state.currentRoadmap);
  const setCurrentRoadmap = useRoadmapStore((state) => state.setCurrentRoadmap);
  const showQuizFor = useRoadmapStore((s) => s.showQuizFor);
  const setShowQuizFor = useRoadmapStore((s) => s.setShowQuizFor);

  useEffect(() => {
    if (currentRoadmap) {
      const { nodes: flowNodes, edges: flowEdges } = parseMarkmapToFlow(currentRoadmap.markmap);
      
      // Update nodes with completion status from marked_nodes
      const updatedNodes = flowNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          completed: currentRoadmap.marked_nodes?.includes(node.id) || false
        }
      }));
      
      setNodes(updatedNodes);
      setEdges(flowEdges);
      
      // Set completion message based on is_completed
      setShowCompletionMessage(currentRoadmap.is_completed || false);
    }
  }, [currentRoadmap]);

  // Add this useEffect to handle completion message based on route
  useEffect(() => {
    if (currentRoadmap) {
      // Only show completion message if we're in the ongoing page and roadmap is completed
      const isOngoingPage = location.pathname.includes('/ongoing');
      setShowCompletionMessage(isOngoingPage && currentRoadmap.is_completed);
    }
  }, [currentRoadmap, location.pathname]);

  const loadRoadmap = async (roadmapId) => {
    setLoading(true);
    setError('');
    try {
      // Fix: Use the correct endpoint path
      const response = await api.get(`/roadmap/${roadmapId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to load roadmap');
      }

      const roadmapData = response.data.roadmap;
      
      // Ensure nodes have their completed status from marked_nodes
      if (roadmapData?.nodes && Array.isArray(roadmapData.marked_nodes)) {
        roadmapData.nodes = roadmapData.nodes.map(node => ({
          ...node,
          completed: roadmapData.marked_nodes.includes(node.id)
        }));
      }

      setCurrentRoadmap(roadmapData);
    } catch (err) {
      setError(err.message || 'Failed to load roadmap');
      console.error('Error loading roadmap:', err);
    } finally {
      setLoading(false);
    }
  };
  // Add this useEffect to trigger save when completion message shows
useEffect(() => {
  // Only save if completion message is shown and we're on the ongoing page
  if (showCompletionMessage && location.pathname.includes('/ongoing')) {
    console.log("Completion popup shown - triggering automatic save");
    handleSave().catch(error => {
      console.error("Auto-save on completion failed:", error);
      setError("Failed to save completion status");
    });
  }
}, [showCompletionMessage]);
  useEffect(() => {
    if (id && !currentRoadmap) {
      loadRoadmap(id);
    }
  }, [id, currentRoadmap]);
// Add this useEffect to reset the completion message when navigating away
useEffect(() => {
  // Cleanup function that runs when component unmounts
  return () => {
    setShowCompletionMessage(false);
  };
}, []);
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeComplete = async (nodeId) => {
    if (!currentRoadmap?.nodes) return;
  
    try {
      // Get current marked nodes
      const currentMarkedNodes = currentRoadmap.marked_nodes || [];
      
      // Toggle the node's completion status
      const isCurrentlyCompleted = currentMarkedNodes.includes(nodeId);
      let newMarkedNodes = isCurrentlyCompleted 
        ? currentMarkedNodes.filter(id => id !== nodeId)
        : [...currentMarkedNodes, nodeId];

      // Build adjacency map from edges to determine descendants
      const adj = {};
      edges.forEach(e => {
        if (!adj[e.source]) adj[e.source] = [];
        adj[e.source].push(e.target);
      });

      const getDescendants = (startId) => {
        const visited = new Set();
        const stack = [startId];
        const descendants = [];
        while (stack.length) {
          const cur = stack.pop();
          const children = adj[cur] || [];
          children.forEach(ch => {
            if (!visited.has(ch)) {
              visited.add(ch);
              descendants.push(ch);
              stack.push(ch);
            }
          });
        }
        return descendants;
      };

      // Auto-mark or unmark level-2 (time/day) nodes based on their descendants
      const markedSet = new Set(newMarkedNodes);
      // use the flow nodes (which include level) to find level-2 nodes
      nodes.forEach(n => {
        // treat as time/day node if varName length==2 (e.g., 'a4','a6') or level===2
        const nVar = n?.data?.varName || '';
        const isTimeNode = (typeof nVar === 'string' && nVar.length === 2) || n?.data?.level === 2;
        if (isTimeNode) {
          const desc = getDescendants(n.id).filter(d => d !== n.id);
          if (desc.length === 0) return; // nothing to base on
          const allDone = desc.every(d => markedSet.has(d));
          if (allDone) markedSet.add(n.id);
          else markedSet.delete(n.id);
        }
      });

      newMarkedNodes = Array.from(markedSet);
      
      // Calculate completion percentage
      const totalNodes = currentRoadmap.nodes.length;
      const completedNodes = newMarkedNodes.length;
      const completionPercentage = (completedNodes / totalNodes) * 100;
      
      // Check if roadmap is completed (100%)
      const isCompleted = completionPercentage >= 100;
      
      // Update local state first for immediate feedback
      const updatedRoadmap = {
        ...currentRoadmap,
        nodes: currentRoadmap.nodes.map(node => ({
          ...node,
          completed: newMarkedNodes.includes(node.id)
        })),
        marked_nodes: newMarkedNodes,
        is_completed: isCompleted
      };
      setCurrentRoadmap(updatedRoadmap);
      
      // Update ReactFlow nodes
      setNodes(prevNodes => 
        prevNodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            completed: newMarkedNodes.includes(node.id)
          }
        }))
      );
      

    } catch (error) {
      console.error('Error updating node:', error);
      setError('Failed to update node');
    }
  };

  const handleSave = async () => {
    if (!currentRoadmap) {
      setError('No roadmap data available to save');
      return;
    }
    
    setIsSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      // Ensure we have a valid roadmap ID
      const roadmapId = currentRoadmap.id;
      if (!roadmapId) {
        throw new Error('Invalid roadmap ID');
      }

      // Get current state of nodes
      const markedNodes = nodes
        .filter(node => node.data.completed)
        .map(node => node.id);

      // Calculate completion status
      const totalNodes = nodes.length;
      const completedNodes = markedNodes.length;
      const isCompleted = totalNodes > 0 && completedNodes === totalNodes;

      // Log the data being sent
      console.log('Saving roadmap data:', {
        roadmapId,
        markedNodes,
        isCompleted
      });

      // Send update to backend
      const response = await api.put(`/roadmap/${roadmapId}/progress`, {
        marked_nodes: markedNodes,
        is_completed: isCompleted
      });

      // Log the response
      console.log('Save response:', response.data);

      if (response.data.success) {
        setSaveSuccess(true);
        // Update local state with response data
        const backendRoadmap = {
          ...currentRoadmap,
          nodes: response.data.data.nodes,
          marked_nodes: response.data.data.marked_nodes,
          is_completed: response.data.data.is_completed
        };
        setCurrentRoadmap(backendRoadmap);
      } else {
        throw new Error(response.data.error || 'Failed to save roadmap progress');
      }
    } catch (error) {
      console.error('Error saving roadmap:', error);
      // More detailed error message
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to save roadmap progress';
      setError(`Error saving progress: ${errorMessage}`);
      
      // Show error in UI for 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setIsSaving(false);
      // Reset success message after 3 seconds
      if (saveSuccess) {
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-white rounded-lg shadow-md">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!currentRoadmap) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-white rounded-lg shadow-md">
        <div className="text-center">
          <Loader className="h-12 w-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  // Calculate completion percentage from marked_nodes
  const completionPercentage = currentRoadmap && currentRoadmap.nodes.length > 0
    ? (currentRoadmap.marked_nodes?.length || 0) / currentRoadmap.nodes.length * 100
    : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600">
            <X className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{currentRoadmap.skill} Roadmap</h2>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${
              isSaving 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : saveSuccess
                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            } transition-colors duration-200`}
          >
            <Save className="h-5 w-5" />
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Progress'}
          </button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {completionPercentage.toFixed(0)}% Complete
            </p>
          </div>
          {showCompletionMessage && (
            <div className="flex items-center gap-2 text-green-600">
              <Trophy className="h-5 w-5" />
              <span>Roadmap Completed!</span>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600">
          <p>Timeframe: {currentRoadmap.timeframe}</p>
          <p>Current Level: {currentRoadmap.current_knowledge}</p>
          <p>Target Level: {currentRoadmap.target_level}</p>
        </div>
      </div>

      <div className="h-[600px] bg-white rounded-lg relative border border-gray-200">
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
          >
            <Background />
            <Controls />
            
          </ReactFlow>
        </ReactFlowProvider>

        {selectedNode && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
            <NodeInfo
              node={selectedNode}
              roadmap={currentRoadmap}
              onComplete={handleNodeComplete}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}
        {showQuizFor && (
          (() => {
            // find node object in current flow nodes
            const nodeObj = nodes.find(n => n.id === showQuizFor) || null;
            return nodeObj ? (
              <Quiz
                roadmapId={currentRoadmap?.id}
                node={nodeObj}
                onClose={() => setShowQuizFor(null)}
                onSuccess={async (res) => {
                  // if passed, mark node complete using local handler so auto-marking runs
                  if (res?.passed) {
                    try {
                      const already = currentRoadmap?.marked_nodes?.includes(nodeObj.id);
                      if (!already) await handleNodeComplete(nodeObj.id);
                    } catch (err) {
                      console.error('Failed to mark node complete after quiz pass', err);
                    }
                  }
                  // signal NodeInfo (and other listeners) to refresh attempts/best score
                  useRoadmapStore.getState().bumpQuizRefresh();
                }}
              />
            ) : null;
          })()
        )}
      </div>

      {showCompletionMessage && location.pathname.includes('/ongoing') && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
              <p className="text-gray-600 mb-6">
                You've completed all nodes in this roadmap. Great job!
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowCompletionMessage(false);
                    navigate('/completed');
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  View Completed Roadmaps
                </button>
                <button
                  onClick={() => setShowCompletionMessage(false)}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}