// frontend/src/pages/HomePage.tsx
// Fixed API endpoint to match your backend setup

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Users, 
  Bot, 
  BarChart3, 
  HelpCircle, 
  Settings,
  Zap,
  Trophy,
  BookOpen,
  Rocket,
  Brain,
  Target
} from 'lucide-react';

// Import our stores and services
import { useGameStore } from '../store/GameStore';
import { useProgressStore } from '../store/ProgressStore';
import { socketService } from '../services/SocketService';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // Get data from our stores
  const { isConnected } = useGameStore();
  const { 
    totalSessions, 
    currentStreak, 
    getAchievementProgress,
    generateProgressReport 
  } = useProgressStore();
  
  // Local state for game creation
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [gameSettings, setGameSettings] = useState({
    difficulty: 'beginner' as 'beginner' | 'advanced',
    industry: 'robotics',
    maxRounds: 5,
    allowAI: true
  });
  
  // Get progress data
  const achievementProgress = getAchievementProgress();
  const weeklyReport = generateProgressReport('week');

  // Set up connection when component loads
  useEffect(() => {
    if (!isConnected) {
      socketService.connect();
    }
  }, [isConnected]);

  // Handle creating a new game - UPDATED API ENDPOINT
  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name!');
      return;
    }
    
    if (!isConnected) {
      alert('Not connected to server. Please wait and try again.');
      return;
    }

    setIsCreatingGame(true);
    
    try {
      // Store player name for later use
      localStorage.setItem('playerName', playerName.trim());
      
      // FIXED: Use full URL with backend port
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
	  const response = await fetch(`${apiUrl}/api/game/create`,  {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: playerName.trim(),
          ...gameSettings
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Game created successfully:', result.gameId);
        // Navigate to the game
        navigate(`/game/${result.gameId}`);
      } else {
        alert('Failed to create game: ' + result.message);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      alert('Failed to create game. Please try again.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  // Handle joining an existing game - UPDATED
  const handleJoinGame = () => {
    if (!playerName.trim()) {
      alert('Please enter your name first!');
      return;
    }
    
    // Navigate to lobby for joining games
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20 mb-4">
            <Rocket className="text-blue-400" size={24} />
            <span className="text-white font-semibold text-lg">RoboStartup AI</span>
          </div>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-6xl font-bold text-white mb-4"
        >
          Master Business Through
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {' '}AI-Powered Gaming
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-gray-300 max-w-3xl mx-auto mb-8"
        >
          Learn financial literacy, strategic thinking, and business management by running your own robotics company. 
          Compete with friends, get personalized AI tutoring, and build real-world business skills.
        </motion.p>

        {/* Quick Stats */}
        {(totalSessions > 0 || currentStreak > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-6 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
              <div className="text-2xl font-bold text-blue-400">{totalSessions}</div>
              <div className="text-sm text-gray-300">Games Played</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
              <div className="text-2xl font-bold text-green-400">{currentStreak}</div>
              <div className="text-sm text-gray-300">Day Streak</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 border border-white/20">
              <div className="text-2xl font-bold text-purple-400">{achievementProgress.unlocked}</div>
              <div className="text-sm text-gray-300">Achievements</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game Creation Panel */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Play className="text-green-400" size={28} />
              Start Your Business Journey
            </h2>

            {/* Player Name Input */}
            <div className="mb-6">
              <label className="block text-white font-medium mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                maxLength={20}
              />
            </div>

            {/* Game Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Difficulty */}
              <div>
                <label className="block text-white font-medium mb-2">Difficulty Level</label>
                <select
                  value={gameSettings.difficulty}
                  onChange={(e) => setGameSettings({...gameSettings, difficulty: e.target.value as 'beginner' | 'advanced'})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="beginner" className="text-black">Beginner (Ages 12-15)</option>
                  <option value="advanced" className="text-black">Advanced (Ages 16+)</option>
                </select>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-white font-medium mb-2">Industry Focus</label>
                <select
                  value={gameSettings.industry}
                  onChange={(e) => setGameSettings({...gameSettings, industry: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value="robotics" className="text-black">Robotics & AI</option>
                  <option value="automotive" className="text-black">Automotive & EV</option>
                  <option value="biotech" className="text-black">Biotechnology</option>
                  <option value="aerospace" className="text-black">Aerospace</option>
                  <option value="greenEnergy" className="text-black">Green Energy</option>
                </select>
              </div>

              {/* Game Length */}
              <div>
                <label className="block text-white font-medium mb-2">Game Length</label>
                <select
                  value={gameSettings.maxRounds}
                  onChange={(e) => setGameSettings({...gameSettings, maxRounds: parseInt(e.target.value)})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                >
                  <option value={5} className="text-black">Quick Game (5 rounds)</option>
                  <option value={10} className="text-black">Standard Game (10 rounds)</option>
                  <option value={15} className="text-black">Extended Game (15 rounds)</option>
                </select>
              </div>

              {/* AI Players */}
              <div>
                <label className="block text-white font-medium mb-2">AI Opponents</label>
                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={gameSettings.allowAI}
                      onChange={(e) => setGameSettings({...gameSettings, allowAI: e.target.checked})}
                      className="rounded"
                    />
                    Include AI competitors
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleCreateGame}
                disabled={isCreatingGame || !isConnected || !playerName.trim()}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-semibold transition-all ${
                  isCreatingGame || !isConnected || !playerName.trim()
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isCreatingGame ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Create New Game
                  </>
                )}
              </button>

              <button
                onClick={handleJoinGame}
                disabled={!isConnected || !playerName.trim()}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  !isConnected || !playerName.trim()
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Users size={20} className="inline mr-2" />
                Join Game
              </button>
            </div>

            {/* Connection Status */}
            {!isConnected && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-red-300">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  Connecting to server...
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Learning Progress */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="text-blue-400" size={20} />
              Your Progress
            </h3>
            
            {totalSessions > 0 ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">This Week:</span>
                  <span className="text-blue-400 font-semibold">
                    {weeklyReport.sessionsCompleted} sessions
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Average Score:</span>
                  <span className="text-green-400 font-semibold">
                    {weeklyReport.averageScore.toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Learning Time:</span>
                  <span className="text-purple-400 font-semibold">
                    {weeklyReport.timeSpent} min
                  </span>
                </div>
                <button
                  onClick={() => navigate('/progress')}
                  className="w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  View Detailed Progress
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Target className="text-gray-400 mx-auto mb-2" size={32} />
                <p className="text-gray-400 text-sm">
                  Start playing to track your learning progress!
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Zap className="text-yellow-400" size={20} />
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate('/help')}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <HelpCircle className="text-blue-400" size={18} />
                <div>
                  <div className="text-white font-medium">Tutorial</div>
                  <div className="text-gray-400 text-sm">Learn how to play</div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/progress')}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <Trophy className="text-yellow-400" size={18} />
                <div>
                  <div className="text-white font-medium">Achievements</div>
                  <div className="text-gray-400 text-sm">View your rewards</div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/lobby')}
                className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
              >
                <Users className="text-green-400" size={18} />
                <div>
                  <div className="text-white font-medium">Game Lobby</div>
                  <div className="text-gray-400 text-sm">Join multiplayer games</div>
                </div>
              </button>
            </div>
          </div>

          {/* What You'll Learn */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Brain className="text-purple-400" size={20} />
              What You'll Learn
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                Financial literacy & cash flow management
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                Strategic planning & competitive analysis
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                Innovation & technology investment
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                Operations & supply chain management
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                Risk management & decision making
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
