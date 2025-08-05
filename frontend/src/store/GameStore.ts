// frontend/src/store/GameStore.ts
// FIXED VERSION - Added missing getRiskLevel function

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import toast from 'react-hot-toast';

// UPDATED: Player interface with funding fields
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
  // NEW: Funding-related fields
  equity?: number;
  fundingRounds?: FundingRound[];
  growthEffects?: GrowthEffect[];
  marketingEffects?: MarketingEffect[];
}

// NEW: Funding round interface
export interface FundingRound {
  round: number;
  type: 'equity' | 'debt' | 'pre-seed' | 'bootstrap';
  amount: number;
  equityGiven?: number;
  postMoneyEquity?: number;
  investor?: string;
  interestRate?: number;
  termRounds?: number;
  takenInRound?: number;
}

// NEW: Growth effects tracking
export interface GrowthEffect {
  type: string;
  value: number;
  duration: number;
  startedRound: number;
}

// NEW: Marketing effects tracking
export interface MarketingEffect {
  campaign: string;
  amount: number;
  roundStarted: number;
  duration: number;
  salesBoost: number;
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
  amountDue?: number;
  roundTaken?: number;
  repaid?: boolean;
  remainingAmount?: number;
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
  // UPDATED: New phase types including finished
  currentPhase: 'bootstrap' | 'funding' | 'r&d' | 'production' | 'sales' | 'growth' | 'finished';
  currentPlayerTurn: number;
  currentPlayerIndex?: number;
  gameSettings: GameSettings;
  settings?: GameSettings;
  marketConditions: MarketConditions;
  eventHistory: GameEvent[];
  winner?: Player;
  isStarted?: boolean;
  isFinished?: boolean;
  finalScores?: any[];
  createdAt?: string;
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
  type: 'market' | 'technology' | 'competition' | 'tutorial' | 'funding';
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

    // FIXED: Socket event handler setup with proper error handling
    initializeSocketHandlers: async () => {
      try {
        // Use dynamic import with proper error handling
        const socketModule = await import('../services/SocketService');
        const socketService = socketModule.socketService;
        
        // Verify socketService has the required methods
        if (!socketService || typeof socketService.on !== 'function') {
          console.error('❌ GameStore: socketService does not have required methods');
          return;
        }
        
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

        // Handler for successful game join - FIXED event names to match SocketService
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

        // Handler for market updates
        const marketUpdateHandler = (updateData: any) => {
          console.log('📊 GameStore: Market update received:', updateData);

          const currentGame = get().currentGame;
          if (currentGame && updateData.newConditions) {
            const updatedGame = {
              ...currentGame,
              marketConditions: updateData.newConditions,
              eventHistory: updateData.event ? 
                [...currentGame.eventHistory, updateData.event] : 
                currentGame.eventHistory
            };

            set({ currentGame: updatedGame });

            if (updateData.event) {
              toast.success(`📊 Market Update: ${updateData.event.title}`);
            }
          }
        };

        // Handler for game ending
        const gameEndedHandler = (endData: any) => {
          console.log('🏁 GameStore: Game ended:', endData);
          
          const currentGame = get().currentGame;
          if (currentGame) {
            const updatedGame = {
              ...currentGame,
              status: 'finished' as const,
              winner: endData.winner,
              finalScores: endData.finalScores,
              currentPhase: 'finished' as any
            };
            
            set({ currentGame: updatedGame });
            
            const myPlayer = get().getMyPlayer();
            if (endData.winner && myPlayer) {
              if (endData.winner.id === myPlayer.id) {
                toast.success('🎉 Congratulations! You WON the game!', { duration: 8000 });
              } else {
                toast.success(`🏁 Game finished! ${endData.winner.name} won!`, { duration: 6000 });
              }
            }
          }
        };

        // Store handlers with correct event names to match your SocketService
        handlers.set('game-updated', gameUpdatedHandler);
        handlers.set('join-success', joinSuccessHandler);      // Match SocketService event names
        handlers.set('join-error', joinErrorHandler);          // Match SocketService event names  
        handlers.set('move-success', moveSuccessHandler);
        handlers.set('move-error', moveErrorHandler);
        handlers.set('ai-tutoring', aiTutoringHandler);
        handlers.set('market-update', marketUpdateHandler);
        handlers.set('game-ended', gameEndedHandler);

        // Register with socket service - FIXED ERROR HANDLING
        try {
          handlers.forEach((handler, event) => {
            socketService.on(event, handler);
          });
          
          set({ socketEventHandlers: handlers });
          console.log('🔧 GameStore: Socket event handlers initialized successfully');
        } catch (error) {
          console.error('❌ GameStore: Error registering socket handlers:', error);
        }
        
      } catch (error) {
        console.error('❌ GameStore: Failed to initialize socket handlers:', error);
      }
    },

    cleanupSocketHandlers: async () => {
      try {
        const { socketService } = await import('../services/SocketService');
        const handlers = get().socketEventHandlers;
        
        handlers.forEach((handler, event) => {
          socketService.off(event, handler);
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

    // Join game with proper event handling
    joinGame: async (gameId, playerName) => {
      try {
        set({ isLoading: true });
        console.log('🎮 GameStore: Joining game:', gameId, 'as', playerName);
        
        const { socketService } = await import('../services/SocketService');
        
        if (get().socketEventHandlers.size === 0) {
          await get().initializeSocketHandlers();
        }
        
        socketService.joinGame(gameId, playerName);
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
        
        const { socketService } = await import('../services/SocketService');
        socketService.makeMove(currentGame.id, move);
        
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

        const { socketService } = await import('../services/SocketService');
        socketService.requestHelp(currentGame.id, concept, context);
        
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

    // UPDATED: getCurrentPhaseInfo with new phase structure and startup reality descriptions
    getCurrentPhaseInfo: () => {
      const { currentGame } = get();
      if (!currentGame) {
        return { phase: 'waiting', description: 'Waiting to start...', actions: [] };
      }

      const round = currentGame.currentRound;
      const phase = currentGame.currentPhase;

      // UPDATED: New phase descriptions that match startup reality
      const phaseInfo = {
        bootstrap: {
          description: 'Launch your startup with initial funding',
          actions: [
            'Collect $50,000 bootstrap funding', 
            'Set business foundation', 
            'Plan your MVP strategy'
          ]
        },
        funding: {
          description: 'Raise capital to scale your proven business model',
          actions: [
            'Choose funding type (equity vs debt)', 
            'Negotiate investment terms', 
            'Plan growth strategy with new capital'
          ]
        },
        'r&d': {
          description: round === 1 
            ? 'Develop your MVP and core technology'
            : 'Advance your technology for competitive advantage',
          actions: round === 1
            ? ['Choose core technologies', 'Build minimum viable product', 'Prove technical feasibility']
            : ['Invest in advanced features', 'Next-generation improvements', 'Maintain competitive edge']
        },
        production: {
          description: round === 1
            ? 'Build your first products to test the market'
            : 'Scale manufacturing to meet growing demand',
          actions: round === 1
            ? ['Build initial units', 'Test production process', 'Validate manufacturing approach']
            : ['Scale production capacity', 'Optimize manufacturing', 'Meet market demand']
        },
        sales: {
          description: round === 1
            ? 'Prove market demand with early customers'
            : 'Expand sales and capture market share',
          actions: round === 1
            ? ['Sell to early adopters', 'Prove product-market fit', 'Generate initial revenue']
            : ['Expand customer base', 'Capture market share', 'Maximize revenue']
        },
        growth: {
          description: round === 1
            ? 'Build market presence and operational foundation'
            : 'Scale operations and expand market reach',
          actions: round === 1
            ? ['Build brand awareness', 'Establish partnerships', 'Research market needs']
            : ['Scale marketing efforts', 'Enter new markets', 'Strategic initiatives']
        },
        // Legacy phase support for backwards compatibility
        startup: {
          description: round === 1 
            ? 'Collect your pre-seed funding and prepare for business'
            : 'Choose how to fund your growing company',
          actions: round === 1
            ? ['Collect $50,000 pre-seed funding', 'Review market conditions', 'Plan your strategy']
            : ['Select funding type', 'Review equity position', 'Consider market conditions']
        },
        investment: {
          description: 'Manage your financing through loans and investments',
          actions: ['Consider loan options', 'Pay existing debts', 'Plan next round']
        },
        finished: {
          description: 'Game completed! Review final results and rankings.',
          actions: ['View final scores', 'Compare company valuations', 'Review your journey']
        }
      };

      const currentPhaseInfo = phaseInfo[phase as keyof typeof phaseInfo];
      
      return {
        phase: phase,
        description: currentPhaseInfo?.description || 'Unknown phase',
        actions: currentPhaseInfo?.actions || []
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

// FIXED: Game helpers with added getRiskLevel function and error handling
export const gameHelpers = {
  calculatePlayerAssets: (player: Player): number => {
    const robotValue = player.robots?.filter(r => !r.sold).length * 100000 || 0;
    const techValue = player.technologies?.reduce((sum, tech) => sum + 50000, 0) || 0;
    return (player.cash || 0) + robotValue + techValue;
  },

  calculatePlayerDebt: (player: Player): number => {
    return player.loans?.reduce((sum, loan) => sum + (loan.remainingAmount || loan.amountDue || loan.amount), 0) || 0;
  },

  calculatePlayerNetWorth: (player: Player): number => {
    return gameHelpers.calculatePlayerAssets(player) - gameHelpers.calculatePlayerDebt(player);
  },

  // NEW: Calculate company valuation
  calculateCompanyValuation: (player: Player): number => {
    const cash = player.cash || 0;
    const robotInventoryValue = (player.robots?.filter(r => !r.sold).length || 0) * 100000;
    const technologyValue = (player.technologies?.length || 0) * 50000;
    const totalAssets = cash + robotInventoryValue + technologyValue;
    const industryMultiple = 2.5; // Simplified for beginners
    return totalAssets * industryMultiple;
  },

  // NEW: Calculate player ownership value
  calculateOwnershipValue: (player: Player): number => {
    const companyValuation = gameHelpers.calculateCompanyValuation(player);
    const ownershipPercentage = (player.equity || 100) / 100;
    return companyValuation * ownershipPercentage;
  },

  // NEW: Calculate total funding raised
  calculateTotalFundingRaised: (player: Player): number => {
    const fundingRounds = player.fundingRounds || [];
    return fundingRounds.reduce((total, round) => total + round.amount, 0);
  },

  // NEW: Get equity status color
  getEquityColor: (equity: number): string => {
    if (equity >= 80) return 'text-green-600';
    if (equity >= 60) return 'text-yellow-600';
    if (equity >= 50) return 'text-orange-600';
    return 'text-red-600';
  },

  // FIXED: Added missing getRiskLevel function
  getRiskLevel: (player: Player): 'low' | 'medium' | 'high' => {
    try {
      const netWorth = gameHelpers.calculatePlayerNetWorth(player);
      const debt = gameHelpers.calculatePlayerDebt(player);
      const equity = player.equity || 100;
      
      // Calculate risk based on debt ratio and equity position
      const debtRatio = netWorth > 0 ? debt / netWorth : 1;
      
      // High risk: High debt or lost majority control
      if (debtRatio > 0.7 || equity < 30) return 'high';
      
      // Medium risk: Moderate debt or minority control
      if (debtRatio > 0.3 || equity < 51) return 'medium';
      
      // Low risk: Low debt and majority control
      return 'low';
    } catch (error) {
      console.error('Error calculating risk level:', error);
      return 'medium'; // Default fallback
    }
  },

  getProductionCapacity: (player: Player, difficulty: string): number => {
    let baseCapacity = difficulty === 'beginner' ? 3 : 2;
    
    if (player.technologies) {
      player.technologies.forEach(tech => {
        if (tech.name?.includes('Factory') || tech.name?.includes('Production')) {
          baseCapacity += 2;
        }
      });
    }
    
    return baseCapacity;
  },

  getTechnologyBonus: (player: Player): number => {
    return player.technologies?.reduce((bonus, tech) => bonus + (tech.benefit || 0), 0) || 0;
  },

  canAfford: (player: Player, cost: number): boolean => {
    return (player.cash || 0) >= cost;
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

  // NEW: Calculate production capacity (mirrors backend logic)
  calculateProductionCapacity: (player: Player, currentRound: number = 1): number => {
    console.log(`🏭 Calculating production capacity for Round ${currentRound}:`, {
      cash: player.cash,
      fundingRounds: player.fundingRounds?.length || 0,
      totalRevenue: player.stats?.totalRevenue || 0
    });
    
    // Round 1: Limited capacity to prove concept
    if (currentRound === 1) {
      let baseCapacity = 3;
      const productionTechs = (player.technologies || []).filter(t => 
        t.name && (t.name.includes('Factory') || t.name.includes('Production'))
      );
      const techBonus = productionTechs.reduce((sum, tech) => sum + (tech.benefit || 0), 0);
      const finalCapacity = Math.floor(baseCapacity * (1 + techBonus * 0.1));
      
      console.log(`🏭 Round 1 capacity: ${finalCapacity} (base: ${baseCapacity}, tech bonus: ${techBonus})`);
      return finalCapacity;
    }
    
    // Round 2+: Scale based on funding and cash flow
    const playerCash = player.cash || 0;
    const totalFundingRaised = (player.fundingRounds || []).reduce((sum, round) => sum + round.amount, 0);
    const totalRevenue = player.stats?.totalRevenue || 0;
    
    let scaledCapacity = 5; // Base for Round 2+
    
    // Cash flow scaling (every $100k = +1 capacity)
    const cashBonus = Math.floor(playerCash / 100000);
    
    // Funding scaling (every $250k raised = +2 capacity)  
    const fundingBonus = Math.floor(totalFundingRaised / 250000) * 2;
    
    // Revenue scaling (every $500k revenue = +1 capacity)
    const revenueBonus = Math.floor(totalRevenue / 500000);
    
    // Technology scaling
    const productionTechs = (player.technologies || []).filter(t => 
      t.name && (t.name.includes('Factory') || t.name.includes('Production') || t.name.includes('Motors') || t.name.includes('Automation'))
    );
    const techBonus = productionTechs.length * 2; // Each production tech adds 2 capacity
    
    scaledCapacity += cashBonus + fundingBonus + revenueBonus + techBonus;
    
    // Reasonable maximum to prevent game breaking
    const maxCapacity = 25;
    const finalCapacity = Math.min(Math.max(1, scaledCapacity), maxCapacity);
    
    console.log(`🏭 Round ${currentRound} capacity calculation:`, {
      baseCapacity: 5,
      cashBonus,
      fundingBonus,
      revenueBonus,
      techBonus,
      scaledCapacity,
      finalCapacity
    });
    
    return finalCapacity;
  }
};

export default useGameStore;