// frontend/src/pages/ProgressDashboard.tsx
// This page shows detailed learning progress and achievements
// Like a report card that shows how much students have learned

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Target, 
  Calendar,
  BookOpen,
  Zap,
  Award,
  Clock,
  Brain,
  ArrowLeft,
  Download,
  Share2
} from 'lucide-react';
import { useProgressStore } from '../store/ProgressStore';

const ProgressDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all-time'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'concepts' | 'achievements' | 'goals'>('overview');

  // Get data from progress store
  const {
    totalSessions,
    currentStreak,
    longestStreak,
    conceptMasteries,
    achievements,
    learningGoals,
    generateProgressReport,
    getAchievementProgress,
    getSuggestedConcepts
  } = useProgressStore();

  // Generate reports
  const weeklyReport = generateProgressReport('week');
  const monthlyReport = generateProgressReport('month');
  const allTimeReport = generateProgressReport('all-time');
  
  const currentReport = selectedPeriod === 'week' ? weeklyReport : 
                       selectedPeriod === 'month' ? monthlyReport : allTimeReport;

  const achievementProgress = getAchievementProgress();
  const suggestedConcepts = getSuggestedConcepts();

  // Get mastery level color
  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'expert': return 'text-purple-400 bg-purple-500/20';
      case 'advanced': return 'text-blue-400 bg-blue-500/20';
      case 'intermediate': return 'text-green-400 bg-green-500/20';
      case 'beginner': return 'text-yellow-400 bg-yellow-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6 text-center">
          <BarChart3 className="text-blue-400 mx-auto mb-3" size={32} />
          <div className="text-3xl font-bold text-blue-400 mb-1">{totalSessions}</div>
          <div className="text-blue-200 text-sm">Total Sessions</div>
        </div>

        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 text-center">
          <Zap className="text-green-400 mx-auto mb-3" size={32} />
          <div className="text-3xl font-bold text-green-400 mb-1">{currentStreak}</div>
          <div className="text-green-200 text-sm">Current Streak</div>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-6 text-center">
          <Trophy className="text-purple-400 mx-auto mb-3" size={32} />
          <div className="text-3xl font-bold text-purple-400 mb-1">{achievements.length}</div>
          <div className="text-purple-200 text-sm">Achievements</div>
        </div>

        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-6 text-center">
          <Brain className="text-orange-400 mx-auto mb-3" size={32} />
          <div className="text-3xl font-bold text-orange-400 mb-1">
            {conceptMasteries.filter(c => c.level !== 'novice').length}
          </div>
          <div className="text-orange-200 text-sm">Concepts Learned</div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {[
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'all-time', label: 'All Time' }
        ].map((period) => (
          <button
            key={period.key}
            onClick={() => setSelectedPeriod(period.key as any)}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedPeriod === period.key
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Performance Report */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
        <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
          <TrendingUp className="text-blue-400" size={24} />
          Performance Report - {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-2">
              {currentReport.sessionsCompleted}
            </div>
            <div className="text-gray-300">Sessions Completed</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">
              {currentReport.averageScore.toFixed(0)}%
            </div>
            <div className="text-gray-300">Average Score</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-2">
              {Math.round(currentReport.timeSpent)} min
            </div>
            <div className="text-gray-300">Time Spent Learning</div>
          </div>
        </div>

        {/* Improvement Trend */}
        <div className="mt-6 p-4 bg-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-blue-400" size={16} />
            <span className="text-blue-100 font-medium">Learning Trend</span>
          </div>
          <div className={`text-lg font-semibold ${
            currentReport.improvementRate > 0 ? 'text-green-400' : 
            currentReport.improvementRate < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {currentReport.improvementRate > 0 ? '+' : ''}{currentReport.improvementRate.toFixed(1)}% improvement
          </div>
        </div>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
          <h4 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
            <Award size={20} />
            Strong Areas
          </h4>
          {currentReport.strongAreas.length > 0 ? (
            <div className="space-y-2">
              {currentReport.strongAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-green-100 capitalize">{area.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-green-200 text-sm">Keep playing to identify your strengths!</p>
          )}
        </div>

        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-6">
          <h4 className="text-yellow-400 font-semibold mb-4 flex items-center gap-2">
            <Target size={20} />
            Areas to Improve
          </h4>
          {currentReport.weakAreas.length > 0 ? (
            <div className="space-y-2">
              {currentReport.weakAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span className="text-yellow-100 capitalize">{area.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-yellow-200 text-sm">Great job! No major weak areas identified.</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-6">
        <h4 className="text-purple-400 font-semibold mb-4 flex items-center gap-2">
          <Brain size={20} />
          AI Recommendations
        </h4>
        <div className="space-y-2">
          {currentReport.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
              <span className="text-purple-100 text-sm">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderConcepts = () => (
    <div className="space-y-6">
      {/* Concept Mastery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conceptMasteries.map((concept, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/10 rounded-lg p-4 border border-white/20"
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-white font-medium capitalize">
                {concept.concept.replace('-', ' ')}
              </h4>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getMasteryColor(concept.level)}`}>
                {concept.level}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${concept.understanding}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Understanding</span>
                <span>{concept.understanding}%</span>
              </div>
            </div>

            {/* Practice Stats */}
            <div className="text-xs text-gray-300 space-y-1">
              <div className="flex justify-between">
                <span>Practice Sessions:</span>
                <span>{concept.practiceCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Practiced:</span>
                <span>{new Date(concept.lastPracticed).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggested Learning */}
      {suggestedConcepts.length > 0 && (
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
            <Zap size={20} />
            Suggested Focus Areas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedConcepts.slice(0, 4).map((conceptId, index) => {
              const concept = conceptMasteries.find(c => c.concept === conceptId);
              return (
                <div key={index} className="bg-blue-600/20 rounded p-3">
                  <div className="font-medium text-blue-100 capitalize mb-1">
                    {conceptId.replace('-', ' ')}
                  </div>
                  <div className="text-xs text-blue-200">
                    Current level: {concept?.level || 'novice'} ({concept?.understanding || 0}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      {/* Achievement Stats */}
      <div className="bg-white/10 rounded-lg p-6 border border-white/20">
        <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
          <Trophy className="text-yellow-400" size={24} />
          Achievement Progress
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-yellow-400 mb-1">
              {achievementProgress.unlocked}
            </div>
            <div className="text-gray-300 text-sm">Unlocked</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400 mb-1">
              {achievementProgress.total}
            </div>
            <div className="text-gray-300 text-sm">Total Available</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-400 mb-1">
              {Math.round((achievementProgress.unlocked / achievementProgress.total) * 100)}%
            </div>
            <div className="text-gray-300 text-sm">Complete</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400 mb-1">
              {longestStreak}
            </div>
            <div className="text-gray-300 text-sm">Best Streak</div>
          </div>
        </div>
      </div>

      {/* Unlocked Achievements */}
      <div>
        <h4 className="text-white font-semibold mb-4">Unlocked Achievements</h4>
        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <h5 className="text-yellow-400 font-semibold">{achievement.name}</h5>
                    <p className="text-yellow-200 text-sm">{achievement.description}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-yellow-300">
                  <span className="capitalize">{achievement.category}</span>
                  <span>{new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="text-gray-400 mx-auto mb-3" size={48} />
            <p className="text-gray-400">No achievements unlocked yet</p>
            <p className="text-gray-500 text-sm">Keep playing to earn your first achievement!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      {/* Active Goals */}
      <div>
        <h4 className="text-white font-semibold mb-4">Learning Goals</h4>
        {learningGoals.length > 0 ? (
          <div className="space-y-4">
            {learningGoals.map((goal, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-4 border border-white/20">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="text-white font-medium">{goal.title}</h5>
                    <p className="text-gray-300 text-sm">{goal.description}</p>
                  </div>
                  {goal.completed && (
                    <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                      Completed!
                    </div>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        goal.completed ? 'bg-green-400' : 'bg-blue-400'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Progress</span>
                    <span>{goal.progress.toFixed(0)}%</span>
                  </div>
                </div>

                {goal.deadline && (
                  <div className="text-xs text-gray-400">
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="text-gray-400 mx-auto mb-3" size={48} />
            <p className="text-gray-400">No learning goals set</p>
            <p className="text-gray-500 text-sm">Set goals to track your learning progress!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="text-white" size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Learning Progress</h1>
            <p className="text-gray-300">Track your business education journey</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'concepts', label: 'Concepts', icon: BookOpen },
            { id: 'achievements', label: 'Achievements', icon: Trophy },
            { id: 'goals', label: 'Goals', icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'concepts' && renderConcepts()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'goals' && renderGoals()}
      </motion.div>
    </div>
  );
};

export default ProgressDashboard;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This ProgressDashboard page is like a comprehensive report card that shows
 * students their learning journey. Here's what each section provides:
 * 
 * 1. OVERVIEW TAB:
 *    - Key statistics (sessions played, achievements, concepts learned)
 *    - Performance trends over different time periods
 *    - Strengths and areas for improvement
 *    - AI-generated recommendations
 * 
 * 2. CONCEPTS TAB:
 *    - Visual grid of all business concepts being learned
 *    - Progress bars showing understanding level for each concept
 *    - Practice statistics and last practiced dates
 *    - Suggested focus areas for improvement
 * 
 * 3. ACHIEVEMENTS TAB:
 *    - All unlocked achievements with descriptions
 *    - Achievement progress statistics
 *    - Visual celebration of accomplishments
 *    - Motivation to unlock more achievements
 * 
 * 4. GOALS TAB:
 *    - Custom learning goals set by students
 *    - Progress tracking toward goal completion
 *    - Deadline management for time-bound goals
 *    - Completion celebration
 * 
 * EDUCATIONAL VALUE:
 * - Self-reflection and metacognition development
 * - Goal setting and progress tracking skills
 * - Understanding of learning as a measurable process
 * - Motivation through achievement systems
 * - Data literacy through reading charts and metrics
 * 
 * This helps students become aware of their own learning process and
 * encourages them to take ownership of their educational journey.
 */