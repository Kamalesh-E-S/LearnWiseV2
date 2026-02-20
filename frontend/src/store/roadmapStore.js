import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useRoadmapStore = create(
  persist(
    (set) => ({
      roadmaps: [],
      currentRoadmap: null,

      setRoadmaps: (roadmaps) => set({ roadmaps: roadmaps || [] }),
      setCurrentRoadmap: (roadmap) => set({ currentRoadmap: roadmap || null }),

      // Quiz state
      showQuizFor: null,
      setShowQuizFor: (nodeId) => set({ showQuizFor: nodeId }),

      // Counter to trigger quiz-related refreshes (attempts / best score)
      quizRefreshKey: 0,
      bumpQuizRefresh: () => set((s) => ({ quizRefreshKey: (s.quizRefreshKey || 0) + 1 })),

      updateProgress: (nodeId, completed) =>
        set((state) => {
          if (!state.currentRoadmap?.nodes) return state;

          const updatedNodes = state.currentRoadmap.nodes.map((node) => ({
            ...node,
            completed: node.id === nodeId ? completed : node.completed,
          }));

          const markedNodes = updatedNodes
            .filter((node) => node.completed)
            .map((node) => node.id);

          const isCompleted =
            updatedNodes.length > 0 && markedNodes.length === updatedNodes.length;

          const updatedRoadmap = {
            ...state.currentRoadmap,
            nodes: updatedNodes,
            marked_nodes: markedNodes,
            is_completed: isCompleted,
          };

          const updatedRoadmaps = state.roadmaps.map((r) =>
            r.id === updatedRoadmap.id ? updatedRoadmap : r
          );

          return { roadmaps: updatedRoadmaps, currentRoadmap: updatedRoadmap };
        }),

      clearRoadmapData: () => set({ roadmaps: [], currentRoadmap: null }),
    }),
    {
      name: 'roadmap-storage',
      partialize: (state) => ({
        roadmaps: (state.roadmaps || []).map((r) => ({
          ...r,
          nodes: r.nodes || [],
          marked_nodes: r.marked_nodes || [],
          is_completed: r.is_completed || false,
        })),
        currentRoadmap: state.currentRoadmap
          ? {
            ...state.currentRoadmap,
            nodes: state.currentRoadmap.nodes || [],
            marked_nodes: state.currentRoadmap.marked_nodes || [],
            is_completed: state.currentRoadmap.is_completed || false,
          }
          : null,
      }),
    }
  )
);

export { useRoadmapStore };