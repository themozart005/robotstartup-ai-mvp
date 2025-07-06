// backend/src/services/GameManager.js
// COMPATIBILITY FIXED VERSION - Works with existing server.js

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
    
    // DO NOT set up socket handlers here - let server.js handle them
    // This prevents duplicate event handling
  }

  /**
   * Create a new game - FIXED to match server.js expectations
   */
  createGame(gameSettings, creatorId) {
    const gameId = this.generateGameId();
    
    const game = {
      id: gameId,
      status: 'waiting',
      currentRound: 1,
      currentPhase: 'startup',
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
    
    // COMPATIBILITY: Return format expected by server.js
    return {
      gameId: gameId,
      gameState: game
    };
  }

  /**
   * Add player to game - FIXED to work with existing server.js
   */
  addPlayerToGame(gameId, playerId, playerName, playerType = 'human') {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'waiting') {
      throw new Error('Game has already started');
    }

    if (game.players.length >= game.gameSettings.maxPlayers) {
      throw new Error('Game is full');
    }

    // Check if player already exists
    const existingPlayer = game.players.find(p => p.id === playerId);
    if (existingPlayer) {
      throw new Error('Player already in game');
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
      dealerships: []
    };

    game.players.push(player);
    game.lastActivity = new Date();

    logger.info(`👤 Player joined game: ${playerName}`, { gameId, playerId, playerType });

    // Add AI players if this is the first human player
    if (game.gameSettings.allowAI && game.players.filter(p => p.type === 'human').length === 1) {
      this.addAIPlayers(game);
    }

    // Start game if enough players (1 human + AI players)
    if (game.players.length >= 2) {
      this.startGame(gameId);
    }

    // COMPATIBILITY: Return the game state (expected by server.js)
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

    // Add AI players based on game settings
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
        aiPersonality: aiPersonalities[i] || aiPersonalities[0]
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

    logger.info(`🚀 Game started: ${gameId}`, { 
      players: game.players.length,
      humanPlayers: game.players.filter(p => p.type === 'human').length,
      aiPlayers: game.players.filter(p => p.type === 'ai').length
    });

    // Start first turn
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

    // If it's an AI player, process their turn automatically
    if (currentPlayer.type === 'ai') {
      // Add small delay for realism
      setTimeout(() => {
        this.processAITurn(gameId);
      }, 1000);
    }

    // Emit turn start event
    this.emit('turnStart', {
      gameId,
      playerId: currentPlayer.id,
      phase: game.currentPhase
    });
  }

  /**
   * Enhanced AI turn processing with timeout and fallback
   */
  async processAITurn(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    const currentPlayer = game.players[game.currentPlayerTurn];
    if (!currentPlayer || currentPlayer.type !== 'ai') return;

    try {
      // Use the new timeout-aware AI processing
      const result = await this.processAITurnWithTimeout(game, currentPlayer);
      
      if (result.success) {
        // Broadcast successful move via GameManager's broadcast method
        this.broadcastGameState(gameId, game);
        
        // Auto-advance to next turn after short delay
        setTimeout(() => {
          this.advanceToNextTurn(gameId);
        }, 1000);
        
      } else {
        logger.error(`❌ AI turn failed for ${currentPlayer.name}, advancing anyway`);
        // Force advance even if AI turn failed
        this.advanceToNextTurn(gameId);
      }
      
    } catch (error) {
      logger.error(`💥 Critical AI turn error for ${currentPlayer.name}:`, error);
      // Emergency advance to prevent game from hanging
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
      
      // Clear any existing timeout for this player
      this.clearAITimeout(playerId);
      
      // Set 5-second timeout for AI decision
      const timeoutPromise = new Promise((_, reject) => {
        const timeoutId = setTimeout(() => {
          logger.warn(`⏰ AI timeout for ${currentPlayer.name} after 5 seconds`);
          reject(new Error('AI_TIMEOUT'));
        }, this.AI_TURN_TIMEOUT);
        
        this.aiTurnTimeouts.set(playerId, timeoutId);
      });
      
      // Make AI decision with budget awareness
      const aiDecisionPromise = this.makeSmartAIDecision(game, currentPlayer);
      
      try {
        // Race between AI decision and timeout
        const aiMove = await Promise.race([aiDecisionPromise, timeoutPromise]);
        
        // Clear timeout since AI responded in time
        this.clearAITimeout(playerId);
        
        // Validate move is affordable
        const validation = this.validateAIMoveAffordability(currentPlayer, aiMove);
        if (!validation.valid) {
          logger.warn(`💰 ${currentPlayer.name} can't afford move: ${validation.reason}`);
          // Get a cheaper alternative
          const cheaperMove = this.getCheaperAlternative(game, currentPlayer, aiMove);
          if (cheaperMove) {
            return await this.executeAIMove(game, currentPlayer, cheaperMove);
          } else {
            return await this.forceSkipAITurn(game, currentPlayer);
          }
        }
        
        // Execute the validated move
        return await this.executeAIMove(game, currentPlayer, aiMove);
        
      } catch (error) {
        // Clear timeout
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
   * Make smart AI decision with budget awareness
   */
  async makeSmartAIDecision(game, currentPlayer) {
    logger.info(`🧠 ${currentPlayer.name} is thinking... (${game.currentPhase} phase)`);
    
    const playerCash = currentPlayer.cash;
    const phase = game.currentPhase;
    
    // Check what the AI can actually afford
    const affordableOptions = this.getAffordableOptions(game, currentPlayer);
    
    if (affordableOptions.length === 0) {
      logger.warn(`💸 ${currentPlayer.name} has no affordable options (cash: ${playerCash})`);
      return this.getFallbackMove(game, currentPlayer);
    }
    
    // Use existing AI logic but constrain to affordable options
    let aiMove;
    
    switch (phase) {
      case 'startup':
        aiMove = { action: 'collect_income', data: {} };
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
          // Only build what we can afford
          const maxQuantity = Math.floor(playerCash / affordableRobot.cost);
          const quantity = Math.min(maxQuantity, 2); // Max 2 robots per turn
          
          aiMove = {
            action: 'build_robots',
            data: {
              robotType: affordableRobot.robotType,
              quantity: quantity,
              components: [] // No components to save money
            }
          };
        } else {
          aiMove = { action: 'skip_production', data: { reason: 'insufficient_funds' } };
        }
        break;
        
      case 'sales':
        // Sales phase - always try to sell robots
        const unsoldRobots = currentPlayer.robots.filter(r => !r.sold);
        if (unsoldRobots.length > 0) {
          aiMove = {
            action: 'sell_robots',
            data: { robotIds: unsoldRobots.slice(0, 3).map(r => r.id) }
          };
        } else {
          aiMove = { action: 'skip_sales', data: { reason: 'no_robots_to_sell' } };
        }
        break;
        
      case 'investment':
        // Only take loan if really needed
        if (playerCash < 100000) {
          aiMove = {
            action: 'take_loan',
            data: { amount: 100000 }
          };
        } else {
          aiMove = { action: 'skip_investment', data: { reason: 'sufficient_funds' } };
        }
        break;
        
      default:
        aiMove = { action: 'skip_phase', data: { reason: 'unknown_phase' } };
    }
    
    logger.info(`🤖 ${currentPlayer.name} decided: ${aiMove.action}`);
    return aiMove;
  }

  /**
   * Get affordable options for AI player
   */
  getAffordableOptions(game, currentPlayer) {
    const playerCash = currentPlayer.cash;
    const phase = game.currentPhase;
    const options = [];
    
    if (phase === 'r&d') {
      // Check affordable technologies
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
      // Check affordable robots
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
   * Get fallback move based on current phase
   */
  getFallbackMove(game, currentPlayer) {
    const phase = game.currentPhase;
    
    switch (phase) {
      case 'startup':
        return {
          action: 'collect_income',
          data: {}
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
              .map(r => r.id) // Sell up to 3 robots
          }
        };
        
      case 'investment':
        return {
          action: 'skip_investment',
          data: {
            reason: 'conservative_strategy'
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
        
      case 'investment':
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
   * Process a player move - FIXED to work with existing server.js
   */
  async processPlayerMove(gameId, playerId, move) {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Validate it's the player's turn
    const currentPlayer = game.players[game.currentPlayerTurn];
    if (currentPlayer.id !== playerId) {
      return { success: false, error: 'Not your turn' };
    }

    game.lastActivity = new Date();

    try {
      let result;
      
      switch (move.action) {
        case 'collect_income':
          result = this.processIncomeCollection(game, player);
          break;
          
        case 'invest_r&d':
          result = this.processRnDInvestment(game, player, move.data);
          break;
          
        case 'build_robots':
          result = this.processRobotProduction(game, player, move.data);
          break;
          
        case 'sell_robots':
          result = this.processRobotSales(game, player, move.data);
          break;
          
        case 'take_loan':
          result = this.processLoanApplication(game, player, move.data);
          break;
          
        case 'skip_r&d':
        case 'skip_production':
        case 'skip_sales':
        case 'skip_investment':
        case 'skip_phase':
          result = this.processSkip(game, player, move.data);
          break;
          
        default:
          return { success: false, error: 'Invalid action' };
      }

      if (result.success) {
        // Check if this is an AI player turn, then handle advancement differently
        if (player.type === 'ai') {
          // For AI players, don't advance turn here - let processAITurn handle it
          // Just return success without advancing
          return {
            success: true,
            message: result.message || 'AI move processed successfully',
            gameState: game,
            moveResult: result
          };
        } else {
          // For human players, advance to next turn
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
   * Process income collection
   */
  processIncomeCollection(game, player) {
    if (game.currentPhase !== 'startup') {
      return { success: false, error: 'Invalid startup action' };
    }

    const income = 50000;
    player.cash += income;
    
    logger.info(`💰 ${player.name} collected income: ${income}`);
    
    return {
      success: true,
      message: `Collected ${income} round income`,
      income: income
    };
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

    // Process investment
    player.cash -= cost;
    
    // Simple success/failure based on difficulty
    const successChance = this.getRnDSuccessChance(game.gameSettings.difficulty);
    const isSuccess = Math.random() < successChance;

    if (isSuccess) {
      const tech = {
        id: `tech-${Date.now()}`,
        name: technology,
        cost: cost,
        acquiredRound: game.currentRound,
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
   * Process robot production
   */
  processRobotProduction(game, player, data) {
    if (game.currentPhase !== 'production') {
      return { success: false, error: 'Invalid action for current phase' };
    }

    const robotType = data.robotType;
    const quantity = data.quantity || 1;
    const components = data.components || [];

    // Check production capacity
    const maxProduction = this.getProductionCapacity(player, game.gameSettings.difficulty);
    if (player.robotsBuiltThisRound + quantity > maxProduction) {
      return { 
        success: false, 
        error: `Exceeds production capacity (${player.robotsBuiltThisRound}/${maxProduction} used)` 
      };
    }

    // Calculate cost
    const totalCost = this.calculateRobotProductionCost({
      robotType,
      quantity,
      components
    });

    if (player.cash < totalCost) {
      return { success: false, error: 'Insufficient funds for robot production' };
    }

    // Process production
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

    logger.info(`🏭 ${player.name} built ${quantity} ${robotType} robot(s) for ${totalCost}`);

    return {
      success: true,
      message: `Successfully built ${quantity} ${robotType} robot(s) for ${totalCost.toLocaleString()}!`,
      robots: robots,
      costPaid: totalCost,
      quantity: quantity
    };
  }

  /**
   * Get production capacity based on player level and difficulty
   */
  getProductionCapacity(player, difficulty) {
    let baseCapacity = 3;
    
    // Adjust for difficulty
    switch (difficulty) {
      case 'beginner': baseCapacity = 4; break;
      case 'advanced': baseCapacity = 2; break;
      default: baseCapacity = 3;
    }
    
    // Technology bonuses
    const productionTechs = player.technologies.filter(t => 
      t.benefits && t.benefits.productionBonus
    );
    
    const techBonus = productionTechs.reduce((sum, tech) => 
      sum + (tech.benefits.productionBonus || 0), 0
    );
    
    return Math.floor(baseCapacity * (1 + techBonus));
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
   * Process robot sales
   */
  processRobotSales(game, player, data) {
    if (game.currentPhase !== 'sales') {
      return { success: false, error: 'Invalid action for current phase' };
    }

    const robotIds = data.robotIds || [];
    
    if (robotIds.length === 0) {
      // Sell all unsold robots
      const unsoldRobots = player.robots.filter(r => !r.sold);
      robotIds.push(...unsoldRobots.map(r => r.id));
    }

    if (robotIds.length === 0) {
      return { success: false, error: 'No robots available to sell' };
    }

    let totalRevenue = 0;
    let robotsSold = 0;

    for (const robotId of robotIds) {
      const robot = player.robots.find(r => r.id === robotId && !r.sold);
      if (robot) {
        const salePrice = this.calculateRobotSalePrice(robot, game.marketConditions);
        robot.sold = true;
        robot.salePrice = salePrice;
        robot.soldRound = game.currentRound;
        
        totalRevenue += salePrice;
        robotsSold++;
      }
    }

    player.cash += totalRevenue;
    player.stats.totalRevenue += totalRevenue;

    logger.info(`💰 ${player.name} sold ${robotsSold} robots for ${totalRevenue}`);

    return {
      success: true,
      message: `Successfully sold ${robotsSold} robot(s) for ${totalRevenue.toLocaleString()}!`,
      revenue: totalRevenue,
      robotsSold: robotsSold
    };
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
   * Process loan application
   */
  processLoanApplication(game, player, data) {
    if (game.currentPhase !== 'investment') {
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
   * Check if current phase is complete and advance
   */
  checkPhaseCompletion(game) {
    // Reset robots built count for production phase
    if (game.currentPhase === 'production') {
      game.players.forEach(player => {
        player.robotsBuiltThisRound = 0;
      });
    }

    // Process loan interest and dues
    if (game.currentPhase === 'investment') {
      this.processLoanInterest(game);
    }

    // Advance to next phase
    const phases = ['startup', 'r&d', 'production', 'sales', 'investment'];
    const currentPhaseIndex = phases.indexOf(game.currentPhase);
    const nextPhaseIndex = (currentPhaseIndex + 1) % phases.length;

    game.currentPhase = phases[nextPhaseIndex];

    // If we've completed all phases, advance to next round
    if (nextPhaseIndex === 0) {
      game.currentRound++;
      
      // Update player stats
      game.players.forEach(player => {
        player.stats.roundsPlayed++;
      });

      logger.info(`🔄 Round ${game.currentRound} started in game ${game.id}`);

      // Check if game is complete
      if (game.currentRound > game.gameSettings.maxRounds) {
        this.endGame(game);
        return;
      }
    }

    logger.info(`📋 Phase changed to ${game.currentPhase} in game ${game.id}`);
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
   * End the game and determine winner
   */
  endGame(game) {
    game.status = 'finished';
    
    // Calculate final scores (net worth)
    const finalScores = game.players.map(player => ({
      player: player,
      netWorth: this.calculatePlayerNetWorth(player),
      score: this.calculatePlayerScore(player)
    }));

    // Sort by score (highest first)
    finalScores.sort((a, b) => b.score - a.score);
    
    game.winner = finalScores[0].player;
    game.finalScores = finalScores;

    logger.info(`🏁 Game ${game.id} finished! Winner: ${game.winner.name}`);

    // Clear all AI timeouts
    this.clearAllAITimeouts();

    // Broadcast final results
    this.broadcastGameState(game.id, game);
    
    this.emit('gameFinished', {
      gameId: game.id,
      winner: game.winner,
      finalScores: finalScores
    });
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
   * Broadcast game state to all players - FIXED to work with server.js
   */
  broadcastGameState(gameId, game) {
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