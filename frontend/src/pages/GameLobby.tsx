// frontend/src/pages/GameLobby.tsx
// Fixed API endpoints to match backend

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Settings, 
  Play, 
  Copy, 
  RefreshCw,
  Crown,
  Bot,
  User,
  Clock,
  Globe,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useGameStore } from '../store/GameStore';
import { socketService } from '../services/SocketService';

interface ActiveGame {
  id: string;
  status: 'waiting' | 'ready';
  playerCount: number;
  maxPlayers: number;
  difficulty: string;
  industry: string;
  createdAt: string;
}

const GameLobby: React.FC = () => {
  const navigate = useNavigate();
  const { currentGame, isConnected } = useGameStore();
  
  const [activeGames, setActiveGames] = useState<ActiveGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [error, setError] = useState<string | null>(null);

  // Load active games when component mounts
  useEffect(() => {
    loadActiveGames();
    const interval = setInterval(loadActiveGames, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Load list of active games - UPDATED ENDPOINT
  const loadActiveGames = async () => {
    try {
      // FIXED: Use correct backend endpoint
      const response = await fetch('http://localhost:5000/api/games/active');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setActiveGames(result.games || []);
        }
      } else {
        // If endpoint doesn't exist yet, show empty state
        setActiveGames([]);
      }
    } catch (error) {
      console.error('Error loading active games:', error);
      // Don't show error for missing endpoint during development
      setActiveGames([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Join existing game by code - UPDATED
  const handleJoinByCode = async () => {
    if (!gameCode.trim() || !playerName.trim()) {
      setError('Please enter both game code and your name');
      return;
    }

    try {
      setError(null);
      
      // Store player name
      localStorage.setItem('playerName', playerName.trim());
      
      // Navigate directly to game for now
      // In full implementation, this would use Socket.IO to join
      navigate(`/game/${gameCode.trim()}`);
      
    } catch (error) {
      setError('Failed to join game. Please check the game code.');
    }
  };

  // Join game from list - UPDATED
  const handleJoinGame = async (gameId: string) => {
    if (!playerName.trim()) {
      setError('Please enter your name first');
      return;
    }

    try {
      setError(null);
      
      // Store player name
      localStorage.setItem('playerName', playerName.trim());
      
      // Navigate to game
      navigate(`/game/${gameId}`);
      
    } catch (error) {
      setError('Failed to join game');
    }
  };

  // Copy game code to clipboard
  const copyGameCode = async (gameId: string) => {
    try {
      await navigator.clipboard.writeText(gameId);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy game code:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400 bg-yellow-500/20';
      case 'ready': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'advanced': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="text-white" size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Game Lobby</h1>
            <p className="text-gray-300">Join or create multiplayer games</p>
          </div>
        </div>

        {/* Connection Status */}
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-500/20 text-green-100 border border-green-500/30' 
            : 'bg-red-500/20 text-red-100 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          {isConnected ? 'Connected to server' : 'Connecting...'}
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Join Game Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Join by Code */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="text-blue-400" size={24} />
              Join Game by Code
            </h2>

            <div className="space-y-4">
              <div>
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

              <div>
                <label className="block text-white font-medium mb-2">Game Code</label>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter game code..."
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                  maxLength={15}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <AlertCircle className="text-red-400" size={16} />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleJoinByCode}
                disabled={!gameCode.trim() || !playerName.trim() || !isConnected}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                  gameCode.trim() && playerName.trim() && isConnected
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                <Play size={18} />
                Join Game
              </button>
            </div>
          </motion.div>

          {/* Active Games List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe className="text-green-400" size={24} />
                Active Games ({activeGames.length})
              </h2>
              <button
                onClick={loadActiveGames}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="text-white" size={16} />
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-gray-400">Loading active games...</p>
              </div>
            ) : activeGames.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeGames.map((game) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">Game {game.id.slice(-6).toUpperCase()}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(game.status)}`}>
                            {game.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                          <div className="flex items-center gap-4">
                            <span>Industry: {game.industry}</span>
                            <span className={getDifficultyColor(game.difficulty)}>
                              {game.difficulty}
                            </span>
                          </div>
                          <div>Created: {new Date(game.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-white font-semibold mb-2">
                          {game.playerCount}/{game.maxPlayers} players
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyGameCode(game.id)}
                            className="p-1 bg-gray-600 hover:bg-gray-700 rounded text-white transition-colors"
                            title="Copy game code"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleJoinGame(game.id)}
                            disabled={!playerName.trim() || game.playerCount >= game.maxPlayers}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              playerName.trim() && game.playerCount < game.maxPlayers
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Player slots visualization */}
                    <div className="flex gap-1">
                      {Array.from({ length: game.maxPlayers }).map((_, index) => (
                        <div
                          key={index}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                            index < game.playerCount
                              ? 'bg-green-500/30 text-green-400'
                              : 'bg-gray-500/30 text-gray-400'
                          }`}
                        >
                          {index < game.playerCount ? <User size={12} /> : ''}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="text-gray-400 mx-auto mb-3" size={48} />
                <p className="text-gray-400 text-lg">No active games</p>
                <p className="text-gray-500 text-sm">Be the first to create a game!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          {/* Create Game Button */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Crown className="text-yellow-400" size={20} />
              Host a Game
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              Create your own game and invite friends to join your business simulation.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Play size={18} />
              Create New Game
            </button>
          </div>

          {/* Game Rules */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Settings className="text-blue-400" size={20} />
              How Multiplayer Works
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex gap-2">
                <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                <span>Real-time turn-based gameplay</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                <span>Compete with up to 4 players</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                <span>AI opponents fill empty slots</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                <span>Share game codes with friends</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="text-green-400 mt-0.5 flex-shrink-0" size={14} />
                <span>Cross-platform compatible</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Clock className="text-purple-400" size={20} />
              Session Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300">Active Players:</span>
                <span className="text-purple-400 font-semibold">
                  {activeGames.reduce((sum, game) => sum + game.playerCount, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Open Games:</span>
                <span className="text-blue-400 font-semibold">{activeGames.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Server Status:</span>
                <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameLobby;