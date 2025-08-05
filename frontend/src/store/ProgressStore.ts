// frontend/src/store/progressStore.ts
// FIXED VERSION - Safer for production builds with improved error handling

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// Safe toast function that handles missing dependencies
const safeToast = {
  success: (message: string) => {
    try {
      // Try to use react-hot-toast if available
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.success(message);
      } else {
        console.log('✅', message);
      }
    } catch (error) {
      console.log('✅', message);
    }
  },
  error: (message: string) => {
    try {
      if (typeof window !== 'undefined' && (window as any).toast) {
        (window as any).toast.error(message);
      } else {
        console.log('❌', message);
      }
    } catch (error) {
      console.log('❌', message);
    }
  }
};

// Define the structure of learning progress data
export interface ConceptMastery {
  concept: string;
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  understanding: number; // 0-100 percentage
  practiceCount: number;
  lastPracticed: string; // ISO string instead of Date object
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
  startTime: string; // ISO string instead of Date object
  endTime?: string; // ISO string instead of Date object
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
  unlockedAt: string; // ISO string instead of Date object
  category: 'financial' | 'strategic' | 'innovation' | 'leadership';
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetConcepts: string[];
  targetMastery: number;
  deadline?: string; // ISO string instead of Date object
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
  sessionStartTime: string | null; // ISO string
  
  // Analytics
  totalTimeSpent: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null; // ISO string
  
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

// Safe date helpers
const createDateString = (): string => new Date().toISOString();
const parseDate = (dateString: string): Date => {
  try {
    return new Date(dateString);
  } catch (error) {
    return new Date();
  }
};

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
        
        try {
          // Initialize concept masteries if they don't exist
          if (state.conceptMasteries.length === 0) {
            const initialMasteries = BUSINESS_CONCEPTS.map(concept => ({
              concept,
              level: 'novice' as const,
              understanding: 0,
              practiceCount: 0,
              lastPracticed: createDateString(),
              mistakesMade: [],
              successfulApplications: []
            }));
            
            set({ conceptMasteries: initialMasteries });
          }
          
          // Set up daily streak tracking safely
          const today = new Date().toDateString();
          let lastActive: string | null = null;
          
          if (state.lastActiveDate) {
            try {
              const lastActiveDate = parseDate(state.lastActiveDate);
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
              lastActiveDate: createDateString()
            });
          } else {
            // Streak broken or first time, reset to 1
            set({ 
              currentStreak: 1,
              lastActiveDate: createDateString()
            });
          }
        } catch (error) {
          console.error('Error initializing progress:', error);
        }
      },

      // Start a new learning session
      startSession: (gameId, industry = 'robotics', difficulty = 'beginner') => {
        try {
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const currentTime = createDateString();
          
          const newSession: LearningSession = {
            id: sessionId,
            startTime: currentTime,
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
            sessionStartTime: currentTime
          });
          
          safeToast.success('Learning session started! Let\'s build your business skills!');
        } catch (error) {
          console.error('Error starting session:', error);
        }
      },

      // End the current learning session
      endSession: (finalScore, decisionsCorrect, decisionsTotal) => {
        try {
          const state = get();
          const currentSession = state.currentSession;
          
          if (!currentSession || !state.sessionStartTime) {
            return;
          }
          
          const endTime = createDateString();
          const startTime = parseDate(state.sessionStartTime);
          const endTimeObj = parseDate(endTime);
          const sessionDuration = Math.round((endTimeObj.getTime() - startTime.getTime()) / 60000); // minutes
          
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
          
          // Provide feedback
          if (accuracy >= 80) {
            safeToast.success(`Excellent session! You scored ${accuracy.toFixed(1)}%`);
          } else if (accuracy >= 60) {
            safeToast.success(`Good progress! You scored ${accuracy.toFixed(1)}%`);
          } else {
            safeToast.error(`Keep practicing! You scored ${accuracy.toFixed(1)}%`);
          }
        } catch (error) {
          console.error('Error ending session:', error);
        }
      },

      // Record when a concept is practiced
      recordConceptPractice: (concept, success, context) => {
        try {
          const state = get();
          const masteries = [...state.conceptMasteries];
          
          const masteryIndex = masteries.findIndex(m => m.concept === concept);
          if (masteryIndex !== -1) {
            const mastery = { ...masteries[masteryIndex] };
            mastery.practiceCount += 1;
            mastery.lastPracticed = createDateString();
            
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
        } catch (error) {
          console.error('Error recording concept practice:', error);
        }
      },

      // Update concept mastery based on performance
      updateConceptMastery: (concept, performance) => {
        get().recordConceptPractice(concept, performance > 50, `Performance: ${performance}%`);
      },

      // Unlock an achievement
      unlockAchievement: (achievementId) => {
        try {
          const state = get();
          const existingAchievement = state.achievements.find(a => a.id === achievementId);
          
          if (!existingAchievement) {
            const achievementTemplate = AVAILABLE_ACHIEVEMENTS.find(a => a.id === achievementId);
            if (achievementTemplate) {
              const newAchievement: Achievement = {
                ...achievementTemplate,
                unlockedAt: createDateString()
              };
              
              set({ achievements: [...state.achievements, newAchievement] });
              safeToast.success(`🎉 Achievement Unlocked: ${newAchievement.name}!`);
            }
          }
        } catch (error) {
          console.error('Error unlocking achievement:', error);
        }
      },

      // Add a learning goal
      addLearningGoal: (goalData) => {
        try {
          const state = get();
          const newGoal: LearningGoal = {
            ...goalData,
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            progress: 0,
            completed: false
          };
          
          set({ learningGoals: [...state.learningGoals, newGoal] });
          safeToast.success(`New learning goal set: ${newGoal.title}`);
        } catch (error) {
          console.error('Error adding learning goal:', error);
        }
      },

      // Update goal progress
      updateGoalProgress: (goalId, progress) => {
        try {
          const state = get();
          const goals = state.learningGoals.map(goal => {
            if (goal.id === goalId) {
              const updatedGoal = { ...goal, progress: Math.min(100, progress) };
              if (progress >= 100 && !goal.completed) {
                updatedGoal.completed = true;
                safeToast.success(`🎯 Goal completed: ${goal.title}!`);
              }
              return updatedGoal;
            }
            return goal;
          });
          
          set({ learningGoals: goals });
        } catch (error) {
          console.error('Error updating goal progress:', error);
        }
      },

      // Generate a progress report
      generateProgressReport: (period) => {
        try {
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
            parseDate(s.startTime) >= startDate
          );
          
          const conceptsLearned = new Set();
          let totalScore = 0;
          let totalTime = 0;
          
          periodSessions.forEach(session => {
            session.conceptsPracticed.forEach(concept => conceptsLearned.add(concept));
            totalScore += session.finalScore;
            if (session.endTime) {
              totalTime += (parseDate(session.endTime).getTime() - parseDate(session.startTime).getTime()) / 60000;
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
        } catch (error) {
          console.error('Error generating progress report:', error);
          return {
            period,
            conceptsLearned: 0,
            sessionsCompleted: 0,
            averageScore: 0,
            timeSpent: 0,
            improvementRate: 0,
            strongAreas: [],
            weakAreas: [],
            recommendations: []
          };
        }
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
        try {
          return get().learningSessions
            .sort((a, b) => parseDate(b.startTime).getTime() - parseDate(a.startTime).getTime())
            .slice(0, count);
        } catch (error) {
          console.error('Error getting recent sessions:', error);
          return [];
        }
      },

      getSuggestedConcepts: () => {
        try {
          const masteries = get().conceptMasteries;
          return masteries
            .filter(m => m.understanding < 70)
            .sort((a, b) => a.understanding - b.understanding)
            .map(m => m.concept)
            .slice(0, 5);
        } catch (error) {
          console.error('Error getting suggested concepts:', error);
          return [];
        }
      },

      getAchievementProgress: () => {
        try {
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
        } catch (error) {
          console.error('Error getting achievement progress:', error);
          return {
            total: AVAILABLE_ACHIEVEMENTS.length,
            unlocked: 0,
            categories: {}
          };
        }
      },

      // Check for achievements after session
      checkForAchievements: (session: LearningSession, accuracy: number) => {
        try {
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
        } catch (error) {
          console.error('Error checking for achievements:', error);
        }
      }
    })),
    {
      name: 'progress-store',
      version: 1
    }
  )
);