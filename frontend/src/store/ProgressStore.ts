// frontend/src/store/progressStore.ts
// This tracks the student's learning progress and mastery of business concepts
// Think of it as a smart report card that updates in real-time

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import toast from 'react-hot-toast';

// Define the structure of learning progress data
export interface ConceptMastery {
  concept: string;
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  understanding: number; // 0-100 percentage
  practiceCount: number;
  lastPracticed: Date;
  mistakesMade: string[];
  successfulApplications: string[];
}

export interface SkillArea {
  name: string;
  description: string;
  concepts: string[];
  overallMastery: number; // 0-100 percentage
  timeSpent: number; // minutes
}

export interface LearningSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  gameId?: string;
  industry: string;
  difficulty: 'beginner' | 'advanced';
  conceptsPracticed: string[];
  decisionsCorrect: number;
  decisionsTotal: number;
  finalScore: number;
  improvementAreas: string[];
  achievements: string[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'financial' | 'strategic' | 'innovation' | 'leadership';
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetConcepts: string[];
  targetMastery: number;
  deadline?: Date;
  progress: number;
  completed: boolean;
}

export interface ProgressReport {
  period: 'week' | 'month' | 'all-time';
  conceptsLearned: number;
  sessionsCompleted: number;
  averageScore: number;
  timeSpent: number;
  improvementRate: number;
  strongAreas: string[];
  weakAreas: string[];
  recommendations: string[];
}

// Define the store interface
interface ProgressStore {
  // Core data
  conceptMasteries: ConceptMastery[];
  skillAreas: SkillArea[];
  learningSessions: LearningSession[];
  achievements: Achievement[];
  learningGoals: LearningGoal[];
  
  // Current session tracking
  currentSession: LearningSession | null;
  sessionStartTime: Date | null;
  
  // Analytics
  totalTimeSpent: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  
  // Settings
  targetDailyTime: number; // minutes
  notifications: boolean;
  difficulty: 'beginner' | 'advanced';
  
  // Actions
  initializeProgress: () => void;
  startSession: (gameId?: string, industry?: string, difficulty?: 'beginner' | 'advanced') => void;
  endSession: (finalScore: number, decisionsCorrect: number, decisionsTotal: number) => void;
  recordConceptPractice: (concept: string, success: boolean, context?: string) => void;
  updateConceptMastery: (concept: string, performance: number) => void;
  unlockAchievement: (achievementId: string) => void;
  addLearningGoal: (goal: Omit<LearningGoal, 'id' | 'progress' | 'completed'>) => void;
  updateGoalProgress: (goalId: string, progress: number) => void;
  generateProgressReport: (period: 'week' | 'month' | 'all-time') => ProgressReport;
  
  // Getters
  getConceptMastery: (concept: string) => ConceptMastery | null;
  getSkillAreaProgress: (skillArea: string) => number;
  getRecentSessions: (count: number) => LearningSession[];
  getSuggestedConcepts: () => string[];
  getAchievementProgress: () => { total: number; unlocked: number; categories: Record<string, number> };
  
  // Helper methods
  checkForAchievements: (session: LearningSession, accuracy: number) => void;
}

// Business concepts we're tracking
const BUSINESS_CONCEPTS = [
  // Financial Literacy
  'profit-loss-calculation',
  'cash-flow-management', 
  'revenue-vs-profit',
  'debt-vs-equity',
  'return-on-investment',
  'break-even-analysis',
  'financial-statements',
  'budgeting-forecasting',
  
  // Strategic Thinking
  'market-analysis',
  'competitive-advantage',
  'risk-management',
  'supply-chain-optimization',
  'innovation-strategy',
  'market-timing',
  'resource-allocation',
  'strategic-planning',
  
  // Business Operations
  'production-planning',
  'inventory-management',
  'quality-control',
  'cost-optimization',
  'scaling-operations',
  'supplier-relationships',
  'customer-acquisition',
  'pricing-strategy'
];

// Skill areas that group related concepts
const SKILL_AREAS: SkillArea[] = [
  {
    name: 'Financial Management',
    description: 'Understanding money, profits, and financial decision-making',
    concepts: ['profit-loss-calculation', 'cash-flow-management', 'revenue-vs-profit', 'budgeting-forecasting'],
    overallMastery: 0,
    timeSpent: 0
  },
  {
    name: 'Strategic Planning',
    description: 'Long-term thinking and competitive strategy',
    concepts: ['market-analysis', 'competitive-advantage', 'strategic-planning', 'resource-allocation'],
    overallMastery: 0,
    timeSpent: 0
  },
  {
    name: 'Operations Management',
    description: 'Running efficient business operations',
    concepts: ['production-planning', 'inventory-management', 'supply-chain-optimization', 'cost-optimization'],
    overallMastery: 0,
    timeSpent: 0
  },
  {
    name: 'Innovation & Growth',
    description: 'Creating new opportunities and scaling business',
    concepts: ['innovation-strategy', 'market-timing', 'customer-acquisition', 'scaling-operations'],
    overallMastery: 0,
    timeSpent: 0
  }
];

// Available achievements
const AVAILABLE_ACHIEVEMENTS: Omit<Achievement, 'unlockedAt'>[] = [
  {
    id: 'first-profit',
    name: 'First Profit',
    description: 'Made your first profitable business decision',
    icon: '💰',
    category: 'financial'
  },
  {
    id: 'cash-flow-master',
    name: 'Cash Flow Master',
    description: 'Successfully managed cash flow for 5 consecutive rounds',
    icon: '📊',
    category: 'financial'
  },
  {
    id: 'innovation-leader',
    name: 'Innovation Leader',
    description: 'Successfully implemented 10 R&D projects',
    icon: '🚀',
    category: 'innovation'
  },
  {
    id: 'market-analyst',
    name: 'Market Analyst',
    description: 'Correctly predicted market trends 5 times',
    icon: '📈',
    category: 'strategic'
  },
  {
    id: 'risk-manager',
    name: 'Risk Manager',
    description: 'Avoided bankruptcy despite high-risk situations',
    icon: '🛡️',
    category: 'strategic'
  },
  {
    id: 'team-player',
    name: 'Team Player',
    description: 'Completed 5 multiplayer games',
    icon: '🤝',
    category: 'leadership'
  },
  {
    id: 'quick-learner',
    name: 'Quick Learner',
    description: 'Mastered a new concept in under 3 practice sessions',
    icon: '⚡',
    category: 'innovation'
  },
  {
    id: 'consistent-player',
    name: 'Consistent Player',
    description: 'Played for 7 consecutive days',
    icon: '🔥',
    category: 'leadership'
  }
];

// Create the progress store
export const useProgressStore = create<ProgressStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      conceptMasteries: [],
      skillAreas: [...SKILL_AREAS],
      learningSessions: [],
      achievements: [],
      learningGoals: [],
      currentSession: null,
      sessionStartTime: null,
      totalTimeSpent: 0,
      totalSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      targetDailyTime: 30, // 30 minutes default
      notifications: true,
      difficulty: 'beginner',

      // Initialize progress tracking
      initializeProgress: () => {
        const state = get();
        
        // Initialize concept masteries if they don't exist
        if (state.conceptMasteries.length === 0) {
          const initialMasteries = BUSINESS_CONCEPTS.map(concept => ({
            concept,
            level: 'novice' as const,
            understanding: 0,
            practiceCount: 0,
            lastPracticed: new Date(),
            mistakesMade: [],
            successfulApplications: []
          }));
          
          set({ conceptMasteries: initialMasteries });
        }
        
        // Set up daily streak tracking - handle both Date objects and strings from localStorage
        const today = new Date().toDateString();
        let lastActive: string | null = null;
        
        if (state.lastActiveDate) {
          try {
            // Handle both Date objects and ISO strings from localStorage
            const lastActiveDate = typeof state.lastActiveDate === 'string' 
              ? new Date(state.lastActiveDate) 
              : state.lastActiveDate;
            lastActive = lastActiveDate.toDateString();
          } catch (error) {
            console.warn('Error parsing lastActiveDate:', error);
            lastActive = null;
          }
        }
        
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        
        if (lastActive === today) {
          // Already active today, maintain streak
        } else if (lastActive === yesterday) {
          // Was active yesterday, increment streak
          set({ 
            currentStreak: state.currentStreak + 1,
            longestStreak: Math.max(state.longestStreak, state.currentStreak + 1),
            lastActiveDate: new Date()
          });
        } else {
          // Streak broken or first time, reset to 1
          set({ 
            currentStreak: 1,
            lastActiveDate: new Date()
          });
        }
      },

      // Start a new learning session
      startSession: (gameId, industry = 'robotics', difficulty = 'beginner') => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newSession: LearningSession = {
          id: sessionId,
          startTime: new Date(),
          gameId,
          industry,
          difficulty,
          conceptsPracticed: [],
          decisionsCorrect: 0,
          decisionsTotal: 0,
          finalScore: 0,
          improvementAreas: [],
          achievements: []
        };
        
        set({ 
          currentSession: newSession,
          sessionStartTime: new Date()
        });
        
        toast.success('Learning session started! Let\'s build your business skills!');
      },

      // End the current learning session
      endSession: (finalScore, decisionsCorrect, decisionsTotal) => {
        const state = get();
        const currentSession = state.currentSession;
        
        if (!currentSession || !state.sessionStartTime) {
          return;
        }
        
        const endTime = new Date();
        const sessionDuration = Math.round((endTime.getTime() - state.sessionStartTime.getTime()) / 60000); // minutes
        
        const completedSession: LearningSession = {
          ...currentSession,
          endTime,
          decisionsCorrect,
          decisionsTotal,
          finalScore,
          improvementAreas: get().getSuggestedConcepts().slice(0, 3) // Top 3 improvement areas
        };
        
        // Calculate accuracy and provide feedback
        const accuracy = decisionsTotal > 0 ? (decisionsCorrect / decisionsTotal) * 100 : 0;
        
        // Update totals
        set({
          currentSession: null,
          sessionStartTime: null,
          learningSessions: [...state.learningSessions, completedSession],
          totalSessions: state.totalSessions + 1,
          totalTimeSpent: state.totalTimeSpent + sessionDuration
        });
        
        // Check for achievements
        get().checkForAchievements(completedSession, accuracy);
        
        // Provide feedback - FIXED LINE 369
        if (accuracy >= 80) {
          toast.success(`Excellent session! You scored ${accuracy.toFixed(1)}%`);
        } else if (accuracy >= 60) {
          toast.success(`Good progress! You scored ${accuracy.toFixed(1)}%`);
        } else {
          toast.error(`Keep practicing! You scored ${accuracy.toFixed(1)}%`);
        }
      },

      // Record when a concept is practiced
      recordConceptPractice: (concept, success, context) => {
        const state = get();
        const masteries = [...state.conceptMasteries];
        
        const masteryIndex = masteries.findIndex(m => m.concept === concept);
        if (masteryIndex !== -1) {
          const mastery = { ...masteries[masteryIndex] };
          mastery.practiceCount += 1;
          mastery.lastPracticed = new Date();
          
          if (success) {
            mastery.successfulApplications.push(context || 'General practice');
            mastery.understanding = Math.min(100, mastery.understanding + 2);
          } else {
            mastery.mistakesMade.push(context || 'General practice');
            mastery.understanding = Math.max(0, mastery.understanding - 1);
          }
          
          // Update mastery level based on understanding
          if (mastery.understanding >= 90) mastery.level = 'expert';
          else if (mastery.understanding >= 75) mastery.level = 'advanced';
          else if (mastery.understanding >= 50) mastery.level = 'intermediate';
          else if (mastery.understanding >= 25) mastery.level = 'beginner';
          else mastery.level = 'novice';
          
          masteries[masteryIndex] = mastery;
          
          // Update current session
          if (state.currentSession) {
            const updatedSession = { ...state.currentSession };
            if (!updatedSession.conceptsPracticed.includes(concept)) {
              updatedSession.conceptsPracticed.push(concept);
            }
            set({ currentSession: updatedSession });
          }
          
          set({ conceptMasteries: masteries });
        }
      },

      // Update concept mastery based on performance
      updateConceptMastery: (concept, performance) => {
        get().recordConceptPractice(concept, performance > 50, `Performance: ${performance}%`);
      },

      // Unlock an achievement
      unlockAchievement: (achievementId) => {
        const state = get();
        const existingAchievement = state.achievements.find(a => a.id === achievementId);
        
        if (!existingAchievement) {
          const achievementTemplate = AVAILABLE_ACHIEVEMENTS.find(a => a.id === achievementId);
          if (achievementTemplate) {
            const newAchievement: Achievement = {
              ...achievementTemplate,
              unlockedAt: new Date()
            };
            
            set({ achievements: [...state.achievements, newAchievement] });
            toast.success(`🎉 Achievement Unlocked: ${newAchievement.name}!`);
          }
        }
      },

      // Add a learning goal
      addLearningGoal: (goalData) => {
        const state = get();
        const newGoal: LearningGoal = {
          ...goalData,
          id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          progress: 0,
          completed: false
        };
        
        set({ learningGoals: [...state.learningGoals, newGoal] });
        toast.success(`New learning goal set: ${newGoal.title}`);
      },

      // Update goal progress
      updateGoalProgress: (goalId, progress) => {
        const state = get();
        const goals = state.learningGoals.map(goal => {
          if (goal.id === goalId) {
            const updatedGoal = { ...goal, progress: Math.min(100, progress) };
            if (progress >= 100 && !goal.completed) {
              updatedGoal.completed = true;
              toast.success(`🎯 Goal completed: ${goal.title}!`);
            }
            return updatedGoal;
          }
          return goal;
        });
        
        set({ learningGoals: goals });
      },

      // Generate a progress report
      generateProgressReport: (period) => {
        const state = get();
        const now = new Date();
        let startDate: Date;
        
        switch (period) {
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(0);
        }
        
        const periodSessions = state.learningSessions.filter(s => 
          s.startTime >= startDate
        );
        
        const conceptsLearned = new Set();
        let totalScore = 0;
        let totalTime = 0;
        
        periodSessions.forEach(session => {
          session.conceptsPracticed.forEach(concept => conceptsLearned.add(concept));
          totalScore += session.finalScore;
          if (session.endTime) {
            totalTime += (session.endTime.getTime() - session.startTime.getTime()) / 60000;
          }
        });
        
        const averageScore = periodSessions.length > 0 ? totalScore / periodSessions.length : 0;
        
        // Calculate improvement rate
        const recentSessions = periodSessions.slice(-5);
        const oldSessions = periodSessions.slice(0, 5);
        const recentAvg = recentSessions.reduce((sum, s) => sum + s.finalScore, 0) / Math.max(1, recentSessions.length);
        const oldAvg = oldSessions.reduce((sum, s) => sum + s.finalScore, 0) / Math.max(1, oldSessions.length);
        const improvementRate = oldAvg > 0 ? ((recentAvg - oldAvg) / oldAvg) * 100 : 0;
        
        // Identify strong and weak areas
        const skillProgress = state.skillAreas.map(skill => ({
          name: skill.name,
          mastery: skill.overallMastery
        }));
        
        const strongAreas = skillProgress
          .filter(skill => skill.mastery >= 70)
          .map(skill => skill.name);
          
        const weakAreas = skillProgress
          .filter(skill => skill.mastery < 50)
          .map(skill => skill.name);
        
        return {
          period,
          conceptsLearned: conceptsLearned.size,
          sessionsCompleted: periodSessions.length,
          averageScore,
          timeSpent: Math.round(totalTime),
          improvementRate,
          strongAreas,
          weakAreas,
          recommendations: get().getSuggestedConcepts().slice(0, 3)
        };
      },

      // Helper functions
      getConceptMastery: (concept) => {
        return get().conceptMasteries.find(m => m.concept === concept) || null;
      },

      getSkillAreaProgress: (skillAreaName) => {
        const skillArea = get().skillAreas.find(s => s.name === skillAreaName);
        return skillArea?.overallMastery || 0;
      },

      getRecentSessions: (count) => {
        return get().learningSessions
          .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
          .slice(0, count);
      },

      getSuggestedConcepts: () => {
        const masteries = get().conceptMasteries;
        return masteries
          .filter(m => m.understanding < 70)
          .sort((a, b) => a.understanding - b.understanding)
          .map(m => m.concept)
          .slice(0, 5);
      },

      getAchievementProgress: () => {
        const achievements = get().achievements;
        const categories = achievements.reduce((acc, achievement) => {
          acc[achievement.category] = (acc[achievement.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          total: AVAILABLE_ACHIEVEMENTS.length,
          unlocked: achievements.length,
          categories
        };
      },

      // Check for achievements after session
      checkForAchievements: (session: LearningSession, accuracy: number) => {
        const state = get();
        
        // First profit achievement
        if (session.finalScore > 0 && !state.achievements.find(a => a.id === 'first-profit')) {
          get().unlockAchievement('first-profit');
        }
        
        // Quick learner achievement
        if (accuracy >= 90 && !state.achievements.find(a => a.id === 'quick-learner')) {
          get().unlockAchievement('quick-learner');
        }
        
        // Consistent player achievement
        if (state.currentStreak >= 7 && !state.achievements.find(a => a.id === 'consistent-player')) {
          get().unlockAchievement('consistent-player');
        }
      }
    })),
    {
      name: 'progress-store',
      version: 1
    }
  )
);