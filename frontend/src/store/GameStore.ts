// frontend/src/store/gameStore.ts
// FIXED VERSION - Removed require() and fixed player ID handling

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import toast from 'react-hot-toast';

// Keep all your existing interfaces
export interface Player {
  id: string;
  socketId?: string;
  name: string;
  type: 'human' | 'ai';
  cash: number;
  score?: number;
  robots: Robot[];
  technologies: Technology[];
  businessModel: BusinessModel | null;
  dealerships: Dealership[];
  loans: Loan[];
  reputation: number;
  robotsBuiltThisRound: number;
  stats: PlayerStats;
  aiPersonality?: AIPersonality;
  isConnected?: boolean;
}

export interface Robot {
  id?: string;
  type: string;
  components: string[];
  productionRound: number;
  sold: boolean;
  cost?: number;
  salePrice?: number;
}

export interface Technology {
  name: string;
  level: 'basic' | 'advanced';
  benefit: number;
  rounds_remaining: number;
  cost?: number;
  acquired?: boolean;
}

export interface BusinessModel {
  name: string;
  cost: number;
  benefit: string;
  description: string;
}

export interface Dealership {
  type: string;
  cost: number;
  benefit: number;
  rounds_remaining: number;
}

export interface Loan {
  id?: string;
  amount: number;
  interestRate: number;
  roundsRemaining: number;
  remainingRounds?: number;
  monthlyPayment: number;
}

export interface PlayerStats {
  totalRevenue: number;
  totalProduction: number;
  successfulInnovations: number;
  roundsPlayed: number;
}

export interface AIPersonality {
  name: string;
  strategy: string;
  riskTolerance: string;
  preferredRobotType: string;
}

export interface GameState {
  id: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  players: Player[];
  currentRound: number;
  maxRounds?: number;
  currentPhase: 'startup' | 'r&d' | 'production' | 'sales' | 'investment';
  currentPlayerTurn: number;
  currentPlayerIndex?: number;
  gameSettings: GameSettings;
  settings?: GameSettings;
  marketConditions: MarketConditions;
  eventHistory: GameEvent[];
  winner?: Player;
  isStarted?: boolean;
  isFinished?: boolean;
}

export interface GameSettings {
  maxRounds: number;
  difficulty: 'beginner' | 'advanced';
  industry: string;
  allowAI: boolean;
  maxPlayers?: number;
  aiOpponents?: boolean;
  gameLength?: number;
}

export interface MarketConditions {
  demand: 'low' | 'medium' | 'high' | number;
  volatility: number;
  trends: string[];
  eventModifiers: any[];
  robotPrices?: Record<string, number>;
  techCosts?: Record<string, number>;
  economicFactor?: number;
}

export interface GameEvent {
  id: string;
  type: 'market' | 'technology' | 'competition' | 'tutorial';
  title: string;
  description: string;
  impact?: any;
  timestamp: Date;
  round: number;
}

export interface AITutoringResponse {
  explanation: string;
  example: string;
  gameApplication: string;
  tip: string;
  followUpQuestions: string[];
}

export interface AITutoring {
  concept: string;
  explanation: string;
  suggestions: string[];
  examples: string[];
}

// Define the shape of our game store
interface GameStore {
  // Current state
  isConnected: boolean;
  currentGame: GameState | null;
  currentPlayer: Player | null;
  currentPlayerId: string | null;
  isMyTurn: boolean;
  pendingMove: any | null;
  aiTutoring: AITutoringResponse | null;
  
  // Loading states
  isLoading: boolean;
  isProcessingMove: boolean;
  
  // Socket event handling
  socketEventHandlers: Map<string, Function>;
  
  // Actions
  setConnectionStatus: (connected: boolean) => void;
  setCurrentGame: (game: GameState | null) => void;
  setCurrentPlayer: (playerId: string | null) => void;
  updateGameState: (updates: Partial<GameState>) => void;
  setPendingMove: (move: any | null) => void;
  setAITutoring: (response: AITutoringResponse | AITutoring | null) => void;
  setLoading: (loading: boolean) => void;
  setProcessingMove: (processing: boolean) => void;
  
  // Socket management
  initializeSocketHandlers: () => void;
  cleanupSocketHandlers: () => void;
  
  // Game actions
  joinGame: (gameId: string, playerName: string) => Promise<void>;
  leaveGame: () => void;
  makeMove: (move: any) => Promise<void>;
  requestAIHelp: (concept: string, context: any) => Promise<void>;
  
  // Utility functions
  getMyPlayer: () => Player | null;
  isGameReady: () => boolean;
  canMakeMove: () => boolean;
  getCurrentPhaseInfo: () => { phase: string; description: string; actions: string[] };
}

// Create our game store using Zustand
export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    isConnected: false,
    currentGame: null,
    currentPlayer: null,
    currentPlayerId: null,
    isMyTurn: false,
    pendingMove: null,
    aiTutoring: null,
    isLoading: false,
    isProcessingMove: false,
    socketEventHandlers: new Map(),

    // FIXED: Socket event handler setup using dynamic import
    initializeSocketHandlers: async () => {
      try {
        // FIXED: Use dynamic import instead of require()
        const { SocketService } = await import('../services/SocketService');
        const handlers = new Map();

        // Handler for game state updates
        const gameUpdatedHandler = (gameState: GameState) => {
          console.log('🎮 GameStore: Received game state update:', gameState);
          
          if (gameState && gameState.id && gameState.players) {
            set({ currentGame: gameState });
            
            const currentPlayerId = get().currentPlayerId;
            if (currentPlayerId) {
              const myPlayer = gameState.players.find(p => p.id === currentPlayerId);
              if (myPlayer) {
                set({ currentPlayer: myPlayer });
              }
            }
            
            const myPlayer = get().getMyPlayer();
            if (myPlayer && gameState.players[gameState.currentPlayerTurn]) {
              const isMyTurn = gameState.players[gameState.currentPlayerTurn].id === myPlayer.id;
              set({ isMyTurn });
            }
            
            console.log('✅ GameStore: Game state updated successfully');
          } else {
            console.error('❌ GameStore: Invalid game state received:', gameState);
          }
        };

        // Handler for successful game join
        const joinSuccessHandler = (data: any) => {
          console.log('🎮 GameStore: Join success:', data);
          
          if (data.gameState) {
            set({ 
              currentGame: data.gameState,
              currentPlayerId: data.playerId,
              isLoading: false 
            });
            
            const myPlayer = data.gameState.players.find((p: Player) => p.id === data.playerId);
            if (myPlayer) {
              set({ currentPlayer: myPlayer });
            }
            
            toast.success('Successfully joined game!');
          }
        };

        // Handler for join errors
        const joinErrorHandler = (data: any) => {
          console.error('❌ GameStore: Join error:', data);
          set({ isLoading: false });
          toast.error(data.message || 'Failed to join game');
        };

        // Handler for move results
        const moveSuccessHandler = (data: any) => {
          console.log('✅ GameStore: Move successful:', data);
          set({ 
            isProcessingMove: false,
            pendingMove: null 
          });
          if (data.gameState) {
            set({ currentGame: data.gameState });
          }
        };

        const moveErrorHandler = (data: any) => {
          console.error('❌ GameStore: Move error:', data);
          set({ 
            isProcessingMove: false,
            pendingMove: null 
          });
          toast.error(data.message || 'Move failed');
        };

        // Handler for AI tutoring
        const aiTutoringHandler = (response: AITutoringResponse) => {
          console.log('🤖 GameStore: AI tutoring received:', response);
          set({ aiTutoring: response });
        };

        // Store handlers
        handlers.set('game-updated', gameUpdatedHandler);
        handlers.set('join-game-success', joinSuccessHandler);
        handlers.set('join-game-error', joinErrorHandler);
        handlers.set('move-success', moveSuccessHandler);
        handlers.set('move-error', moveErrorHandler);
        handlers.set('ai-tutoring', aiTutoringHandler);

        // Register with socket service
        handlers.forEach((handler, event) => {
          SocketService.on(event, handler);
        });

        set({ socketEventHandlers: handlers });
        console.log('🔧 GameStore: Socket event handlers initialized');
      } catch (error) {
        console.error('❌ GameStore: Failed to initialize socket handlers:', error);
      }
    },

    cleanupSocketHandlers: async () => {
      try {
        const { SocketService } = await import('../services/SocketService');
        const handlers = get().socketEventHandlers;
        
        handlers.forEach((handler, event) => {
          SocketService.off(event, handler);
        });
        
        set({ socketEventHandlers: new Map() });
        console.log('🧹 GameStore: Socket event handlers cleaned up');
      } catch (error) {
        console.error('❌ GameStore: Failed to cleanup socket handlers:', error);
      }
    },

    setConnectionStatus: (connected) => {
      set({ isConnected: connected });
      
      if (connected) {
        console.log('🔌 GameStore: Connected to server, initializing handlers');
        get().initializeSocketHandlers();
        toast.success('Connected to game server!');
      } else {
        console.log('🔌 GameStore: Disconnected from server, cleaning up handlers');
        get().cleanupSocketHandlers();
        toast.error('Lost connection to server');
      }
    },

    setCurrentGame: (game) => {
      console.log('🎮 GameStore: Setting current game:', game?.id);
      set({ currentGame: game });
      
      if (game) {
        const myPlayer = get().getMyPlayer();
        const currentPlayerIndex = game.currentPlayerIndex ?? game.currentPlayerTurn;
        const isMyTurn = myPlayer && game.players[currentPlayerIndex]?.id === myPlayer.id;
        set({ isMyTurn: Boolean(isMyTurn) });
      }
    },

    setCurrentPlayer: (playerId) => {
      console.log('👤 GameStore: Setting current player:', playerId);
      set({ currentPlayerId: playerId });
      
      const game = get().currentGame;
      if (game && playerId) {
        const player = game.players.find(p => p.id === playerId);
        set({ currentPlayer: player || null });
      } else {
        set({ currentPlayer: null });
      }
    },

    updateGameState: (updates) => {
      const currentGame = get().currentGame;
      if (currentGame) {
        const updatedGame = { ...currentGame, ...updates };
        set({ currentGame: updatedGame });
        
        const myPlayer = get().getMyPlayer();
        const currentPlayerIndex = updatedGame.currentPlayerIndex ?? updatedGame.currentPlayerTurn;
        const isMyTurn = myPlayer && updatedGame.players[currentPlayerIndex]?.id === myPlayer.id;
        set({ isMyTurn: Boolean(isMyTurn) });
      }
    },

    setPendingMove: (move) => set({ pendingMove: move }),
    
    setAITutoring: (response) => {
      if (response && 'concept' in response) {
        const converted: AITutoringResponse = {
          explanation: response.explanation,
          example: response.examples?.[0] || '',
          gameApplication: response.suggestions?.[0] || '',
          tip: response.suggestions?.[1] || '',
          followUpQuestions: response.suggestions || []
        };
        set({ aiTutoring: converted });
      } else {
        set({ aiTutoring: response as AITutoringResponse | null });
      }
    },
    
    setLoading: (loading) => set({ isLoading: loading }),
    setProcessingMove: (processing) => set({ isProcessingMove: processing }),

    // FIXED: Join game with proper event handling
    joinGame: async (gameId, playerName) => {
      try {
        set({ isLoading: true });
        console.log('🎮 GameStore: Joining game:', gameId, 'as', playerName);
        
        const { SocketService } = await import('../services/SocketService');
        
        if (get().socketEventHandlers.size === 0) {
          await get().initializeSocketHandlers();
        }
        
        SocketService.joinGame(gameId, playerName);
        console.log('📡 GameStore: Join request sent via socket');
        
      } catch (error) {
        console.error('❌ GameStore: Error joining game:', error);
        set({ isLoading: false });
        toast.error('Failed to join game');
      }
    },

    leaveGame: () => {
      get().cleanupSocketHandlers();
      set({
        currentGame: null,
        currentPlayer: null,
        currentPlayerId: null,
        isMyTurn: false,
        pendingMove: null,
        aiTutoring: null
      });
      toast.success('Left the game');
    },

    makeMove: async (move) => {
      const { currentGame, isMyTurn, isProcessingMove } = get();
      
      if (!currentGame || !isMyTurn || isProcessingMove) {
        toast.error('Cannot make move right now');
        return;
      }

      try {
        set({ isProcessingMove: true, pendingMove: move });
        
        const { SocketService } = await import('../services/SocketService');
        SocketService.makeMove(currentGame.id, move);
        
        console.log('🎯 GameStore: Move sent via socket:', move);
        
      } catch (error) {
        console.error('❌ GameStore: Error making move:', error);
        toast.error('Failed to make move');
        set({ pendingMove: null, isProcessingMove: false });
      }
    },

    requestAIHelp: async (concept, context) => {
      try {
        const { currentGame } = get();
        if (!currentGame) return;

        const { SocketService } = await import('../services/SocketService');
        SocketService.requestHelp(currentGame.id, concept, context);
        
        console.log('🤖 GameStore: AI help requested for:', concept);
        toast.success('AI tutor is preparing your explanation...');
      } catch (error) {
        console.error('❌ GameStore: Error requesting AI help:', error);
        toast.error('AI tutor is temporarily unavailable');
      }
    },

    // Utility functions
    getMyPlayer: () => {
      const { currentGame, currentPlayerId } = get();
      if (currentGame && currentPlayerId) {
        return currentGame.players.find(p => p.id === currentPlayerId) || null;
      }
      return null;
    },

    isGameReady: () => {
      const { currentGame } = get();
      return currentGame?.status === 'ready' || currentGame?.status === 'playing';
    },

    canMakeMove: () => {
      const { isMyTurn, isProcessingMove, currentGame } = get();
      return isMyTurn && !isProcessingMove && currentGame?.status === 'playing';
    },

    getCurrentPhaseInfo: () => {
      const { currentGame } = get();
      if (!currentGame) {
        return { phase: 'waiting', description: 'Waiting to start...', actions: [] };
      }

      const phaseInfo = {
        startup: {
          description: 'Collect your round income and prepare for business decisions',
          actions: ['Collect $50,000 income', 'Review market conditions', 'Plan your strategy']
        },
        'r&d': {
          description: 'Invest in new technologies to improve your robots',
          actions: ['Choose technology to research', 'Decide investment amount', 'Roll for success']
        },
        production: {
          description: 'Build robots based on your market predictions',
          actions: ['Select robot type', 'Choose components', 'Set production quantity']
        },
        sales: {
          description: 'Sell your robots to customers based on market demand',
          actions: ['Review market demand', 'Set pricing strategy', 'Complete sales']
        },
        investment: {
          description: 'Manage your financing through loans and investments',
          actions: ['Consider loan options', 'Pay existing debts', 'Plan next round']
        }
      };

      const currentPhase = currentGame.currentPhase;
      return {
        phase: currentPhase,
        description: phaseInfo[currentPhase]?.description || 'Unknown phase',
        actions: phaseInfo[currentPhase]?.actions || []
      };
    }
  }))
);

// Set up automatic reactions to state changes
useGameStore.subscribe(
  (state) => state.currentGame?.status,
  (status, previousStatus) => {
    if (status === 'playing' && previousStatus === 'ready') {
      toast.success('Game has started! Good luck!');
    } else if (status === 'finished') {
      const winner = useGameStore.getState().currentGame?.winner;
      if (winner) {
        const myPlayer = useGameStore.getState().getMyPlayer();
        if (winner.id === myPlayer?.id) {
          toast.success('🎉 Congratulations! You won the game!');
        } else {
          toast.success(`Game finished! ${winner.name} won this round.`);
        }
      }
    }
  }
);

useGameStore.subscribe(
  (state) => state.isMyTurn,
  (isMyTurn) => {
    if (isMyTurn) {
      toast.success("It's your turn! Make your move.");
    }
  }
);

// Game helpers remain unchanged
export const gameHelpers = {
  calculatePlayerAssets: (player: Player): number => {
    const robotValue = player.robots.filter(r => !r.sold).length * 100000;
    const techValue = player.technologies.reduce((sum, tech) => sum + 50000, 0);
    return player.cash + robotValue + techValue;
  },

  calculatePlayerDebt: (player: Player): number => {
    return player.loans.reduce((sum, loan) => sum + loan.amount, 0);
  },

  calculatePlayerNetWorth: (player: Player): number => {
    return gameHelpers.calculatePlayerAssets(player) - gameHelpers.calculatePlayerDebt(player);
  },

  getProductionCapacity: (player: Player, difficulty: string): number => {
    let baseCapacity = difficulty === 'beginner' ? 3 : 2;
    
    player.technologies.forEach(tech => {
      if (tech.name.includes('Factory') || tech.name.includes('Production')) {
        baseCapacity += 2;
      }
    });
    
    return baseCapacity;
  },

  getTechnologyBonus: (player: Player): number => {
    return player.technologies.reduce((bonus, tech) => bonus + tech.benefit, 0);
  },

  canAfford: (player: Player, cost: number): boolean => {
    return player.cash >= cost;
  },

  getRiskLevel: (player: Player): 'low' | 'medium' | 'high' => {
    const assets = gameHelpers.calculatePlayerAssets(player);
    const debt = gameHelpers.calculatePlayerDebt(player);
    
    if (assets === 0) return 'high';
    
    const debtRatio = debt / assets;
    if (debtRatio < 0.3) return 'low';
    if (debtRatio < 0.6) return 'medium';
    return 'high';
  },

  formatCurrency: (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount.toLocaleString()}`;
    }
  },

  getMarketDemandDescription: (demand: string | number): string => {
    if (typeof demand === 'number') {
      if (demand < 33) return 'Market is slow - focus on efficiency and cost reduction';
      if (demand < 66) return 'Steady market conditions - balanced approach recommended';
      return 'High demand - great time to maximize production and sales';
    }
    
    const descriptions = {
      low: 'Market is slow - focus on efficiency and cost reduction',
      medium: 'Steady market conditions - balanced approach recommended', 
      high: 'High demand - great time to maximize production and sales'
    };
    return descriptions[demand as keyof typeof descriptions] || 'Market conditions unclear';
  },

  calculateExpectedROI: (investment: number, benefit: number, duration: number): number => {
    const totalBenefit = benefit * duration;
    return ((totalBenefit - investment) / investment) * 100;
  }
};

export default useGameStore;
