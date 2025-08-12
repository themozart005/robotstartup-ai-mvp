// backend/src/services/GameManager.js
// COMPLETE VERSION with funding logic, phase restructure, and growth investments

const EventEmitter = require('events');
const logger = require('../utils/logger');

class GameManager extends EventEmitter {
  constructor() {
    super();
    this.games = new Map();
    this.activeGames = this.games; // COMPATIBILITY: Alias for existing server.js code
    this.aiTurnTimeouts = new Map(); // Track timeouts for each AI player
    this.AI_TURN_TIMEOUT = 5000; // 5 seconds timeout
    this.maxRetries = 2; // Maximum retries before forcing skip
    this.io = null; // Will be set by setSocketIO
  }

  /**
   * Set Socket.IO instance for real-time communication
   */
  setSocketIO(io) {
    this.io = io;
    logger.info('🔌 Socket.IO instance attached to GameManager');
  }
  
  /**
   * Set AI service for market event generation
   */
  setAIService(aiService) {
    this.aiService = aiService;
    logger.info('🤖 AI Service attached to GameManager for market events');
  }

  /**
   * Create a new game - UPDATED to start with bootstrap phase
   */
  createGame(gameSettings, creatorId) {
    const gameId = this.generateGameId();
    
    const game = {
      id: gameId,
      status: 'waiting',
      currentRound: 1,
      currentPhase: 'bootstrap', // UPDATED: Start with bootstrap instead of startup
      currentPlayerTurn: 0,
      gameSettings: {
        maxRounds: gameSettings.maxRounds || 5,
        difficulty: gameSettings.difficulty || 'beginner',
        industry: gameSettings.industry || 'robotics',
        allowAI: gameSettings.allowAI !== false,
        maxPlayers: gameSettings.maxPlayers || 4,
        aiCount: gameSettings.aiCount || 3
      },
      marketConditions: {
        demand: 'medium',
        volatility: 0.3,
        trends: ['automation-growth'],
        eventModifiers: []
      },
      players: [],
      eventHistory: [],
      winner: null,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.games.set(gameId, game);
    logger.info(`🎮 Game created: ${gameId}`, { gameId, settings: gameSettings });
    
    return {
      gameId: gameId,
      gameState: game
    };
  }

  /**
   * Add player to game
   */
  addPlayerToGame(gameId, playerId, playerName, playerType = 'human') {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Check if player is rejoining (by name)
	const existingPlayer = game.players.find(p => p.name === playerName);
	if (existingPlayer) {
    // Update socket ID for reconnection
      existingPlayer.id = playerId;
      logger.info(`👤 Player ${playerName} reconnected to game ${gameId}`);
      return game;
	}
	
	if (game.status !== 'waiting') {
      throw new Error('Game has already started');
    }

    if (game.players.length >= game.gameSettings.maxPlayers) {
      throw new Error('Game is full');
    }

    

    const player = {
      id: playerId,
      name: playerName,
      type: playerType,
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
      // New funding fields
      equity: 100,
      fundingRounds: [],
      // New growth effects tracking
      growthEffects: []
    };

    game.players.push(player);
    game.lastActivity = new Date();

    logger.info(`👤 Player joined game: ${playerName}`, { gameId, playerId, playerType });

    if (game.gameSettings.allowAI && game.players.filter(p => p.type === 'human').length === 1) {
      this.addAIPlayers(game);
    }

    if (game.players.length >= 2) {
      this.startGame(gameId);
    }

    return game;
  }

  /**
   * Add AI players to fill empty slots
   */
  addAIPlayers(game) {
    const aiNames = [
      'TechCorp AI', 'RoboMax Industries', 'FutureBots Inc', 'CyberDyne Systems'
    ];

    const aiPersonalities = [
      { strategy: 'innovation_focused', riskTolerance: 'high' },
      { strategy: 'cost_efficient', riskTolerance: 'low' },
      { strategy: 'aggressive_growth', riskTolerance: 'very_high' },
      { strategy: 'balanced', riskTolerance: 'medium' }
    ];

    const targetAICount = Math.min(
      game.gameSettings.aiCount || 3,
      game.gameSettings.maxPlayers - game.players.length
    );
    
    for (let i = 0; i < targetAICount; i++) {
      const aiPlayer = {
        id: `ai-${Date.now()}-${i}`,
        name: aiNames[i] || `AI Player ${i + 1}`,
        type: 'ai',
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
        aiPersonality: aiPersonalities[i] || aiPersonalities[0],
        // New funding fields
        equity: 100,
        fundingRounds: [],
        // New growth effects tracking
        growthEffects: []
      };

      game.players.push(aiPlayer);
    }

    logger.info(`🤖 Added ${targetAICount} AI players to game ${game.id}`);
  }

  /**
   * Start the game
   */
  startGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    game.status = 'playing';
    game.lastActivity = new Date();
	
	// FIXED: Ensure human players go first
	const humanPlayerIndex = game.players.findIndex(p => p.type === 'human');
	if (humanPlayerIndex > 0) {
    // Move human player to front if not already there
	  const humanPlayer = game.players.splice(humanPlayerIndex, 1)[0];
	  game.players.unshift(humanPlayer);
	}
	
	// Human player is now at index 0
	game.currentPlayerTurn = 0;
	
    logger.info(`🚀 Game started: ${gameId}`, { 
      players: game.players.length,
      firstPlayer: game.players[0].name,
	  firstPlayerType: game.players[0].type
    });

    this.processTurn(gameId);
  }

  /**
   * Process current turn
   */
  async processTurn(gameId) {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'playing') return;

    const currentPlayer = game.players[game.currentPlayerTurn];
    if (!currentPlayer) return;

    game.lastActivity = new Date();

    logger.info(`🎯 Turn: ${currentPlayer.name} (${currentPlayer.type})`, {
      gameId,
      round: game.currentRound,
      phase: game.currentPhase,
      player: currentPlayer.name
    });

    if (currentPlayer.type === 'ai') {
      setTimeout(() => {
        this.processAITurn(gameId);
      }, 1000);
    }

    this.emit('turnStart', {
      gameId,
      playerId: currentPlayer.id,
      phase: game.currentPhase
    });
  }

  /**
   * Process AI turn
   */
  async processAITurn(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const currentPlayer = game.players[game.currentPlayerTurn];
    if (!currentPlayer || currentPlayer.type !== 'ai') return;

    try {
      const result = await this.processAITurnWithTimeout(game, currentPlayer);
      
      if (result.success) {
        this.broadcastGameState(gameId, game);
        
        setTimeout(() => {
          this.advanceToNextTurn(gameId);
        }, 1000);
        
      } else {
        logger.error(`❌ AI turn failed for ${currentPlayer.name}, advancing anyway`);
        this.advanceToNextTurn(gameId);
      }
      
    } catch (error) {
      logger.error(`💥 Critical AI turn error for ${currentPlayer.name}:`, error);
      this.advanceToNextTurn(gameId);
    }
  }

  /**
   * Process AI turn with timeout handling
   */
  async processAITurnWithTimeout(game, currentPlayer) {
    const playerId = currentPlayer.id;
    
    try {
      logger.info(`🤖 ${currentPlayer.name}'s turn - processing AI move...`);
      
      this.clearAITimeout(playerId);
      
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          logger.warn(`⏰ AI timeout for ${currentPlayer.name} after 5 seconds`);
          reject(new Error('AI_TIMEOUT'));
        }, this.AI_TURN_TIMEOUT);
        
        this.aiTurnTimeouts.set(playerId, timeoutId);
      });
      
      const aiDecisionPromise = this.makeSmartAIDecision(game, currentPlayer);
      
      try {
        const aiMove = await Promise.race([aiDecisionPromise, timeoutPromise]);
        
        this.clearAITimeout(playerId);
        
        const validation = this.validateAIMoveAffordability(currentPlayer, aiMove);
        if (!validation.valid) {
          logger.warn(`💰 ${currentPlayer.name} can't afford move: ${validation.reason}`);
          const cheaperMove = this.getCheaperAlternative(game, currentPlayer, aiMove);
          if (cheaperMove) {
            return await this.executeAIMove(game, currentPlayer, cheaperMove);
          } else {
            return await this.forceSkipAITurn(game, currentPlayer);
          }
        }
        
        return await this.executeAIMove(game, currentPlayer, aiMove);
        
      } catch (error) {
        this.clearAITimeout(playerId);
        
        if (error.message === 'AI_TIMEOUT') {
          logger.warn(`⏰ ${currentPlayer.name} timed out - using fallback`);
          return await this.handleAITimeout(game, currentPlayer);
        } else {
          logger.error(`❌ AI decision error for ${currentPlayer.name}: ${error.message}`);
          return await this.handleAIError(game, currentPlayer, error);
        }
      }
      
    } catch (error) {
      logger.error(`💥 Critical error in AI turn for ${currentPlayer.name}:`, error);
      return await this.forceSkipAITurn(game, currentPlayer);
    }
  }

  /**
   * Make smart AI decision with budget awareness - UPDATED for new phases
   */
  async makeSmartAIDecision(game, currentPlayer) {
    logger.info(`🧠 ${currentPlayer.name} is thinking... (${game.currentPhase} phase)`);
    
    const playerCash = currentPlayer.cash;
    const phase = game.currentPhase;
    
    const affordableOptions = this.getAffordableOptions(game, currentPlayer);
    
    if (affordableOptions.length === 0 && phase !== 'bootstrap' && phase !== 'funding') {
      logger.warn(`💸 ${currentPlayer.name} has no affordable options (cash: ${playerCash})`);
      return this.getFallbackMove(game, currentPlayer);
    }
    
    let aiMove;
    
    switch (phase) {
      case 'bootstrap':
        // Round 1 only: collect bootstrap funding
        aiMove = { action: 'collect_income', data: {} };
        break;
        
      case 'funding':
        // Round 2+ only: funding decision
        const fundingChoice = this.makeAIFundingDecision(currentPlayer);
        aiMove = {
          action: 'select_funding',
          data: fundingChoice
        };
        break;
        
      case 'r&d':
        const cheapestTech = affordableOptions.find(opt => opt.type === 'technology');
        if (cheapestTech) {
          aiMove = {
            action: 'invest_r&d',
            data: { technology: cheapestTech.name }
          };
        } else {
          aiMove = { action: 'skip_r&d', data: { reason: 'insufficient_funds' } };
        }
        break;
        
      case 'production':
        const affordableRobot = affordableOptions.find(opt => opt.type === 'robot');
        if (affordableRobot) {
          const maxQuantity = Math.floor(playerCash / affordableRobot.cost);
          const quantity = Math.min(maxQuantity, 2);
          
          aiMove = {
            action: 'build_robots',
            data: {
              robotType: affordableRobot.robotType,
              quantity: quantity,
              components: []
            }
          };
        } else {
          aiMove = { action: 'skip_production', data: { reason: 'insufficient_funds' } };
        }
        break;
        
      case 'sales':
        const unsoldRobots = currentPlayer.robots.filter(r => !r.sold);
        if (unsoldRobots.length > 0) {
          aiMove = {
            action: 'sell_robots',
            data: { 
              robotIds: unsoldRobots.slice(0, 3).map(r => r.id),
              quantity: Math.min(3, unsoldRobots.length)
            }
          };
        } else {
          aiMove = { action: 'skip_sales', data: { reason: 'no_robots_to_sell' } };
        }
        break;
        
      case 'growth':
        // NEW: AI growth investment logic
        const growthChoice = this.makeAIGrowthDecision(game, currentPlayer);
        aiMove = {
          action: 'invest_marketing',
          data: growthChoice
        };
        break;
        
      default:
        aiMove = { action: 'skip_phase', data: { reason: 'unknown_phase' } };
    }
    
    logger.info(`🤖 ${currentPlayer.name} decided: ${aiMove.action}`);
    return aiMove;
  }

  /**
   * Make AI funding decision for rounds 2+
   */
  makeAIFundingDecision(player) {
    const currentEquity = player.equity || 100;
    const cash = player.cash;
    
    // AI personality affects funding preference
    const personality = player.aiPersonality;
    const isAggressive = personality && personality.riskTolerance === 'very_high';
    const isConservative = personality && personality.riskTolerance === 'low';
    
    // Conservative AI skips funding if has enough cash
    if (isConservative && cash > 300000) {
      return {
        fundingType: 'skip'
      };
    }
    
    // Aggressive AI takes bigger funding rounds
    if (isAggressive && currentEquity > 70) {
      return {
        fundingType: 'equity',
        amount: 500000,
        equityGiven: 30,
        investorName: 'Series B'
      };
    }
    
    // Normal AI logic
    if (cash < 200000 && currentEquity > 80) {
      // Need money and have equity to spare
      return {
        fundingType: 'equity',
        amount: 250000,
        equityGiven: 20,
        investorName: 'Series A'
      };
    } else if (cash < 150000 && currentEquity > 60) {
      // Getting desperate but still have control
      return {
        fundingType: 'equity',
        amount: 100000,
        equityGiven: 10,
        investorName: 'Seed Extension'
      };
    } else if (cash < 100000 && player.loans.length === 0) {
      // Low on cash and equity, take a loan
      return {
        fundingType: 'debt',
        amount: 200000,
        interestRate: 0.08,
        termRounds: 5
      };
    } else {
      // Skip funding this round
      return {
        fundingType: 'skip'
      };
    }
  }

  /**
   * NEW: makeAIGrowthDecision - AI logic for growth phase
   */
  makeAIGrowthDecision(game, player) {
    const cash = player.cash;
    const round = game.currentRound;
    const personality = player.aiPersonality;
    
    const growthOptions = this.getGrowthOptions(round);
    const affordableOptions = growthOptions.filter(opt => opt.cost <= cash);
    
    if (affordableOptions.length === 0) {
      return { investmentType: 'skip_growth' };
    }
    
    // AI personality affects growth choices
    const isAggressive = personality && personality.riskTolerance === 'very_high';
    const isConservative = personality && personality.riskTolerance === 'low';
    
    if (round === 1) {
      // Round 1: Build foundation
      if (isAggressive && cash > 30000) {
        return { investmentType: 'partnerships', amount: 30000 };
      } else if (cash > 25000 && !isConservative) {
        return { investmentType: 'brand_awareness', amount: 25000 };
      } else if (cash > 15000) {
        return { investmentType: 'market_research', amount: 15000 };
      } else {
        return { investmentType: 'skip_growth' };
      }
    } else {
      // Round 2+: Scale operations
      if (isAggressive && cash > 100000) {
        return { investmentType: 'strategic_partnerships', amount: 100000 };
      } else if (cash > 75000 && !isConservative) {
        return { investmentType: 'digital_marketing', amount: 75000 };
      } else if (cash > 50000) {
        return { investmentType: 'trade_shows', amount: 50000 };
      } else {
        return { investmentType: 'skip_growth' };
      }
    }
  }

  /**
   * Get affordable options for AI player
   */
  getAffordableOptions(game, currentPlayer) {
    const playerCash = currentPlayer.cash;
    const phase = game.currentPhase;
    const options = [];
    
    if (phase === 'r&d') {
      const technologies = [
        { name: 'Basic Sensors', cost: 50000, type: 'technology' },
        { name: 'Standard Motors', cost: 75000, type: 'technology' },
        { name: 'Simple AI', cost: 100000, type: 'technology' },
        { name: 'Advanced Arms', cost: 120000, type: 'technology' },
        { name: 'AI Navigation', cost: 150000, type: 'technology' }
      ];
      
      technologies.forEach(tech => {
        if (playerCash >= tech.cost) {
          options.push(tech);
        }
      });
    }
    
    if (phase === 'production') {
      const robotTypes = [
        { robotType: 'service', cost: 100000, type: 'robot' },
        { robotType: 'mobile', cost: 120000, type: 'robot' },
        { robotType: 'industrial', cost: 150000, type: 'robot' },
        { robotType: 'humanoid', cost: 200000, type: 'robot' },
        { robotType: 'medical', cost: 250000, type: 'robot' }
      ];
      
      robotTypes.forEach(robot => {
        if (playerCash >= robot.cost) {
          options.push(robot);
        }
      });
    }
    
    return options;
  }

  /**
   * Process a player move - UPDATED for new phases
   */
  async processPlayerMove(gameId, playerId, move) {
	logger.info('🚨🚨🚨 processPlayerMove START', {
	  gameId: gameId,
      playerId: playerId,
      moveAction: move?.action,
      moveData: JSON.stringify(move?.data)
	});
	
	const game = this.games.get(gameId);
    if (!game) {
      logger.error('🚨 Game not found:', gameId);
      return { success: false, error: 'Game not found' };
	}

    // Try to find player by ID first
	let player = game.players.find(p => p.id === playerId);

	// If not found, try to match by socket ID pattern and update
	if (!player) {
  // Socket IDs have a similar pattern, try to find any human player
  // This is a temporary fix for reconnection issues
	  const humanPlayers = game.players.filter(p => p.type === 'human');
      if (humanPlayers.length === 1) {
        player = humanPlayers[0];
		player.id = playerId; // Update to new socket ID
		logger.info(`🔄 Updated player ${player.name} to new socket ID: ${playerId}`);
	  }
	}

	if (!player) {
      logger.error('🚨 Player not found:', playerId);
      return { success: false, error: 'Player not found' };
	}
	
	// LOG THE CURRENT PHASE
	logger.info('🚨🚨🚨 GAME STATE CHECK', {
      currentPhase: game.currentPhase,
      currentRound: game.currentRound,
      requestedAction: move.action,
      phaseIsInvestment: game.currentPhase === 'investment',
      phaseIsGrowth: game.currentPhase === 'growth'
	});
	
	// HANDLE invest_marketing BEFORE THE SWITCH - THIS IS THE FIX
	if (move.action === 'invest_marketing') {
      logger.info('🚨🚨🚨 INTERCEPTING invest_marketing action');
    
    // Check if we're in investment or growth phase
	  if (game.currentPhase === 'investment' || game.currentPhase === 'growth') {
        logger.info('✅ Phase check passed for invest_marketing');
      
      // Check turn (skip for bootstrap, but check for other phases)
        const currentPlayer = game.players[game.currentPlayerTurn];
        if (currentPlayer.id !== playerId) {
          logger.error('❌ Not player turn');
          return { success: false, error: 'Not your turn' };
		}
      
      // Process the investment
		const result = this.processGrowthInvestment(game, player, move.data);
      
		if (result.success) {
          logger.info('✅ Growth investment successful');
          if (player.type !== 'ai') {
            this.advanceToNextTurn(gameId);
          }
          return {
            success: true,
            message: result.message || 'Investment processed successfully',
            gameState: game,
            moveResult: result
          };
        } else {
          logger.error('❌ Growth investment failed:', result.error);
          return { success: false, error: result.error };
		}
      } else {
        logger.error('❌ Wrong phase for invest_marketing:', game.currentPhase);
        return { 
          success: false, 
          error: `Marketing investments only available in growth/investment phase (current: ${game.currentPhase})` 
		};
      }
	}

	
	
    // FIXED: Special handling for bootstrap phase
	if (move.action === 'collect_income' && game.currentPhase === 'bootstrap' && game.currentRound === 1) {
		// Bootstrap phase - no turn restriction, but check if already collected
	  if (player.cash > 500000) {
        return { success: false, error: 'Bootstrap funding already collected' };
      }
	} else {
    // Normal turn checking for other phases
	  const currentPlayer = game.players[game.currentPlayerTurn];
      if (currentPlayer.id !== playerId) {
        return { success: false, error: 'Not your turn' };
      }
	}

    game.lastActivity = new Date();

    try {
      let result;
      // LOG RIGHT BEFORE SWITCH
	  logger.info('🎯 Entering switch statement', {
        action: move.action,
        phase: game.currentPhase
	  });
      switch (move.action) {
        case 'collect_income':
          logger.info('✅ MATCHED: collect_income');
          if (game.currentPhase !== 'bootstrap') {
            return { success: false, error: 'Bootstrap funding only available in Round 1' };
          }
          result = this.processIncomeCollection(game, player);
          break;
        
		case 'select_funding':
          logger.info('✅ MATCHED: select_funding');
          if (game.currentPhase !== 'funding') {
            return { success: false, error: 'Funding selection only available in funding phase' };
          }
          result = this.processFundingSelection(game, player, move.data);
          break;
        
		case 'invest_marketing':
        // This case should never be reached now because we handle it above
          logger.warn('⚠️ invest_marketing reached switch - should have been handled above');
          if (game.currentPhase !== 'growth' && game.currentPhase !== 'investment') {
            return { success: false, error: 'Marketing investments only available in growth/investment phase' };
          }
          result = this.processGrowthInvestment(game, player, move.data);
          break;
        
		case 'take_loan':
          logger.info('✅ MATCHED: take_loan');
          if (game.currentPhase !== 'funding' || game.currentRound === 1) {
            return { success: false, error: 'Business loans only available for established companies (Round 2+)' };
          }
          result = this.processLoanApplication(game, player, move.data);
          break;
        
		case 'invest_r&d':
          logger.info('✅ MATCHED: invest_r&d');
          result = this.processRnDInvestment(game, player, move.data);
          break;
        
		case 'build_robots':
          logger.info('✅ MATCHED: build_robots');
          result = this.processRobotProduction(game, player, move.data);
          break;
        
		case 'sell_robots':
          logger.info('✅ MATCHED: sell_robots');
          result = this.processRobotSales(game, player, move.data);
          break;
        
		case 'skip_bootstrap':
		case 'skip_funding': 
		case 'skip_r&d':
		case 'skip_production':
		case 'skip_sales':
		case 'skip_growth':
		case 'skip_investment':
		case 'skip_phase':
          logger.info('✅ MATCHED: skip action -', move.action);
          result = this.processSkip(game, player, move.data);
          break;
        
		default:
          logger.error('❌ NO MATCH in switch for action:', move.action);
          return { success: false, error: 'Invalid action' };
	  }

      if (result.success) {
        if (player.type === 'ai') {
          return {
            success: true,
            message: result.message || 'AI move processed successfully',
            gameState: game,
            moveResult: result
          };
        } else {
          this.advanceToNextTurn(gameId);
        }
        
        return {
          success: true,
          message: result.message || 'Move processed successfully',
          gameState: game,
          moveResult: result
        };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      logger.error('Error processing player move:', error);
      return { success: false, error: 'Failed to process move' };
    }
  }

  /**
   * Process income collection - UPDATED for bootstrap phase
   */
  processIncomeCollection(game, player) {
    if (game.currentPhase !== 'bootstrap') {
      return { success: false, error: 'Invalid phase for bootstrap funding' };
    }

    // Only give automatic income in round 1
    if (game.currentRound === 1) {
      const income = 50000; // Bootstrap money (friends & family)
      player.cash += income;
      
      logger.info(`💰 ${player.name} collected bootstrap funding: ${income}`);
      
      return {
        success: true,
        message: `Collected $50,000 bootstrap funding from friends & family!`,
        income: income,
        fundingType: 'bootstrap'
      };
    } else {
      return { 
        success: false, 
        error: 'Bootstrap funding only available in Round 1' 
      };
    }
  }

  /**
   * Process funding selection (venture capital or loan) - NEW METHOD
   */
  processFundingSelection(game, player, data) {
    if (game.currentPhase !== 'funding' || game.currentRound === 1) {
      return { success: false, error: 'Invalid phase for funding selection' };
    }

    const { fundingType, amount, equityGiven, interestRate, termRounds } = data;

    if (fundingType === 'equity') {
      // Process venture capital
      if (!player.equity) player.equity = 100; // Initialize if not present
      
      const newEquity = player.equity - equityGiven;
      if (newEquity < 50) {
        return { success: false, error: 'Cannot dilute below 50% ownership' };
      }

      player.cash += amount;
      player.equity = newEquity;
      
      // Track funding round
      if (!player.fundingRounds) player.fundingRounds = [];
      player.fundingRounds.push({
        round: game.currentRound,
        type: 'equity',
        amount: amount,
        equityGiven: equityGiven,
        postMoneyEquity: newEquity,
        investor: data.investorName || 'Venture Capital'
      });

      logger.info(`💵 ${player.name} raised ${amount} for ${equityGiven}% equity`);

      return {
        success: true,
        message: `Successfully raised $${amount.toLocaleString()} in ${data.investorName || 'venture funding'}!`,
        funding: {
          type: 'equity',
          amount: amount,
          equityGiven: equityGiven,
          newEquity: newEquity
        }
      };

    } else if (fundingType === 'debt') {
      // Process loan
      const loan = {
        id: `loan-${Date.now()}`,
        amount: amount,
        interestRate: interestRate,
        roundTaken: game.currentRound,
        roundsDue: termRounds,
        totalDue: Math.floor(amount * (1 + interestRate)),
        monthlyPayment: Math.floor((amount * (1 + interestRate)) / termRounds)
      };

      player.loans.push(loan);
      player.cash += amount;

      logger.info(`💳 ${player.name} took a loan of ${amount}`);

      return {
        success: true,
        message: `Successfully obtained SBA loan of $${amount.toLocaleString()}`,
        funding: {
          type: 'debt',
          loan: loan
        }
      };

    } else if (fundingType === 'skip') {
      // Bootstrap - no funding
      logger.info(`🚀 ${player.name} chose to bootstrap this round`);

      return {
        success: true,
        message: 'Continuing with bootstrap funding - no dilution or debt!',
        funding: {
          type: 'skip'
        }
      };
    }

    return { success: false, error: 'Invalid funding type' };
  }

  /**
   * NEW: processGrowthInvestment - Replaces old marketing investment
   */
  processGrowthInvestment(game, player, data) {
	logger.info('🚨 processGrowthInvestment called', {
      phase: game.currentPhase,
      investmentType: data?.investmentType,
      amount: data?.amount
	});
    if (game.currentPhase !== 'growth' && game.currentPhase !== 'investment')  {
	  logger.error('❌ Invalid phase for growth investment:', game.currentPhase);
      return { success: false, error: 'Invalid phase for growth investment' };
    }

    const { investmentType, amount } = data;
    const round = game.currentRound;
    
    // Validate investment type - include ALL valid types
	const validInvestmentTypes = [
	  'brand_awareness',
      'customer_acquisition', 
      'market_research',
      'product_improvement',
      'operational_efficiency',
      'international_expansion',
      'strategic_partnership',
      'automation',
      'customer_retention',
      'digital_marketing',
      'trade_shows',
      'strategic_partnerships',
      'partnerships',
      'skip_growth'
	];

	if (!validInvestmentTypes.includes(investmentType)) {
      logger.error('❌ Invalid investment type:', investmentType);
      return { success: false, error: `Invalid investment type: ${investmentType}` };
	}

// Get the option details if it exists in current round options
	const growthOptions = this.getGrowthOptions(round);
	const selectedOption = growthOptions.find(opt => opt.id === investmentType) || {
	  id: investmentType,
	  name: investmentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
	  cost: amount || 50000,
      effects: { reputation: 5, futuresalesBoost: 0.1 }
	};

    const investmentAmount = amount || selectedOption.cost;
	if (player.cash < investmentAmount) {
	  return { success: false, error: 'Insufficient funds for growth investment' };
	}

    player.cash -= investmentAmount;
    
    // Apply growth effects
    if (selectedOption.effects.reputation) {
      player.reputation += selectedOption.effects.reputation;
    }
    
    if (selectedOption.effects.futuresalesBoost) {
      if (!player.growthEffects) player.growthEffects = [];
      player.growthEffects.push({
        type: 'sales_boost',
        value: selectedOption.effects.futuresalesBoost,
        duration: 2,
        startedRound: round
      });
    }

    logger.info(`📈 ${player.name} invested ${selectedOption.cost} in ${selectedOption.name}`);

    return {
      success: true,
      message: `Successfully invested $${selectedOption.cost.toLocaleString()} in ${selectedOption.name}!`,
      investment: {
        type: investmentType,
        name: selectedOption.name,
        cost: selectedOption.cost,
        effects: selectedOption.effects
      }
    };
  }

  /**
   * NEW: getGrowthOptions - Different options for each round
   */
  getGrowthOptions(round) {
    if (round === 1) {
      return [
        {
          id: 'brand_awareness',
          name: 'Brand Awareness Campaign',
          cost: 25000,
          description: 'Build market recognition and customer trust',
          effects: { reputation: 5, futuresalesBoost: 0.1 },
          icon: '📢'
        },
        {
          id: 'market_research',
          name: 'Market Research',
          cost: 15000,
          description: 'Deep customer insights to guide product development',
          effects: { reputation: 2, rdEfficiency: 0.1 },
          icon: '📊'
        },
        {
          id: 'partnerships',
          name: 'Partnership Development', 
          cost: 30000,
          description: 'Strategic partnerships for distribution and growth',
          effects: { reputation: 3, salesChannels: 1 },
          icon: '🤝'
        },
        {
          id: 'skip_growth',
          name: 'Focus on Operations',
          cost: 0,
          description: 'Skip growth investments and focus on core business',
          effects: {},
          icon: '⚡'
        }
      ];
    } else {
      return [
        {
          id: 'digital_marketing',
          name: 'Digital Marketing Campaign', 
          cost: 75000,
          description: 'Comprehensive online marketing and lead generation',
          effects: { reputation: 8, futuresalesBoost: 0.15 },
          icon: '💻'
        },
        {
          id: 'trade_shows',
          name: 'Trade Show Presence',
          cost: 50000,
          description: 'Industry visibility and direct customer acquisition',
          effects: { reputation: 6, customerAcquisition: 0.2 },
          icon: '🏢'
        },
        {
          id: 'strategic_partnerships',
          name: 'Strategic Partnerships',
          cost: 100000,
          description: 'Joint ventures and market expansion initiatives', 
          effects: { reputation: 10, salesMultiplier: 1.2 },
          icon: '🌟'
        },
        {
          id: 'skip_growth',
          name: 'Conservative Growth',
          cost: 0,
          description: 'Maintain current operations without additional investment',
          effects: {},
          icon: '⚡'
        }
      ];
    }
  }

  /**
   * Process R&D investment
   */
  processRnDInvestment(game, player, data) {
    if (game.currentPhase !== 'r&d') {
      return { success: false, error: 'Invalid action for current phase' };
    }

    const technology = data.technology;
    const cost = this.getTechnologyCost(technology);

    if (player.cash < cost) {
      return { success: false, error: 'Insufficient funds for R&D investment' };
    }

    player.cash -= cost;
    
    const successChance = this.getRnDSuccessChance(game.gameSettings.difficulty);
    const isSuccess = Math.random() < successChance;

    if (isSuccess) {
      const tech = {
        id: `tech-${Date.now()}`,
        name: technology,
        cost: cost,
        acquiredRound: game.currentRound,
        level: data.level || 'basic',               // ADD: level
        rounds_remaining: 3,                        // ADD: how long tech lasts
        benefit: this.getTechnologyBenefit(technology), // ADD: single number for display
        benefits: this.getTechnologyBenefits(technology) 
      };
      
      player.technologies.push(tech);
      player.stats.successfulInnovations++;
      
      logger.info(`🧪 ${player.name} successfully researched ${technology} for ${cost}`);
      
      return {
        success: true,
        message: `Successfully researched ${technology}!`,
        technology: tech,
        costPaid: cost
      };
    } else {
      logger.info(`❌ ${player.name}'s R&D investment in ${technology} failed`);
      
      return {
        success: true,
        message: `R&D investment in ${technology} failed, but you gained valuable experience`,
        costPaid: cost,
        failed: true
      };
    }
  }
  
  getTechnologyBenefit(technology) {
    const benefits = {
      'AI Navigation': 0.20,        // 20% benefit
      'Advanced Arms': 0.15,        // 15% benefit  
      'Power Management': 0.25,     // 25% benefit
      'Full Autonomy': 0.30,        // 30% benefit
      'Multi-Sensor Integration': 0.18, // 18% benefit
      'Modular Architecture': 0.15, // 15% benefit
      'Basic Sensors': 0.10,        // 10% benefit
      'Standard Motors': 0.12,      // 12% benefit
      'Simple AI': 0.15,           // 15% benefit
      'Advanced Manipulation': 0.15, // 15% benefit
      'Battery Optimization': 0.25   // 25% benefit
    };
    
    return benefits[technology] || 0.10; // Default 10% if not found
  }
  
  /**
   * Process robot production - UPDATED with scalable capacity
   */
  processRobotProduction(game, player, data) {
    if (game.currentPhase !== 'production') {
      return { success: false, error: 'Invalid action for current phase' };
    }

    const robotType = data.robotType;
    const quantity = data.quantity || 1;
    const components = data.components || [];

    // UPDATED: Pass current round for scalable capacity
    const maxProduction = this.getProductionCapacity(player, game.gameSettings.difficulty, game.currentRound);
    
	// Initialize if not set
	if (!player.robotsBuiltThisRound) {
	  player.robotsBuiltThisRound = 0;
	}
  
	logger.info(`🏭 Production check for ${player.name}:`, {
      requestedQuantity: quantity,
      alreadyBuilt: player.robotsBuiltThisRound,
      maxCapacity: maxProduction,
      currentRound: game.currentRound
	});
	
	if (player.robotsBuiltThisRound + quantity > maxProduction) {
      return { 
        success: false, 
        error: `Exceeds production capacity (${player.robotsBuiltThisRound}/${maxProduction} used)` 
      };
    }

    const totalCost = this.calculateRobotProductionCost({
      robotType,
      quantity,
      components
    });

    if (player.cash < totalCost) {
      return { success: false, error: 'Insufficient funds for robot production' };
    }

    player.cash -= totalCost;
    player.robotsBuiltThisRound += quantity;

    const robots = [];
    for (let i = 0; i < quantity; i++) {
      const robot = {
        id: `robot-${Date.now()}-${i}`,
        type: robotType,
        components: [...components],
        productionRound: game.currentRound,
        cost: totalCost / quantity,
        sold: false,
        quality: this.calculateRobotQuality(player.technologies, components)
      };
      
      robots.push(robot);
      player.robots.push(robot);
    }

    player.stats.totalProduction += quantity;

    logger.info(`🏭 ${player.name} built ${quantity} ${robotType} robot(s) for ${totalCost} (${player.robotsBuiltThisRound}/${maxProduction} capacity used)`);

    return {
      success: true,
      message: `Successfully built ${quantity} ${robotType} robot(s) for ${totalCost.toLocaleString()}!`,
      robots: robots,
      costPaid: totalCost,
      quantity: quantity,
      capacityUsed: player.robotsBuiltThisRound,
      maxCapacity: maxProduction
    };
  }

  /**
   * Process robot sales - UPDATED to allow partial selling
   */
  processRobotSales(game, player, data) {
    if (game.currentPhase !== 'sales') {
      return { success: false, error: 'Invalid action for current phase' };
    }

    const robotIds = data.robotIds || [];
    const sellQuantity = data.quantity || 'all'; // Can be 'all' or a number
    
    // Get unsold robots
    const unsoldRobots = player.robots.filter(r => !r.sold);
    
    if (unsoldRobots.length === 0) {
      return { success: false, error: 'No robots available to sell' };
    }

    // Determine which robots to sell
    let robotsToSell = [];
    if (sellQuantity === 'all' || robotIds.length > 0) {
      // Sell specific robots or all
      robotsToSell = robotIds.length > 0 
        ? unsoldRobots.filter(r => robotIds.includes(r.id))
        : unsoldRobots;
    } else {
      // Sell specific quantity
      const quantity = parseInt(sellQuantity);
      robotsToSell = unsoldRobots.slice(0, quantity);
    }

    if (robotsToSell.length === 0) {
      return { success: false, error: 'No valid robots selected for sale' };
    }

    let totalRevenue = 0;
    let robotsSold = 0;

    for (const robot of robotsToSell) {
      const salePrice = this.calculateRobotSalePrice(robot, game.marketConditions);
      robot.sold = true;
      robot.salePrice = salePrice;
      robot.soldRound = game.currentRound;
      
      totalRevenue += salePrice;
      robotsSold++;
    }

    player.cash += totalRevenue;
    player.stats.totalRevenue += totalRevenue;

    logger.info(`💰 ${player.name} sold ${robotsSold} robots for ${totalRevenue}`);

    return {
      success: true,
      message: `Successfully sold ${robotsSold} robot(s) for ${totalRevenue.toLocaleString()}!`,
      revenue: totalRevenue,
      robotsSold: robotsSold,
      robotsRemaining: player.robots.filter(r => !r.sold).length
    };
  }

  /**
   * Process loan application
   */
  processLoanApplication(game, player, data) {
    if (game.currentPhase !== 'funding') {
      return { success: false, error: 'Invalid action for current phase' };
    }

    const amount = data.amount || 100000;
    const interestRate = 0.1; // 10% per round
    const maxRounds = 5; // Must be repaid within 5 rounds

    // Check if player already has too many loans
    if (player.loans.length >= 3) {
      return { success: false, error: 'Maximum loan limit reached' };
    }

    const loan = {
      id: `loan-${Date.now()}`,
      amount: amount,
      interestRate: interestRate,
      roundTaken: game.currentRound,
      roundsDue: maxRounds,
      amountDue: Math.floor(amount * (1 + interestRate * maxRounds))
    };

    player.loans.push(loan);
    player.cash += amount;

    logger.info(`💳 ${player.name} took a loan of ${amount}`);

    return {
      success: true,
      message: `Successfully obtained loan of ${amount.toLocaleString()}`,
      loan: loan,
      amountReceived: amount
    };
  }

  /**
   * Process skip action
   */
  processSkip(game, player, data) {
    const reason = data.reason || 'player_choice';
    
    logger.info(`⏭️ ${player.name} skipped ${game.currentPhase} phase (${reason})`);
    
    return {
      success: true,
      message: `Skipped ${game.currentPhase} phase`,
      skipped: true,
      reason: reason
    };
  }

  /**
   * Get R&D success chance based on difficulty
   */
  getRnDSuccessChance(difficulty) {
    switch (difficulty) {
      case 'beginner': return 0.8; // 80% success
      case 'advanced': return 0.6; // 60% success
      default: return 0.7; // 70% success
    }
  }

  /**
   * Get technology cost by name
   */
  getTechnologyCost(techName) {
    const costs = {
      'Basic Sensors': 50000,
      'Standard Motors': 75000,
      'Simple AI': 100000,
      'Advanced Arms': 120000,
      'AI Navigation': 150000
    };
    return costs[techName] || 100000;
  }

  /**
   * Get technology benefits
   */
  getTechnologyBenefits(technology) {
    const benefits = {
      'Basic Sensors': { productionBonus: 0.1, qualityBonus: 0.05 },
      'Standard Motors': { productionBonus: 0.15, efficiencyBonus: 0.1 },
      'Simple AI': { qualityBonus: 0.2, priceBonus: 0.1 },
      'Advanced Arms': { qualityBonus: 0.25, specialtyBonus: 0.15 },
      'AI Navigation': { priceBonus: 0.3, qualityBonus: 0.2 }
    };
    
    return benefits[technology] || { productionBonus: 0.1 };
  }

  /**
   * Get production capacity - UPDATED for scalable production after Round 2
   */
  getProductionCapacity(player, difficulty, currentRound = 1) {
    // Round 1: Limited capacity to prove concept
    let capacity = 5;
  
  // Scale significantly with rounds
    if (currentRound === 1) {
	  capacity = 5; // Round 1: Can build up to 5 robots
	} else {
	  capacity = 10 + ((currentRound - 2) * 5); // Round 2: 10, Round 3: 15, etc.
	}
  
  // Scale with cash reserves (more aggressive)
	const playerCash = player.cash || 0;
	if (playerCash >= 200000) capacity += 2;  // Lower threshold
	if (playerCash >= 400000) capacity += 3;  // More gradual scaling
	if (playerCash >= 600000) capacity += 4;
	if (playerCash >= 800000) capacity += 5;
	if (playerCash >= 1000000) capacity += 7;
	if (playerCash >= 2000000) capacity += 10;
  
  // Scale with funding rounds
	const fundingRounds = player.fundingRounds?.length || 0;
	capacity += fundingRounds * 3;
  
  // Scale with technologies (more significant bonus)
	const techCount = player.technologies?.length || 0;
	capacity += techCount * 2;
  
  // Check for specific production-enhancing technologies
	if (player.technologies?.some(t => t.name?.includes('automation') || t.name?.includes('Automation'))) {
      capacity += 5;
	}
	if (player.technologies?.some(t => t.name?.includes('mass') || t.name?.includes('production'))) {
      capacity += 4;
	}
  
  // Scale with growth investments in operational efficiency
	const efficiencyInvestments = player.growthEffects?.filter(e => 
      e.type === 'operational_efficiency' || 
      e.type === 'automation' ||
      e.type === 'international_expansion'
	) || [];
    capacity += efficiencyInvestments.length * 3;
  
  // Scale with total revenue (success breeds success)
	const totalRevenue = player.stats?.totalRevenue || 0;
	if (totalRevenue >= 1000000) capacity += 2;
	if (totalRevenue >= 5000000) capacity += 3;
	if (totalRevenue >= 10000000) capacity += 5;
  
  // Difficulty adjustments
	switch (difficulty) {
      case 'beginner': 
        capacity = Math.floor(capacity * 1.2); // 20% bonus for beginners
        break;
      case 'advanced': 
        capacity = Math.floor(capacity * 0.9); // 10% penalty for advanced
        break;
	}
  
  // Minimum of 5 after round 1, maximum of 50 for balance
   const minCapacity = currentRound === 1 ? 5 : 15;
   const maxCapacity = 100;
  
   const finalCapacity = Math.max(minCapacity, Math.min(maxCapacity, capacity));
  
   logger.info(`🏭 Production capacity for ${player.name} (Round ${currentRound}): ${finalCapacity}`);
  
   return finalCapacity;

  }

  /**
   * Calculate robot production cost
   */
  calculateRobotProductionCost(robotData) {
    const baseCosts = {
      service: 100000,
      mobile: 120000,
      industrial: 150000,
      humanoid: 200000,
      medical: 250000
    };
    
    const robotType = robotData.robotType || 'service';
    const quantity = robotData.quantity || 1;
    const components = robotData.components || [];
    
    const baseCost = baseCosts[robotType] || 100000;
    const componentCost = components.length * 25000;
    
    return (baseCost + componentCost) * quantity;
  }

  /**
   * Calculate robot quality based on technologies and components
   */
  calculateRobotQuality(technologies, components) {
    let baseQuality = 0.5; // 50% base quality
    
    // Technology bonuses
    const qualityTechs = technologies.filter(t => 
      t.benefits && t.benefits.qualityBonus
    );
    
    const techBonus = qualityTechs.reduce((sum, tech) => 
      sum + (tech.benefits.qualityBonus || 0), 0
    );
    
    // Component bonuses
    const componentBonus = components.length * 0.1; // 10% per component
    
    return Math.min(1.0, baseQuality + techBonus + componentBonus);
  }

  /**
   * Calculate robot sale price based on quality and market conditions
   */
  calculateRobotSalePrice(robot, marketConditions) {
    const basePrices = {
      service: 180000,
      mobile: 220000,
      industrial: 280000,
      humanoid: 400000,
      medical: 500000
    };

    let basePrice = basePrices[robot.type] || 180000;
    
    // Quality bonus (up to 50% more for perfect quality)
    const qualityMultiplier = 1 + (robot.quality * 0.5);
    
    // Market conditions
    let marketMultiplier = 1.0;
    switch (marketConditions.demand) {
      case 'high': marketMultiplier = 1.3; break;
      case 'low': marketMultiplier = 0.7; break;
      default: marketMultiplier = 1.0;
    }
    
    // Random variation (±10%)
    const randomFactor = 0.9 + (Math.random() * 0.2);
    
    return Math.floor(basePrice * qualityMultiplier * marketMultiplier * randomFactor);
  }

  /**
   * Validate if AI move is affordable
   */
  validateAIMoveAffordability(currentPlayer, aiMove) {
    const playerCash = currentPlayer.cash;
    
    switch (aiMove.action) {
      case 'invest_r&d':
        const rdCost = this.getTechnologyCost(aiMove.data.technology);
        if (playerCash < rdCost) {
          return { 
            valid: false, 
            reason: `R&D cost ${rdCost} exceeds available cash ${playerCash}` 
          };
        }
        break;
        
      case 'build_robots':
        const robotCost = this.calculateRobotProductionCost(aiMove.data);
        if (playerCash < robotCost) {
          return { 
            valid: false, 
            reason: `Robot production cost ${robotCost} exceeds available cash ${playerCash}` 
          };
        }
        break;
        
      default:
        // Most other actions don't require funds
        break;
    }
    
    return { valid: true };
  }

  /**
   * Get cheaper alternative when AI can't afford original move
   */
  getCheaperAlternative(game, currentPlayer, originalMove) {
    const playerCash = currentPlayer.cash;
    const phase = game.currentPhase;
    
    switch (originalMove.action) {
      case 'invest_r&d':
        // Find cheapest affordable technology
        const cheapTech = this.getCheapestTechnology(playerCash);
        if (cheapTech) {
          return {
            action: 'invest_r&d',
            data: { technology: cheapTech.name }
          };
        }
        break;
        
      case 'build_robots':
        // Find cheapest affordable robot
        const cheapRobot = this.getCheapestRobot(playerCash);
        if (cheapRobot) {
          return {
            action: 'build_robots',
            data: {
              robotType: cheapRobot.type,
              quantity: 1,
              components: []
            }
          };
        }
        break;
    }
    
    return null; // No cheaper alternative available
  }

  /**
   * Get cheapest technology that AI can afford
   */
  getCheapestTechnology(playerCash) {
    const technologies = [
      { name: 'Basic Sensors', cost: 50000 },
      { name: 'Standard Motors', cost: 75000 },
      { name: 'Simple AI', cost: 100000 },
      { name: 'Advanced Arms', cost: 120000 },
      { name: 'AI Navigation', cost: 150000 }
    ];
    
    return technologies
      .filter(tech => tech.cost <= playerCash)
      .sort((a, b) => a.cost - b.cost)[0]; // Return cheapest affordable tech
  }

  /**
   * Get cheapest robot type that AI can afford
   */
  getCheapestRobot(playerCash) {
    const robotTypes = [
      { type: 'service', baseCost: 100000 },
      { type: 'mobile', baseCost: 120000 },
      { type: 'industrial', baseCost: 150000 },
      { type: 'humanoid', baseCost: 200000 },
      { type: 'medical', baseCost: 250000 }
    ];
    
    return robotTypes
      .filter(robot => robot.baseCost <= playerCash)
      .sort((a, b) => a.baseCost - b.baseCost)[0]; // Return cheapest affordable robot
  }

  /**
   * Execute AI move with proper error handling
   */
  async executeAIMove(game, currentPlayer, aiMove) {
    try {
      const result = await this.processPlayerMove(game.id, currentPlayer.id, aiMove);
      
      if (result.success) {
        logger.info(`✅ AI move successful for ${currentPlayer.name}: ${result.message}`);
        return result;
      } else {
        throw new Error(result.error || 'Move processing failed');
      }
      
    } catch (error) {
      logger.error(`❌ AI move execution failed for ${currentPlayer.name}: ${error.message}`);
      // Try fallback move
      return await this.forceSkipAITurn(game, currentPlayer);
    }
  }

  /**
   * Handle AI timeout with safe fallback
   */
  async handleAITimeout(game, currentPlayer) {
    logger.warn(`⏰ Handling timeout for ${currentPlayer.name}`);
    
    const fallbackMove = this.getFallbackMove(game, currentPlayer);
    
    try {
      return await this.executeAIMove(game, currentPlayer, fallbackMove);
    } catch (error) {
      logger.error(`❌ Fallback move failed for ${currentPlayer.name}`);
      return await this.forceSkipAITurn(game, currentPlayer);
    }
  }

  /**
   * Handle AI errors with retry logic
   */
  async handleAIError(game, currentPlayer, error) {
    logger.warn(`⚠️ Handling AI error for ${currentPlayer.name}: ${error.message}`);
    
    // Check if it's a funds issue
    if (error.message.includes('Insufficient funds') || error.message.includes('funds')) {
      logger.info(`💰 ${currentPlayer.name} has insufficient funds - trying cheaper alternatives`);
      
      // Get a budget-friendly move
      const budgetMove = this.getBudgetFriendlyMove(game, currentPlayer);
      
      if (budgetMove) {
        try {
          const result = await this.executeAIMove(game, currentPlayer, budgetMove);
          
          if (result.success) {
            logger.info(`✅ Budget move successful for ${currentPlayer.name}: ${result.message}`);
            return result;
          }
        } catch (budgetError) {
          logger.warn(`❌ Budget move also failed for ${currentPlayer.name}`);
        }
      }
    }
    
    // If we can't resolve the error, force skip
    return await this.forceSkipAITurn(game, currentPlayer);
  }

  /**
   * Force skip AI turn when all else fails
   */
  async forceSkipAITurn(game, currentPlayer) {
    logger.warn(`⚠️ Forcing skip for stuck AI player: ${currentPlayer.name}`);
    
    const skipMove = {
      action: 'skip_phase',
      data: {
        reason: 'ai_timeout_or_insufficient_funds',
        phase: game.currentPhase
      }
    };
    
    try {
      const result = await this.processPlayerMove(game.id, currentPlayer.id, skipMove);
      logger.info(`✅ Successfully forced skip for ${currentPlayer.name}`);
      return result;
    } catch (error) {
      logger.error(`💥 Critical: Even skip failed for ${currentPlayer.name}`);
      // Return a fake success to keep game moving
      return {
        success: true,
        message: `Forced skip for ${currentPlayer.name}`,
        gameState: game
      };
    }
  }

  /**
   * Get fallback move based on current phase - UPDATED for new phases
   */
  getFallbackMove(game, currentPlayer) {
    const phase = game.currentPhase;
    
    switch (phase) {
      case 'bootstrap':
        return {
          action: 'collect_income',
          data: {}
        };
        
      case 'funding':
        return {
          action: 'select_funding',
          data: {
            fundingType: 'skip'
          }
        };
        
      case 'r&d':
        return {
          action: 'skip_r&d',
          data: {
            reason: 'insufficient_funds_or_timeout'
          }
        };
        
      case 'production':
        return {
          action: 'skip_production',
          data: {
            reason: 'insufficient_funds_or_timeout'
          }
        };
        
      case 'sales':
        return {
          action: 'sell_robots',
          data: {
            robotIds: currentPlayer.robots
              .filter(r => !r.sold)
              .slice(0, 3)
              .map(r => r.id),
            quantity: Math.min(3, currentPlayer.robots.filter(r => !r.sold).length)
          }
        };
        
      case 'growth':
        return {
          action: 'invest_marketing',
          data: {
            investmentType: 'skip_growth'
          }
        };
        
      default:
        return {
          action: 'skip_phase',
          data: {
            reason: 'unknown_phase'
          }
        };
    }
  }

  /**
   * Get budget-friendly move when AI has insufficient funds
   */
  getBudgetFriendlyMove(game, currentPlayer) {
    const phase = game.currentPhase;
    const playerCash = currentPlayer.cash;
    
    switch (phase) {
      case 'r&d':
        // Try the cheapest technology available
        const cheapTech = this.getCheapestTechnology(playerCash);
        if (cheapTech) {
          return {
            action: 'invest_r&d',
            data: {
              technology: cheapTech.name
            }
          };
        }
        break;
        
      case 'production':
        // Try building just 1 of the cheapest robot type
        const cheapRobot = this.getCheapestRobot(playerCash);
        if (cheapRobot) {
          return {
            action: 'build_robots',
            data: {
              robotType: cheapRobot.type,
              quantity: 1,
              components: [] // No extra components to save money
            }
          };
        }
        break;
        
      case 'funding':
        // Only take loan if really needed and can afford payments
        if (playerCash < 100000) {
          return {
            action: 'take_loan',
            data: {
              amount: 100000,
              reason: 'emergency_funding'
            }
          };
        }
        break;
    }
    
    // Return null if no budget-friendly move is possible
    return null;
  }

  /**
   * Clear AI timeout for a specific player
   */
  clearAITimeout(playerId) {
    if (this.aiTurnTimeouts.has(playerId)) {
      clearTimeout(this.aiTurnTimeouts.get(playerId));
      this.aiTurnTimeouts.delete(playerId);
    }
  }

  /**
   * Clear all AI timeouts (call when game ends)
   */
  clearAllAITimeouts() {
    for (const [playerId, timeoutId] of this.aiTurnTimeouts) {
      clearTimeout(timeoutId);
    }
    this.aiTurnTimeouts.clear();
  }

  /**
   * Advance to next turn
   */
  advanceToNextTurn(gameId) {
    const game = this.games.get(gameId);
    if (!game || game.status !== 'playing') return;

    // Move to next player
    game.currentPlayerTurn = (game.currentPlayerTurn + 1) % game.players.length;

    // If we've completed a full round of players, check phase completion
    if (game.currentPlayerTurn === 0) {
      this.checkPhaseCompletion(game);
    }

    // Save game state
    this.saveGame(game);

    // Broadcast updated game state
    this.broadcastGameState(gameId, game);

    // Start next turn
    setTimeout(() => {
      this.processTurn(gameId);
    }, 500);
  }

  /**
   * Check if current phase is complete and advance - FIXED game ending logic
   */
  checkPhaseCompletion(game) {
    // Reset robots built count for production phase
    if (game.currentPhase === 'production') {
      game.players.forEach(player => {
        player.robotsBuiltThisRound = 0;
      });
    }

    // Process loan interest and dues (only in growth phase now)
    if (game.currentPhase === 'growth') {
      this.processLoanInterest(game);
    }

    // Get current round's phase array
    const getCurrentPhases = (round) => {
      return round === 1 
        ? ['bootstrap', 'r&d', 'production', 'sales', 'growth']        // Round 1: Prove concept
        : ['funding', 'r&d', 'production', 'sales', 'growth'];         // Round 2+: Scale business
    };

    const currentPhases = getCurrentPhases(game.currentRound);
    const currentPhaseIndex = currentPhases.indexOf(game.currentPhase);
    const nextPhaseIndex = (currentPhaseIndex + 1) % currentPhases.length;

    // Check if we're completing all phases (moving to next round)
    if (nextPhaseIndex === 0) {
      // Advance to next round FIRST
      game.currentRound++;
      
      logger.info(`🔄 Round ${game.currentRound} started in game ${game.id}`);

      // FIXED: Check if game is complete BEFORE setting new phase
      if (game.currentRound > game.gameSettings.maxRounds) {
        logger.info(`🏁 Game ${game.id} completed after ${game.gameSettings.maxRounds} rounds`);
        this.endGame(game);
        return; // Stop here - don't set new phase
      }
      
      // Get NEW round's phase array and set first phase
      const newRoundPhases = getCurrentPhases(game.currentRound);
      game.currentPhase = newRoundPhases[0];
      
      logger.info(`📋 New round ${game.currentRound} starts with phase: ${game.currentPhase}`);
      
      // Generate market events at start of each new round
      setTimeout(() => {
        this.generateMarketEvents(game);
      }, 1000);

      // Update player stats
      game.players.forEach(player => {
        player.stats.roundsPlayed++;
      });
      
    } else {
      // Normal phase advancement within the same round
      game.currentPhase = currentPhases[nextPhaseIndex];
      logger.info(`📋 Phase changed to ${game.currentPhase} in round ${game.currentRound}`);
    }
  }

  /**
   * Process loan interest and dues
   */
  processLoanInterest(game) {
    game.players.forEach(player => {
      player.loans.forEach(loan => {
        const roundsSinceTaken = game.currentRound - loan.roundTaken;
        
        // Check if loan is due
        if (roundsSinceTaken >= loan.roundsDue) {
          // Force loan repayment
          if (player.cash >= loan.amountDue) {
            player.cash -= loan.amountDue;
            logger.info(`💳 ${player.name} automatically repaid loan of ${loan.amountDue}`);
          } else {
            // Bankruptcy or penalty
            const penalty = loan.amountDue - player.cash;
            player.cash = 0;
            player.reputation -= 20;
            logger.warn(`⚠️ ${player.name} defaulted on loan, reputation penalty applied`);
          }
          
          // Remove loan
          const loanIndex = player.loans.indexOf(loan);
          if (loanIndex > -1) {
            player.loans.splice(loanIndex, 1);
          }
        }
      });
    });
  }

  /**
   * End the game and determine winner - FIXED valuation object issue
   */
  endGame(game) {
    game.status = 'finished';
    
    // Calculate final scores (net worth)
    const finalScores = game.players.map(player => {
      const valuationData = this.calculateCompanyValuation(player);
      return {
        player: player,
        netWorth: this.calculatePlayerNetWorth(player),
        score: this.calculatePlayerScore(player),
        companyValuation: valuationData.valuation, // FIXED: Just the number, not the whole object
        equity: player.equity || 100,
        totalFunding: (player.fundingRounds || []).reduce((sum, round) => sum + round.amount, 0)
      };
    });

    // Sort by score (highest first)
    finalScores.sort((a, b) => b.score - a.score);
    
    game.winner = finalScores[0].player;
    game.finalScores = finalScores;
    
    // Set final phase to indicate game completion
    game.currentPhase = 'finished';

    logger.info(`🏁 Game ${game.id} finished! Winner: ${game.winner.name} with score: ${finalScores[0].score}`);
    
    // Enhanced logging for debugging
    logger.info(`📊 Final Scores:`, finalScores.map(s => ({
      name: s.player.name,
      score: s.score,
      netWorth: s.netWorth,
      equity: s.equity,
      valuation: s.companyValuation
    })));

    // Clear all AI timeouts
    this.clearAllAITimeouts();

    // Broadcast final results with enhanced data
    this.broadcastGameState(game.id, game);
    
    // Emit game finished event with full results
    this.emit('gameFinished', {
      gameId: game.id,
      winner: game.winner,
      finalScores: finalScores,
      gameStats: {
        totalRounds: game.gameSettings.maxRounds,
        totalPlayers: game.players.length,
        humanPlayers: game.players.filter(p => p.type === 'human').length,
        aiPlayers: game.players.filter(p => p.type === 'ai').length
      }
    });
    
    // Special broadcast for game ending
    if (this.io) {
      this.io.to(game.id).emit('game-ended', {
        winner: game.winner,
        finalScores: finalScores,
        gameStats: {
          totalRounds: game.gameSettings.maxRounds,
          totalPlayers: game.players.length
        }
      });
    }
  }

  /**
   * Calculate player net worth
   */
  calculatePlayerNetWorth(player) {
    let netWorth = player.cash;
    
    // Add value of unsold robots (at cost)
    player.robots.forEach(robot => {
      if (!robot.sold) {
        netWorth += robot.cost * 0.7; // Depreciated value
      }
    });
    
    // Add technology value
    player.technologies.forEach(tech => {
      netWorth += tech.cost * 0.5; // Technologies retain some value
    });
    
    // Subtract loan obligations
    player.loans.forEach(loan => {
      netWorth -= loan.amountDue;
    });
    
    return Math.max(0, netWorth);
  }

  /**
   * Calculate company valuation - NEW METHOD
   */
  calculateCompanyValuation(player) {
    const cash = player.cash || 0;
    const robotInventoryValue = player.robots.filter(r => !r.sold).length * 100000;
    const technologyValue = player.technologies.length * 50000;
    const totalAssets = cash + robotInventoryValue + technologyValue;
    const industryMultiple = 2.5; // Simplified for beginners
    
    return {
      cash,
      robotInventoryValue,
      technologyValue,
      totalAssets,
      valuation: totalAssets * industryMultiple,
      equity: player.equity || 100
    };
  }

  /**
   * Calculate player score (considering multiple factors)
   */
  calculatePlayerScore(player) {
    const netWorth = this.calculatePlayerNetWorth(player);
    const reputationBonus = player.reputation * 1000;
    const innovationBonus = player.stats.successfulInnovations * 50000;
    const productionBonus = player.stats.totalProduction * 10000;
    
    return netWorth + reputationBonus + innovationBonus + productionBonus;
  }

  /**
   * Save game state (implement based on your storage solution)
   */
  saveGame(game) {
    // Update last activity
    game.lastActivity = new Date();
    
    // Here you would save to database if using persistent storage
    // For now, games are stored in memory
    
    logger.debug(`💾 Game ${game.id} saved`);
  }

  /**
   * Broadcast game state to all players
   */
  broadcastGameState(gameId, game) {
  // Calculate and attach production capacity for each player
    game.players.forEach(player => {
      player.productionCapacity = this.getProductionCapacity(
        player, 
        game.gameSettings.difficulty, 
        game.currentRound
      );
    });
  
	if (this.io) {
      logger.info(`📡 Broadcasting game state to all players in game ${gameId}`);
      this.io.to(gameId).emit('game-updated', game);
	} else {
      logger.warn('⚠️ Cannot broadcast - Socket.IO not initialized');
    }
  
  // Still emit the event for other parts of the system
	this.emit('gameStateUpdate', {
      gameId: gameId,
      gameState: game
	});
  }

  /**
   * Generate dynamic market events using AI
   * Call this at the start of each round
   */
  async generateMarketEvents(game) {
    try {
      // Get AI service if available
      if (!this.aiService) {
        // Fallback to simple market changes if AI service not available
        this.updateMarketConditionsSimple(game);
        return;
      }

      // Generate AI-powered market events
      const marketEvent = await this.aiService.generateMarketEvent({
        currentRound: game.currentRound,
        industry: game.gameSettings.industry,
        currentConditions: game.marketConditions,
        playerActions: this.getRecentPlayerActions(game)
      });

      if (marketEvent) {
        this.applyMarketEvent(game, marketEvent);
      }

    } catch (error) {
      logger.error('Failed to generate AI market events, using simple updates:', error);
      this.updateMarketConditionsSimple(game);
    }
  }

  /**
   * Apply a market event to the game
   */
  applyMarketEvent(game, marketEvent) {
    const oldConditions = { ...game.marketConditions };

    // Update market conditions
    if (marketEvent.demandChange) {
      game.marketConditions.demand = marketEvent.newDemand || game.marketConditions.demand;
    }

    if (marketEvent.volatilityChange) {
      game.marketConditions.volatility = Math.max(0.1, Math.min(1.0, 
        game.marketConditions.volatility + marketEvent.volatilityChange
      ));
    }

    if (marketEvent.newTrends) {
      game.marketConditions.trends = marketEvent.newTrends;
    }

    if (marketEvent.eventModifiers) {
      game.marketConditions.eventModifiers = marketEvent.eventModifiers;
    }

    // Add to event history
    const gameEvent = {
      id: `market-${Date.now()}`,
      type: 'market',
      title: marketEvent.title || 'Market Update',
      description: marketEvent.description || 'Market conditions have changed',
      impact: marketEvent.impact,
      timestamp: new Date(),
      round: game.currentRound
    };

    game.eventHistory.push(gameEvent);

    // Broadcast market update
    this.broadcastMarketUpdate(game.id, {
      event: gameEvent,
      oldConditions,
      newConditions: game.marketConditions
    });

    logger.info(`📊 Market event applied: ${gameEvent.title}`);
  }

  /**
   * Simple market updates when AI service is unavailable
   */
  updateMarketConditionsSimple(game) {
    const random = Math.random();
    
    // 30% chance of demand change each round
    if (random < 0.3) {
      const demands = ['low', 'medium', 'high'];
      const currentIndex = demands.indexOf(game.marketConditions.demand);
      
      // Tend toward medium, but allow swings
      if (random < 0.15 && currentIndex > 0) {
        game.marketConditions.demand = demands[currentIndex - 1];
      } else if (random < 0.3 && currentIndex < 2) {
        game.marketConditions.demand = demands[currentIndex + 1];
      }
    }

    // Gradually adjust volatility
    if (Math.random() < 0.4) {
      const change = (Math.random() - 0.5) * 0.2; // ±0.1 change
      game.marketConditions.volatility = Math.max(0.1, Math.min(0.9, 
        game.marketConditions.volatility + change
      ));
    }

    // Occasional trend changes
    if (Math.random() < 0.25) {
      const trends = [
        'automation-growth',
        'ai-advancement', 
        'supply-chain-issues',
        'sustainability-focus',
        'cost-pressure',
        'innovation-boom'
      ];
      
      game.marketConditions.trends = [
        trends[Math.floor(Math.random() * trends.length)]
      ];
    }

    // Create simple event
    const descriptions = [
      'Market sentiment shifts as industry trends evolve',
      'Economic indicators suggest changing customer priorities', 
      'New technological developments impact market dynamics',
      'Supply and demand factors create market fluctuations'
    ];

    const gameEvent = {
      id: `market-simple-${Date.now()}`,
      type: 'market',
      title: 'Market Update',
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      timestamp: new Date(),
      round: game.currentRound
    };

    game.eventHistory.push(gameEvent);
    
    this.broadcastMarketUpdate(game.id, {
      event: gameEvent,
      newConditions: game.marketConditions
    });
  }

  /**
   * Get recent player actions for AI context
   */
  getRecentPlayerActions(game) {
    return {
      totalInvestments: game.players.reduce((sum, p) => 
        sum + p.technologies.length, 0),
      totalProduction: game.players.reduce((sum, p) => 
        sum + p.robots.length, 0),
      averageCash: game.players.reduce((sum, p) => 
        sum + p.cash, 0) / game.players.length,
      activeLoans: game.players.reduce((sum, p) => 
        sum + p.loans.length, 0)
    };
  }

  /**
   * Broadcast market update to all players
   */
  broadcastMarketUpdate(gameId, updateData) {
    if (this.io) {
      this.io.to(gameId).emit('market-update', updateData);
      logger.info(`📡 Market update broadcast to game ${gameId}`);
    }
  }

  /**
   * Remove player from game
   */
  removePlayerFromGame(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) return false;

    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    const player = game.players[playerIndex];
    
    // Clear any AI timeout for this player
    this.clearAITimeout(playerId);

    // If it was the leaving player's turn, advance to next player
    if (game.currentPlayerTurn === playerIndex) {
      this.advanceToNextTurn(gameId);
    } else if (game.currentPlayerTurn > playerIndex) {
      // Adjust current turn index if needed
      game.currentPlayerTurn--;
    }

    // Remove player
    game.players.splice(playerIndex, 1);
    
    logger.info(`👋 Player ${player.name} left game ${gameId}`);

    // End game if no human players left
    const humanPlayers = game.players.filter(p => p.type === 'human');
    if (humanPlayers.length === 0 && game.status === 'playing') {
      this.endGame(game);
    }

    return true;
  }

  /**
   * Get game by ID
   */
  getGame(gameId) {
    return this.games.get(gameId);
  }

  /**
   * Get all active games
   */
  getActiveGames() {
    return Array.from(this.games.values()).filter(game => 
      game.status === 'waiting' || game.status === 'playing'
    );
  }

  /**
   * Get game statistics - COMPATIBILITY method for server.js
   */
  getGameStatistics() {
    return this.getStats();
  }

  /**
   * Get game statistics
   */
  getStats() {
    const games = Array.from(this.games.values());
    
    return {
      totalGames: games.length,
      activeGames: games.filter(g => g.status === 'playing').length,
      waitingGames: games.filter(g => g.status === 'waiting').length,
      finishedGames: games.filter(g => g.status === 'finished').length,
      totalPlayers: games.reduce((sum, game) => sum + game.players.length, 0),
      averageGameDuration: this.calculateAverageGameDuration(games)
    };
  }

  /**
   * Calculate average game duration
   */
  calculateAverageGameDuration(games) {
    const finishedGames = games.filter(g => g.status === 'finished');
    if (finishedGames.length === 0) return 0;
    
    const totalDuration = finishedGames.reduce((sum, game) => {
      return sum + (game.lastActivity - game.createdAt);
    }, 0);
    
    return Math.floor(totalDuration / finishedGames.length / 1000 / 60); // Minutes
  }

  /**
   * Generate unique game ID
   */
  generateGameId() {
    return 'game_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Clean up finished or abandoned games
   */
  cleanupGames() {
    const now = new Date();
    const maxInactiveTime = 60 * 60 * 1000; // 1 hour

    for (const [gameId, game] of this.games) {
      const inactiveTime = now - game.lastActivity;
      
      if (game.status === 'finished' || inactiveTime > maxInactiveTime) {
        // Clear any remaining timeouts
        game.players.forEach(player => {
          if (player.type === 'ai') {
            this.clearAITimeout(player.id);
          }
        });
        
        this.games.delete(gameId);
        logger.info(`🧹 Cleaned up inactive game: ${gameId}`);
      }
    }
  }

  /**
   * Cleanup method - call this when shutting down
   */
  cleanup() {
    // Clear all AI timeouts
    this.clearAllAITimeouts();
    
    // Clear any game cleanup intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    logger.info('🧹 GameManager cleanup completed');
  }

  /**
   * Start periodic cleanup of old games
   */
  startPeriodicCleanup() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupGames();
    }, 5 * 60 * 1000);
    
    logger.info('🔄 Started periodic game cleanup (every 5 minutes)');
  }
}

module.exports = GameManager;