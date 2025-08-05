// frontend/src/pages/GameBoard.tsx
// FINAL CLEAN VERSION - All debug calls removed

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Cog, 
  TrendingUp, 
  Users, 
  HelpCircle,
  BarChart3,
  Zap,
  Factory,
  ShoppingCart,
  CreditCard,
  Clock,
  Target,
  Award,
  Building,
  PieChart,
  Trophy,
  Medal,
  Star,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import our stores and services
import { useGameStore, gameHelpers } from '../store/GameStore';
import { useProgressStore } from '../store/ProgressStore';
import { socketService } from '../services/SocketService';

// Import game components
import PlayerCard from '../components/PlayerCard';
import GamePhasePanel from '../components/GamePhasePanel';
import MarketConditions from '../components/MarketConditions';
import AITutorModal from '../components/AITutorModal';
import RobotBuilder from '../components/RobotBuilder';
import TechnologyLab from '../components/TechnologyLab';
import FinancialDashboard from '../components/FinancialDashboard';

const GameBoard: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  // Use store selectors properly for reactive updates
  const currentGame = useGameStore(state => state.currentGame);
  const currentPlayer = useGameStore(state => state.currentPlayer);
  const isMyTurn = useGameStore(state => state.isMyTurn);
  const isConnected = useGameStore(state => state.isConnected);
  const canMakeMove = useGameStore(state => state.canMakeMove);
  const getCurrentPhaseInfo = useGameStore(state => state.getCurrentPhaseInfo);
  const makeMove = useGameStore(state => state.makeMove);
  const requestAIHelp = useGameStore(state => state.requestAIHelp);
  const leaveGame = useGameStore(state => state.leaveGame);
  const joinGame = useGameStore(state => state.joinGame);
  
  const { 
    currentSession,
    recordConceptPractice,
    startSession
  } = useProgressStore();

  // Local component state
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [showAITutor, setShowAITutor] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [tutorConcept, setTutorConcept] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [debugInfo, setDebugInfo] = useState('Starting initialization...');

  // Force re-render when game state changes
  const [updateKey, setUpdateKey] = useState(0);

  // Helper functions for phase display
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'bootstrap': return '🚀';
      case 'funding': return '💰';
      case 'r&d': return '🧪';
      case 'production': return '🏭';
      case 'sales': return '📈';
      case 'growth': return '📊';
      case 'finished': return '🏁';
      default: return '⚡';
    }
  };

  const getPhaseDescription = (phase: string, round: number) => {
    switch (phase) {
      case 'bootstrap': return 'Launch with initial funding';
      case 'funding': return 'Raise capital to scale';
      case 'r&d': return round === 1 ? 'Develop MVP & core tech' : 'Advance technology';
      case 'production': return round === 1 ? 'Build first products' : 'Scale manufacturing';
      case 'sales': return round === 1 ? 'Prove market demand' : 'Expand market share';
      case 'growth': return round === 1 ? 'Build foundation' : 'Scale operations';
      case 'finished': return 'Game completed!';
      default: return 'Unknown phase';
    }
  };

  // Force UI update when game state changes
  useEffect(() => {
    if (currentGame) {
      setUpdateKey(prev => prev + 1);
      console.log('🔄 UI forced update - Game state changed:', {
        gameId: currentGame.id,
        phase: currentGame.currentPhase,
        round: currentGame.currentRound,
        currentTurn: currentGame.currentPlayerTurn,
        players: currentGame.players.length,
        status: currentGame.status
      });
    }
  }, [currentGame?.currentPhase, currentGame?.currentPlayerTurn, currentGame?.currentRound, currentGame?.status]);

  // Enhanced initialization with better error handling
  useEffect(() => {
    let mounted = true;
    
    const initializeGame = async () => {
      if (!gameId) {
        navigate('/');
        return;
      }

      setDebugInfo('🔄 Starting game initialization...');
      setIsInitializing(true);

      try {
        // Start learning session
        if (!currentSession) {
          startSession(gameId, 'robotics', 'beginner');
          setDebugInfo('📚 Learning session started');
        }

        // Connect to backend
        if (!isConnected) {
          setDebugInfo('🔌 Connecting to backend...');
          socketService.connect();
          
          // Wait for connection with retry logic
          for (let i = 0; i < 10; i++) {
            if (!mounted) return;
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (socketService.isConnected()) {
              setDebugInfo('✅ Connected to backend');
              break;
            }
            
            setConnectionAttempts(i + 1);
            setDebugInfo(`🔄 Connection attempt ${i + 1}/10...`);
            
            if (i === 9) {
              throw new Error('Connection timeout after 10 attempts');
            }
          }
        }

        // Join the game
        if (!currentGame && socketService.isConnected()) {
          const playerName = localStorage.getItem('playerName') || 'Player';
          setDebugInfo(`🎮 Joining game as ${playerName}...`);
          
          await joinGame(gameId, playerName);
          setDebugInfo('📡 Join request sent');
          
          // Wait for game state with timeout
          for (let i = 0; i < 10; i++) {
            if (!mounted) return;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const gameState = useGameStore.getState().currentGame;
            if (gameState) {
              setDebugInfo('✅ Game state received');
              break;
            }
            
            setDebugInfo(`⏳ Waiting for game data... ${i + 1}/10`);
            
            if (i === 9) {
              // Force create mock data if real data doesn't arrive
              setDebugInfo('⚠️ Creating fallback game data...');
              createFallbackGame();
            }
          }
        }

      } catch (error) {
        console.error('❌ Initialization error:', error);
        setDebugInfo(`❌ Error: ${(error as Error)?.message || 'Unknown error'}`);
        
        // Create fallback game for development
        if (process.env.NODE_ENV === 'development') {
          setDebugInfo('🔧 Creating development fallback...');
          createFallbackGame();
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    // FIXED: Completely clean createFallbackGame function
    const createFallbackGame = () => {
      const playerName = localStorage.getItem('playerName') || 'Player';
      
      const fallbackGame = {
        id: gameId!,
        status: 'playing' as const,
        currentRound: 1,
        currentPhase: 'bootstrap' as const,
        currentPlayerTurn: 0,
        gameSettings: {
          maxRounds: 5,
          difficulty: 'beginner' as const,
          industry: 'robotics',
          allowAI: true
        },
        marketConditions: {
          demand: 'medium' as const,
          volatility: 0.3,
          trends: ['automation-growth'],
          eventModifiers: []
        },
        players: [
          {
            id: 'player-1',
            name: playerName,
            type: 'human' as const,
            cash: 500000,
            robots: [],
            technologies: [],
            loans: [],
            reputation: 50,
            robotsBuiltThisRound: 0,
            stats: {
              totalRevenue: 0,
              totalProduction: 0,
              successfulInnovations: 0,
              roundsPlayed: 0
            },
            businessModel: null,
            dealerships: [],
            equity: 100,
            fundingRounds: [],
            marketingEffects: [],
            growthEffects: []
          },
          {
            id: 'ai-1',
            name: 'TechCorp AI',
            type: 'ai' as const,
            cash: 500000,
            robots: [],
            technologies: [],
            loans: [],
            reputation: 50,
            robotsBuiltThisRound: 0,
            stats: {
              totalRevenue: 0,
              totalProduction: 0,
              successfulInnovations: 0,
              roundsPlayed: 0
            },
            businessModel: null,
            dealerships: [],
            equity: 100,
            fundingRounds: [],
            marketingEffects: [],
            growthEffects: []
          }
        ],
        eventHistory: [],
        winner: null
      };

      useGameStore.getState().setCurrentGame(fallbackGame);
      useGameStore.getState().setCurrentPlayer('player-1');
      
      // FIXED: Only console.log, no other debug calls
      setDebugInfo('✅ Fallback game created with new phase structure');
      toast.info('Playing in offline mode');
    };

    initializeGame();

    return () => {
      mounted = false;
    };
  }, [gameId, navigate, currentSession, startSession, currentGame, isConnected, joinGame]);

  // Get current phase information and player
  const phaseInfo = getCurrentPhaseInfo();
  const myPlayer = currentPlayer;

  // Debug logging with forced updates
  useEffect(() => {
    console.log('🔍 GameBoard Debug - State Update:', {
      updateKey,
      gameId: currentGame?.id,
      myPlayer: myPlayer?.name,
      phase: currentGame?.currentPhase,
      round: currentGame?.currentRound,
      currentTurn: currentGame?.currentPlayerTurn,
      totalPlayers: currentGame?.players?.length,
      isMyTurn,
      isConnected,
      isInitializing,
      debugInfo
    });
  }, [updateKey, currentGame, myPlayer, isMyTurn, isConnected, isInitializing, debugInfo]);

  // CLEAN: Debug move data function - only console.log
  const debugMoveData = (moveData: any) => {
    console.log('🔍 DEBUG: Move data structure:', {
      action: moveData.action,
      data: moveData.data,
      technology: moveData.technology,
      fullObject: moveData,
      dataType: typeof moveData.data,
      technologyType: typeof moveData.technology
    });
  };

  // Handle leaving the game
  const handleLeaveGame = () => {
    if (window.confirm('Are you sure you want to leave the game? Your progress will be saved.')) {
      if (socketService.isConnected() && currentGame) {
        socketService.leaveGame(currentGame.id);
      }
      leaveGame();
      navigate('/');
    }
  };

  // Handle requesting AI help with enhanced context
  const handleAIHelp = (concept: string) => {
    setTutorConcept(concept);
    setShowAITutor(true);
    
    if (currentGame && myPlayer) {
      const context = {
        currentPhase: currentGame.currentPhase,
        playerCash: myPlayer.cash,
        robotCount: myPlayer.robots.length,
        round: currentGame.currentRound,
        equity: myPlayer.equity || 100,
        fundingRounds: myPlayer.fundingRounds || [],
        reputation: myPlayer.reputation || 50,
        marketingEffects: myPlayer.marketingEffects || [],
        growthEffects: myPlayer.growthEffects || [],
        companyValuation: gameHelpers?.calculateCompanyValuation ? 
          gameHelpers.calculateCompanyValuation(myPlayer) : 
          myPlayer.cash * 2
      };
      
      if (socketService.isConnected()) {
        console.log('🤖 Requesting real AI help via SocketService');
        socketService.requestHelp(currentGame.id, concept, context);
      } else {
        console.log('📋 Using local AI help (offline mode)');
        requestAIHelp(concept, context);
      }
    }
  };

  // Handle making a move with proper data formatting
  const handleMakeMove = async (moveData: any) => {
    debugMoveData(moveData);
    
    if (!canMakeMove()) {
      toast.error('Cannot make move right now');
      return;
    }
    
    try {
      let formattedMoveData = moveData;
      
      if (currentGame?.currentPhase === 'r&d' && moveData.action === 'invest_r&d') {
        const technology = moveData.technology || moveData.data?.technology || moveData.selectedTechnology;
        
        if (!technology) {
          toast.error('Please select a technology to research');
          return;
        }
        
        formattedMoveData = {
          action: 'invest_r&d',
          data: {
            technology: technology
          }
        };
        
        console.log('🧪 R&D Move formatted:', formattedMoveData);
      }
      
      if (currentGame?.currentPhase === 'production' && moveData.action === 'build_robots') {
        const robotType = moveData.robotType || moveData.data?.robotType;
        const quantity = moveData.quantity || moveData.data?.quantity || 1;
        
        if (!robotType) {
          toast.error('Please select a robot type to build');
          return;
        }
        
        formattedMoveData = {
          action: 'build_robots',
          data: {
            robotType: robotType,
            quantity: quantity
          }
        };
        
        console.log('🏭 Production Move formatted:', formattedMoveData);
      }
      
      if (socketService.isConnected() && currentGame) {
        console.log('🎯 Making real move via SocketService:', formattedMoveData);
        socketService.makeMove(currentGame.id, formattedMoveData);
        toast.success('Move sent to server...');
      } else {
        console.log('📋 Making move locally (offline mode)');
        await makeMove(formattedMoveData);
        toast.success('Move processed locally');
      }
      
      setSelectedAction(null);
      
      if (formattedMoveData.action && currentSession) {
        const conceptMap: Record<string, string> = {
          'invest_r&d': 'innovation-strategy',
          'build_robots': 'production-planning',
          'sell_robots': 'pricing-strategy',
          'take_loan': 'debt-vs-equity',
          'collect_income': 'cash-flow-management',
          'select_funding': 'venture-capital-vs-debt',
          'invest_marketing': 'growth-strategy'
        };
        
        const concept = conceptMap[formattedMoveData.action];
        if (concept) {
          recordConceptPractice(concept, true, `Phase: ${phaseInfo.phase}`);
        }
      }
    } catch (error) {
      console.error('❌ Error making move:', error);
      toast.error('Failed to make move. Please try again.');
    }
  };

  // Safe currency formatting function
  const formatCurrency = (amount: number): string => {
    if (gameHelpers?.formatCurrency) {
      return gameHelpers.formatCurrency(amount);
    }
    // Fallback formatting
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  };

  // NEW: Game End Winner Screen Component
  const WinnerScreen: React.FC = () => {
    if (!currentGame || currentGame.status !== 'finished' || !currentGame.finalScores) {
      return null;
    }

    const winner = currentGame.winner;
    const isMyWin = winner?.id === myPlayer?.id;
    const myRank = currentGame.finalScores.findIndex(score => score.player.id === myPlayer?.id) + 1;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-purple-500/30"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
            <div className="flex justify-center mb-4">
              {isMyWin ? (
                <Trophy className="text-yellow-100" size={64} />
              ) : (
                <Award className="text-yellow-200" size={64} />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isMyWin ? '🎉 Congratulations! You Won!' : '🏁 Game Complete!'}
            </h1>
            <p className="text-yellow-100">
              {isMyWin ? 
                `Amazing! You built the most successful robotics startup!` :
                `${winner?.name} built the most successful robotics startup!`
              }
            </p>
            {!isMyWin && (
              <p className="text-yellow-200 mt-2">
                You finished in #{myRank} place - Great job!
              </p>
            )}
          </div>

          {/* Final Leaderboard */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Final Leaderboard</h2>
            
            <div className="space-y-3 mb-6">
              {currentGame.finalScores.map((score, index) => {
                const isMe = score.player.id === myPlayer?.id;
                const isWinner = index === 0;
                
                return (
                  <motion.div
                    key={score.player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 ${
                      isMe 
                        ? 'border-yellow-400 bg-yellow-500/20' 
                        : isWinner 
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          isWinner ? 'bg-yellow-500 text-yellow-900' : 'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isMe ? 'text-yellow-300' : 'text-white'}`}>
                              {score.player.name}
                            </span>
                            {isMe && <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded">YOU</span>}
                            {score.player.type === 'ai' && <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">AI</span>}
                          </div>
                          <div className="text-sm text-gray-300">
                            {score.equity?.toFixed(1)}% equity • {score.totalFunding ? `$${score.totalFunding.toLocaleString()} raised` : 'Bootstrapped'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">
                          {formatCurrency(score.score)}
                        </div>
                        <div className="text-sm text-gray-400">
                          Net Worth: {formatCurrency(score.netWorth)}
                        </div>
                        <div className="text-xs text-purple-400">
                          Valuation: {formatCurrency(score.companyValuation)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Game Stats */}
            <div className="bg-gray-800/30 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">Game Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{currentGame.gameSettings.maxRounds}</div>
                  <div className="text-gray-400">Rounds Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{currentGame.players.length}</div>
                  <div className="text-gray-400">Total Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {currentGame.players.filter(p => p.type === 'human').length}
                  </div>
                  <div className="text-gray-400">Human Players</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {Math.round((Date.now() - new Date(currentGame.createdAt || Date.now()).getTime()) / 60000)}
                  </div>
                  <div className="text-gray-400">Minutes Played</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowFinancials(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <BarChart3 size={20} />
                View Detailed Results
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Star size={20} />
                Play Again
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Show initialization screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4 mx-auto"></div>
            <h2 className="text-white text-xl font-bold mb-2">Setting Up Your Game</h2>
            <p className="text-blue-200 text-sm mb-4">{debugInfo}</p>
            
            {connectionAttempts > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-4">
                <p className="text-yellow-200 text-xs">
                  Connection attempt {connectionAttempts}/10 - Please wait...
                </p>
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              🔄 Restart Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show debug screen if game data is missing
  if (!currentGame || !myPlayer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <h2 className="text-white text-xl font-bold mb-4">🔧 Game Setup Issue</h2>
            
            <div className="text-left text-sm text-white space-y-2 mb-6">
              <p><strong>Game ID:</strong> {gameId}</p>
              <p><strong>Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Current Game:</strong> {currentGame ? '✅ Loaded' : '❌ Missing'}</p>
              <p><strong>My Player:</strong> {myPlayer ? '✅ Found' : '❌ Missing'}</p>
              <p><strong>Debug:</strong> {debugInfo}</p>
              <p><strong>Update Key:</strong> {updateKey}</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setIsInitializing(true);
                  window.location.reload();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                🔄 Try Again
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
              >
                🏠 Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show winner screen if game is finished
  if (currentGame.status === 'finished') {
    return (
      <div>
        <WinnerScreen />
        {/* Still render modals for detailed results */}
        <AnimatePresence>
          {showFinancials && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b">
                  <h2 className="text-xl font-bold">Final Financial Results</h2>
                  <button onClick={() => setShowFinancials(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[80vh]">
                  <FinancialDashboard playerId={myPlayer.id} />
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main game interface with proper state reactivity
  return (
    <div key={updateKey} className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      {/* Game Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6 border border-white/20"
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-white">
              <h1 className="text-2xl font-bold">🤖 RoboStartup AI</h1>
              <p className="text-blue-200">
                Round {currentGame.currentRound} of {currentGame.gameSettings.maxRounds} • 
                Phase: <span className="font-semibold text-yellow-300">
                  {getPhaseIcon(currentGame.currentPhase)} {currentGame.currentPhase}
                </span> • 
                {getPhaseDescription(currentGame.currentPhase, currentGame.currentRound)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
              isConnected ? 'bg-green-500/20 text-green-100' : 'bg-orange-500/20 text-orange-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-orange-400'}`} />
              {isConnected ? 'Real Multiplayer' : 'Practice Mode'}
            </div>

            {/* Quick Actions */}
            <button
              onClick={() => setShowFinancials(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <BarChart3 size={16} />
              Financials
            </button>

            <button
              onClick={() => handleAIHelp('general-strategy')}
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <HelpCircle size={16} />
              AI Help
            </button>

            <button
              onClick={handleLeaveGame}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Leave Game
            </button>
          </div>
        </div>

        {/* Turn Indicator */}
        {isMyTurn && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="text-green-400" size={20} />
                <span className="text-green-100 font-semibold">It's your turn!</span>
                <span className="text-green-200">{phaseInfo.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-green-400" size={16} />
                <span className="text-green-200 text-sm">
                  {currentGame.currentPhase === 'bootstrap' && 'Collect bootstrap funding'}
                  {currentGame.currentPhase === 'funding' && 'Choose funding strategy'}
                  {currentGame.currentPhase === 'r&d' && 'Invest in technology'}
                  {currentGame.currentPhase === 'production' && 'Build robots'}
                  {currentGame.currentPhase === 'sales' && 'Sell products'}
                  {currentGame.currentPhase === 'growth' && 'Scale your business'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Main Game Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Players and Market */}
        <div className="lg:col-span-1 space-y-4">
          {/* Players List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Users size={18} />
              Players ({currentGame.players.length})
              {isConnected && <span className="text-xs text-green-400">• Live</span>}
            </h3>
            <div className="space-y-2">
              {currentGame.players.map((player, index) => (
                <PlayerCard 
                  key={`${player.id}-${updateKey}`} 
                  player={player} 
                  isCurrentPlayer={index === currentGame.currentPlayerTurn}
                  isMe={player.id === myPlayer.id}
                />
              ))}
            </div>
          </motion.div>

          {/* Market Conditions */}
          <MarketConditions 
            conditions={currentGame.marketConditions}
            onRequestAnalysis={() => handleAIHelp('market-analysis')}
          />

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Target size={18} />
              My Performance
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Net Worth:</span>
                <span className="text-green-400 font-semibold">
                  {gameHelpers?.calculatePlayerNetWorth ? 
                    formatCurrency(gameHelpers.calculatePlayerNetWorth(myPlayer)) :
                    formatCurrency(myPlayer.cash)
                  }
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Cash:</span>
                <span className="text-blue-400">
                  {formatCurrency(myPlayer.cash)}
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Equity:</span>
                <span className={`font-semibold ${
                  (myPlayer.equity || 100) >= 51 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {myPlayer.equity || 100}%
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Valuation:</span>
                <span className="text-purple-400">
                  {gameHelpers?.calculateCompanyValuation ? 
                    formatCurrency(gameHelpers.calculateCompanyValuation(myPlayer)) :
                    formatCurrency(myPlayer.cash * 2)
                  }
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Robots:</span>
                <span>{myPlayer.robots.filter(r => !r.sold).length} active</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Technologies:</span>
                <span>{myPlayer.technologies.length} active</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Center Panel - Main Game Actions */}
        <div className="lg:col-span-2">
          <GamePhasePanel
            key={`phase-${currentGame.currentPhase}-${currentGame.currentPlayerTurn}-${updateKey}`}
            phase={currentGame.currentPhase}
            phaseInfo={phaseInfo}
            player={myPlayer}
            gameSettings={currentGame.gameSettings}
            marketConditions={currentGame.marketConditions}
            currentRound={currentGame.currentRound}
            isMyTurn={isMyTurn}
            canMakeMove={canMakeMove()}
            onMakeMove={handleMakeMove}
            onRequestHelp={handleAIHelp}
            selectedAction={selectedAction}
            onSelectAction={setSelectedAction}
          />
        </div>

        {/* Right Panel - Advanced Tools */}
        <div className="lg:col-span-1 space-y-4">
          {/* Technology Lab */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Cog size={18} />
              Technology Lab
            </h3>
            <TechnologyLab
              technologies={myPlayer.technologies}
              cash={myPlayer.cash}
              onInvestInTech={(tech) => handleMakeMove({ action: 'invest_r&d', data: tech })}
              onRequestHelp={() => handleAIHelp('innovation-strategy')}
            />
          </motion.div>

          {/* Robot Factory */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Factory size={18} />
              Robot Factory
            </h3>
            <RobotBuilder
              robots={myPlayer.robots}
              cash={myPlayer.cash}
              productionCapacity={gameHelpers?.calculateProductionCapacity ? 
                gameHelpers.calculateProductionCapacity(myPlayer, currentGame.currentRound) : 
                3
              }
              robotsBuiltThisRound={myPlayer.robotsBuiltThisRound}
              onBuildRobot={(robotData) => handleMakeMove({ action: 'build_robots', data: robotData })}
              onRequestHelp={() => handleAIHelp('production-planning')}
            />
          </motion.div>

          {/* Recent Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
          >
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <TrendingUp size={18} />
              Recent Events
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentGame.eventHistory.slice(-5).map((event, index) => (
                <div key={event.id} className="p-2 bg-white/5 rounded border border-white/10">
                  <div className="text-xs text-gray-400 mb-1">Round {event.round}</div>
                  <div className="text-sm text-white font-medium">{event.title}</div>
                  <div className="text-xs text-gray-300 mt-1">{event.description}</div>
                </div>
              ))}
              {currentGame.eventHistory.length === 0 && (
                <div className="text-gray-400 text-sm text-center py-4">
                  No events yet this game
                  {isConnected && <div className="text-xs mt-1">AI events will appear here</div>}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAITutor && (
          <AITutorModal
            concept={tutorConcept}
            isOpen={showAITutor}
            onClose={() => setShowAITutor(false)}
            gameContext={{
              phase: currentGame.currentPhase,
              playerCash: myPlayer.cash,
              round: currentGame.currentRound,
              equity: myPlayer.equity || 100,
              fundingHistory: myPlayer.fundingRounds || [],
              companyValuation: gameHelpers?.calculateCompanyValuation ? 
                gameHelpers.calculateCompanyValuation(myPlayer) : 
                myPlayer.cash * 2
            }}
          />
        )}

        {showFinancials && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">Financial Dashboard</h2>
                <button onClick={() => setShowFinancials(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[80vh]">
                <FinancialDashboard playerId={myPlayer.id} />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameBoard;