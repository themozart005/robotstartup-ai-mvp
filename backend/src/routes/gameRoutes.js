// backend/src/routes/gameRoutes.js
// These are the API endpoints that handle game-related requests
// Think of them as different service counters at a bank - each handles specific tasks

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

/**
 * POST /api/game/create
 * Create a new game session
 * Like setting up a new board game table
 */
router.post('/create', [
  body('playerName').notEmpty().withMessage('Player name is required'),
  body('difficulty').optional().isIn(['beginner', 'advanced']).withMessage('Invalid difficulty'),
  body('industry').optional().isString().withMessage('Industry must be a string'),
  body('maxRounds').optional().isInt({ min: 1, max: 20 }).withMessage('Max rounds must be between 1 and 20')
], handleValidationErrors, async (req, res) => {
  try {
    const { playerName, difficulty = 'beginner', industry = 'robotics', maxRounds = 10 } = req.body;
    
    // Create new game using GameManager
    const gameManager = req.gameManager;
    const result = await gameManager.createGame({
      difficulty,
      industry,
      maxRounds
    });
    
    // Add the creating player to the game
    const gameState = await gameManager.addPlayerToGame(
      result.gameId, 
      `creator_${Date.now()}`, // Temporary ID for creator
      playerName, 
      'human'
    );
    
    logger.info(`Game created: ${result.gameId} by ${playerName}`);
    
    res.json({
      success: true,
      gameId: result.gameId,
      gameState: gameState,
      message: 'Game created successfully!'
    });
    
  } catch (error) {
    logger.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create game',
      error: error.message
    });
  }
});

/**
 * POST /api/game/:gameId/join
 * Join an existing game
 * Like sitting down at an already-set-up board game
 */
router.post('/:gameId/join', [
  param('gameId').notEmpty().withMessage('Game ID is required'),
  body('playerName').notEmpty().withMessage('Player name is required'),
  body('playerType').optional().isIn(['human', 'ai']).withMessage('Invalid player type')
], handleValidationErrors, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerName, playerType = 'human' } = req.body;
    
    const gameManager = req.gameManager;
    const gameState = await gameManager.addPlayerToGame(
      gameId,
      `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerName,
      playerType
    );
    
    logger.info(`Player ${playerName} joined game ${gameId}`);
    
    res.json({
      success: true,
      gameState: gameState,
      message: `Successfully joined game as ${playerName}!`
    });
    
  } catch (error) {
    logger.error('Error joining game:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/game/:gameId/start
 * Start a game that's ready to begin
 * Like saying "let's start playing!" after everyone has joined
 */
router.post('/:gameId/start', [
  param('gameId').notEmpty().withMessage('Game ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const gameManager = req.gameManager;
    const gameState = await gameManager.startGame(gameId);
    
    // Notify all players via WebSocket
    req.io.to(gameId).emit('game-started', {
      gameState,
      message: 'Game has started! Good luck everyone!'
    });
    
    logger.info(`Game started: ${gameId}`);
    
    res.json({
      success: true,
      gameState: gameState,
      message: 'Game started successfully!'
    });
    
  } catch (error) {
    logger.error('Error starting game:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/game/:gameId
 * Get current game state
 * Like asking "what's the current situation in the game?"
 */
router.get('/:gameId', [
  param('gameId').notEmpty().withMessage('Game ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.query;
    
    const gameManager = req.gameManager;
    
    let gameState;
    if (playerId) {
      // Get player-specific view (hides sensitive info from other players)
      gameState = gameManager.getPlayerGameState(gameId, playerId);
    } else {
      // Get basic game info (for spectators or lobby view)
      gameState = gameManager.activeGames.get(gameId);
    }
    
    if (!gameState) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    res.json({
      success: true,
      gameState: gameState
    });
    
  } catch (error) {
    logger.error('Error getting game state:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game state',
      error: error.message
    });
  }
});

/**
 * POST /api/game/:gameId/move
 * Make a move in the game
 * Like taking your turn in a board game
 */
router.post('/:gameId/move', [
  param('gameId').notEmpty().withMessage('Game ID is required'),
  body('playerId').notEmpty().withMessage('Player ID is required'),
  body('move').isObject().withMessage('Move must be an object'),
  body('move.action').notEmpty().withMessage('Move action is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, move } = req.body;
    
    const gameManager = req.gameManager;
    const result = await gameManager.processPlayerMove(gameId, playerId, move);
    
    if (result.success) {
      // Notify all players of the updated game state
      req.io.to(gameId).emit('game-updated', result.gameState);
      
      // If move triggered AI response, handle it
      if (result.shouldTriggerAI) {
        const aiService = req.aiService;
        const aiResponse = await aiService.generateAIResponse(result.gameState);
        req.io.to(gameId).emit('ai-event', aiResponse);
      }
      
      logger.info(`Move processed for player ${playerId} in game ${gameId}`);
      
      res.json({
        success: true,
        gameState: result.gameState,
        moveResult: result.moveResult,
        message: 'Move processed successfully!'
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }
    
  } catch (error) {
    logger.error('Error processing move:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process move',
      error: error.message
    });
  }
});

/**
 * GET /api/game/:gameId/market
 * Get current market conditions
 * Like checking the stock market or news before making business decisions
 */
router.get('/:gameId/market', [
  param('gameId').notEmpty().withMessage('Game ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const gameManager = req.gameManager;
    const game = gameManager.activeGames.get(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Generate current market analysis
    const aiService = req.aiService;
    const marketAnalysis = await aiService.getMarketContext(game.gameSettings.industry);
    
    res.json({
      success: true,
      marketConditions: game.marketConditions,
      marketAnalysis: marketAnalysis,
      round: game.currentRound,
      phase: game.currentPhase
    });
    
  } catch (error) {
    logger.error('Error getting market conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get market conditions',
      error: error.message
    });
  }
});

/**
 * POST /api/game/:gameId/ai-help
 * Request help from AI tutor
 * Like asking a teacher to explain a difficult concept
 */
router.post('/:gameId/ai-help', [
  param('gameId').notEmpty().withMessage('Game ID is required'),
  body('playerId').notEmpty().withMessage('Player ID is required'),
  body('concept').notEmpty().withMessage('Concept is required'),
  body('context').optional().isObject().withMessage('Context must be an object')
], handleValidationErrors, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId, concept, context = {} } = req.body;
    
    const gameManager = req.gameManager;
    const game = gameManager.activeGames.get(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    // Get AI tutoring response
    const aiService = req.aiService;
    const tutoringResponse = await aiService.generateTutoringResponse(concept, {
      ...context,
      playerStats: player.stats,
      currentCash: player.cash,
      gamePhase: game.currentPhase,
      difficulty: game.gameSettings.difficulty
    });
    
    logger.info(`AI tutoring provided for concept: ${concept} to player: ${playerId}`);
    
    res.json({
      success: true,
      tutoring: tutoringResponse,
      message: 'AI tutoring response generated!'
    });
    
  } catch (error) {
    logger.error('Error getting AI help:', error);
    res.status(500).json({
      success: false,
      message: 'AI tutor is temporarily unavailable',
      error: error.message
    });
  }
});

/**
 * GET /api/game/:gameId/stats
 * Get game statistics and analytics
 * Like getting a report card showing how everyone is doing
 */
router.get('/:gameId/stats', [
  param('gameId').notEmpty().withMessage('Game ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const gameManager = req.gameManager;
    const game = gameManager.activeGames.get(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Calculate game statistics
    const stats = {
      gameInfo: {
        id: game.id,
        status: game.status,
        currentRound: game.currentRound,
        currentPhase: game.currentPhase,
        totalRounds: game.gameSettings.maxRounds
      },
      players: game.players.map(player => ({
        id: player.id,
        name: player.name,
        cash: player.cash,
        robotCount: player.robots.length,
        techCount: player.technologies.length,
        reputation: player.reputation,
        stats: player.stats
      })),
      marketConditions: game.marketConditions,
      eventHistory: game.eventHistory.slice(-5) // Last 5 events
    };
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    logger.error('Error getting game stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game statistics',
      error: error.message
    });
  }
});

/**
 * DELETE /api/game/:gameId
 * Delete/end a game
 * Like cleaning up the board game when everyone's done playing
 */
router.delete('/:gameId', [
  param('gameId').notEmpty().withMessage('Game ID is required'),
  body('playerId').notEmpty().withMessage('Player ID is required')
], handleValidationErrors, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { playerId } = req.body;
    
    const gameManager = req.gameManager;
    const game = gameManager.activeGames.get(gameId);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }
    
    // Check if player has permission to delete game
    // (For now, any player can end the game - in production you might want more rules)
    const player = game.players.find(p => p.id === playerId);
    if (!player) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this game'
      });
    }
    
    // Remove game from active games
    gameManager.activeGames.delete(gameId);
    
    // Notify all players
    req.io.to(gameId).emit('game-ended', {
      message: `Game ended by ${player.name}`,
      finalStats: game.players.map(p => ({
        name: p.name,
        finalCash: p.cash,
        robotsProduced: p.stats.totalProduction,
        totalRevenue: p.stats.totalRevenue
      }))
    });
    
    logger.info(`Game deleted: ${gameId} by player: ${playerId}`);
    
    res.json({
      success: true,
      message: 'Game ended successfully'
    });
    
  } catch (error) {
    logger.error('Error deleting game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end game',
      error: error.message
    });
  }
});

/**
 * GET /api/games/active
 * Get list of active games (for lobby/browse games feature)
 * Like looking at all the board game tables to see which ones have open seats
 */
router.get('/active', async (req, res) => {
  try {
    const gameManager = req.gameManager;
    const activeGames = Array.from(gameManager.activeGames.values())
      .filter(game => game.status === 'waiting' || game.status === 'ready')
      .map(game => ({
        id: game.id,
        status: game.status,
        playerCount: game.players.length,
        maxPlayers: 4,
        difficulty: game.gameSettings.difficulty,
        industry: game.gameSettings.industry,
        createdAt: game.createdAt
      }));
    
    res.json({
      success: true,
      games: activeGames,
      total: activeGames.length
    });
    
  } catch (error) {
    logger.error('Error getting active games:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active games',
      error: error.message
    });
  }
});

module.exports = router;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * These routes are like different service windows at a bank or DMV. Each route
 * handles a specific type of request from the frontend:
 * 
 * 1. CREATE GAME: Sets up a new game session
 * 2. JOIN GAME: Adds a player to an existing game
 * 3. START GAME: Begins gameplay after setup
 * 4. GET GAME STATE: Checks current game status
 * 5. MAKE MOVE: Processes a player's action
 * 6. GET MARKET INFO: Provides business context
 * 7. AI HELP: Gets tutoring from AI
 * 8. GET STATS: Shows game analytics
 * 9. DELETE GAME: Ends a game session
 * 10. LIST GAMES: Shows available games to join
 * 
 * KEY CONCEPTS:
 * - VALIDATION: Checking that requests have all required information
 * - ERROR HANDLING: Gracefully dealing with problems
 * - WEBSOCKET EVENTS: Sending real-time updates to all players
 * - GAME MANAGER: Using our game logic service
 * - AI SERVICE: Calling our AI features
 * 
 * Each route follows the same pattern:
 * 1. Validate the incoming request
 * 2. Process the request using our services
 * 3. Send back a response (success or error)
 * 4. Notify other players if needed (via WebSocket)
 * 5. Log what happened for debugging
 */