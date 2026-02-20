import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const DEFAULT_MERMAID = `# [root] Learning Path
## [fund] Fundamentals
### [basic] Basic Concepts
### [core] Core Principles
## [inter] Intermediate
### [adv] Advanced Topics
### [best] Best Practices
## [exp] Expert Level
### [mast] Mastery
### [innov] Innovation`;

const DEFAULT_DESCRIPTIONS = `root,(Main learning path overview, ytlink: intro-video, site: learningpath.com)
fund,(Foundation concepts to master, ytlink: fundamentals-101, site: basics.com)
basic,(Core basic concepts explanation, ytlink: basics-explained, site: concepts.org)
core,(Essential principles to understand, ytlink: core-principles, site: principles.net)
inter,(Intermediate level content, ytlink: intermediate-guide, site: mid-level.com)
adv,(Advanced topic deep dives, ytlink: advanced-topics, site: advanced.edu)
best,(Industry best practices, ytlink: best-practices, site: practices.dev)
exp,(Expert level material, ytlink: expert-guide, site: expert.io)
mast,(Mastery concepts and techniques, ytlink: mastery-path, site: masters.com)
innov,(Innovation and cutting edge, ytlink: innovation-trends, site: trends.tech)`;

// Dummy data
const dummyRoadmaps = [
  {
    id: '1',
    skill: 'React Development',
    timeframe: '6 months',
    current_knowledge: 'Basic JavaScript and HTML/CSS',
    target_level: 'Advanced',
    mermaid_code: DEFAULT_MERMAID,
    descriptions_text: DEFAULT_DESCRIPTIONS,
    nodes: [
      { id: 'root', text: 'Learning Path', completed: true, varName: 'root' },
      { id: 'fund', text: 'Fundamentals', completed: true, varName: 'fund' },
      { id: 'basic', text: 'Basic Concepts', completed: true, varName: 'basic' },
      { id: 'core', text: 'Core Principles', completed: false, varName: 'core' },
      { id: 'inter', text: 'Intermediate', completed: false, varName: 'inter' },
      { id: 'adv', text: 'Advanced Topics', completed: false, varName: 'adv' },
      { id: 'best', text: 'Best Practices', completed: false, varName: 'best' },
      { id: 'exp', text: 'Expert Level', completed: false, varName: 'exp' },
      { id: 'mast', text: 'Mastery', completed: false, varName: 'mast' },
      { id: 'innov', text: 'Innovation', completed: false, varName: 'innov' }
    ]
  },
  {
    id: '2',
    skill: 'TypeScript',
    timeframe: '3 months',
    current_knowledge: 'Intermediate JavaScript',
    target_level: 'Intermediate',
    mermaid_code: DEFAULT_MERMAID,
    descriptions_text: DEFAULT_DESCRIPTIONS,
    nodes: [
      { id: 'root', text: 'Learning Path', completed: true, varName: 'root' },
      { id: 'fund', text: 'Fundamentals', completed: true, varName: 'fund' },
      { id: 'basic', text: 'Basic Concepts', completed: false, varName: 'basic' },
      { id: 'core', text: 'Core Principles', completed: false, varName: 'core' },
      { id: 'inter', text: 'Intermediate', completed: false, varName: 'inter' },
      { id: 'adv', text: 'Advanced Topics', completed: false, varName: 'adv' },
      { id: 'best', text: 'Best Practices', completed: false, varName: 'best' },
      { id: 'exp', text: 'Expert Level', completed: false, varName: 'exp' },
      { id: 'mast', text: 'Mastery', completed: false, varName: 'mast' },
      { id: 'innov', text: 'Innovation', completed: false, varName: 'innov' }
    ]
  }
];

const useRoadmapStore = create(
  persist(
    (set) => ({
      roadmaps: dummyRoadmaps,
      currentRoadmap: dummyRoadmaps[0],
      setRoadmaps: (roadmaps) => set({ roadmaps: roadmaps || [] }),
      setCurrentRoadmap: (roadmap) => set({ currentRoadmap: roadmap || null }),
      showQuizFor: null,
      setShowQuizFor: (nodeId) => set({ showQuizFor: nodeId }),
      // counter to signal quiz-related refreshes (e.g., attempts/best score)
      quizRefreshKey: 0,
      bumpQuizRefresh: () => set((s) => ({ quizRefreshKey: (s.quizRefreshKey || 0) + 1 })),
      updateProgress: (nodeId, completed) => 
        set((state) => {
          if (!state.currentRoadmap?.nodes) return state;

          // Update nodes completion status
          const updatedNodes = [...state.currentRoadmap.nodes].map(node => ({
            ...node,
            completed: node.id === nodeId ? completed : node.completed
          }));

          // Get list of completed node IDs
          const markedNodes = updatedNodes.filter(node => node.completed).map(node => node.id);
          
          // Calculate if roadmap is completed (all nodes marked)
          const isCompleted = updatedNodes.length > 0 && 
                            markedNodes.length === updatedNodes.length;

          const updatedRoadmap = {
            ...state.currentRoadmap,
            nodes: updatedNodes,
            marked_nodes: markedNodes,
            is_completed: isCompleted
          };

          // Update the roadmap in the roadmaps list
          const updatedRoadmaps = state.roadmaps.map(roadmap =>
            roadmap.id === updatedRoadmap.id ? updatedRoadmap : roadmap
          );

          return {
            roadmaps: updatedRoadmaps,
            currentRoadmap: updatedRoadmap
          };
        }),
      clearRoadmapData: () => set({ roadmaps: [], currentRoadmap: null })
    }),
    {
      name: 'roadmap-storage',
      partialize: (state) => ({
        roadmaps: state.roadmaps?.map(roadmap => ({
          ...roadmap,
          nodes: roadmap.nodes || [],
          marked_nodes: roadmap.marked_nodes || [],
          is_completed: roadmap.is_completed || false
        })) || [],
        currentRoadmap: state.currentRoadmap ? {
          ...state.currentRoadmap,
          nodes: state.currentRoadmap.nodes || [],
          marked_nodes: state.currentRoadmap.marked_nodes || [],
          is_completed: state.currentRoadmap.is_completed || false
        } : null
      })
    }
  )
);

export { useRoadmapStore };