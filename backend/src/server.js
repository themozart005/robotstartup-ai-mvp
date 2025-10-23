// backend/src/server.js
// COMPLETE DEPLOYMENT-READY VERSION - Works both locally and externally

// Debug startup
console.log('🚀 Server starting...');
console.log('PORT from env:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current directory:', __dirname);

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB().then(() => {
  logger.info('🎮 Database ready - Users and games can now be saved!');
}).catch(err => {
  logger.error('💥 Database connection failed - app will not start:', err);
  process.exit(1);
});

// Import our custom modules
const gameRoutes = require('./routes/gameRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const progressRoutes = require('./routes/progressRoutes');
const GameManager = require('./services/GameManager');
const AIService = require('./services/AIService');
const logger = require('./utils/logger');

// Create Express app (our web server)
const app = express();
const server = http.createServer(app);

// ===== STRIPE WEBHOOK ROUTE (MUST BE BEFORE express.json()) =====
const webhookRoutes = require('./routes/webhookRoutes');
app.use('/api/webhooks', webhookRoutes);
// ================================================================

// DEPLOYMENT-READY CORS CONFIGURATION
// ===== CORS CONFIGURATION (SINGLE VERSION) =====

const getAllowedOrigins = () => {
  const origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "https://localhost:3000",
    "https://localhost:5173",
  ];

  // Add production frontend URL
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
    console.log('🌐 Added production frontend URL:', process.env.FRONTEND_URL);
  }

  // Add Vercel deployment patterns
  if (process.env.NODE_ENV === 'production') {
    origins.push(
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.railway\.app$/,
    );
    console.log('🚀 Added production domain patterns for deployment');
  }

  console.log('✅ Allowed CORS origins:', origins);
  return origins;
};

// Socket.IO setup with CORS
const io = socketIo(server, {
  cors: {
    origin: getAllowedOrigins(),
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: process.env.NODE_ENV === 'production' ? 60000 : 20000,
  pingInterval: process.env.NODE_ENV === 'production' ? 25000 : 10000,
});

// Express CORS configuration (SINGLE DEFINITION)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = getAllowedOrigins();
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      }
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(null, true); // Temporarily allow for debugging
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "x-requested-with", "Accept"],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400
};

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  } : false,
}));

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle OPTIONS preflight explicitly
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize our game services
const gameManager = new GameManager();
const aiService = new AIService();

// FIXED: Connect GameManager to Socket.IO for broadcasting
gameManager.setSocketIO(io);
gameManager.setAIService(aiService); 

// Make services available to all routes
app.use((req, res, next) => {
  req.gameManager = gameManager;
  req.aiService = aiService;
  req.io = io;
  next();
});

// Root endpoint for deployment health checks
app.get('/', (req, res) => {
  res.json({ 
    message: 'RoboStartup AI Backend API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    allowedOrigins: getAllowedOrigins().length
  });
});

// ENHANCED GAME CREATION ENDPOINT
app.post('/api/game/create', async (req, res) => {
  try {
    const { playerName, difficulty, industry, maxRounds, allowAI } = req.body;
    
    if (!playerName || !playerName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Player name is required'
      });
    }
    
    logger.info(`Creating game for player ${playerName.trim()}`);
    logger.info(`Game settings: difficulty=${difficulty}, industry=${industry}, rounds=${maxRounds}, AI=${allowAI}`);
    
    const gameResult = await gameManager.createGame({
      maxRounds: maxRounds || 5,
      difficulty: difficulty || 'beginner',
      industry: industry || 'robotics',
      allowAI: allowAI !== false,
      aiCount: 3
    });
    
    const gameConfig = {
      gameId: gameResult.gameId,
      playerName: playerName.trim(),
      difficulty: difficulty || 'beginner',
      industry: industry || 'robotics',
      maxRounds: maxRounds || 5,
      allowAI: allowAI !== false,
      aiCount: 3,
      createdAt: new Date().toISOString(),
      status: 'waiting_for_players',
      gameState: gameResult.gameState
    };
    
    logger.info(`✅ Game created successfully: ${gameResult.gameId} with 3 AI opponents planned`);
    
    res.json({
      success: true,
      gameId: gameResult.gameId,
      message: 'Game created successfully with 3 AI opponents',
      gameConfig: gameConfig
    });
    
  } catch (error) {
    logger.error('Error creating game:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create game',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Payment routes 
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

// Set up API routes
app.use('/api/game', gameRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/progress', progressRoutes);

// DEBUG ROUTES - For monitoring AI and game status
app.use('/api/debug', (req, res, next) => {
  req.gameManager = gameManager;
  req.aiService = aiService;
  next();
});

// Get AI status for a specific game
app.get('/api/debug/ai-status/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = gameManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const aiStatus = gameManager.getAIStatus ? gameManager.getAIStatus(gameId) : null;
    const currentPlayer = game.players[game.currentPlayerTurn];
    
    const status = {
      gameId: gameId,
      currentTurn: game.currentPlayerTurn,
      currentPlayer: {
        name: currentPlayer?.name,
        type: currentPlayer?.type,
        id: currentPlayer?.id
      },
      aiStatus: aiStatus,
      allPlayers: game.players.map(p => ({
        name: p.name,
        type: p.type,
        id: p.id,
        cash: p.cash,
        robots: p.robots.length,
        personality: p.aiPersonality?.strategy || 'N/A'
      })),
      gamePhase: game.currentPhase,
      gameRound: game.currentRound,
      gameStatus: game.status,
      lastActivity: game.lastActivity,
      totalAIPlayers: game.players.filter(p => p.type === 'ai').length
    };
    
    res.json(status);
    
  } catch (error) {
    logger.error('Debug AI status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Force AI turn (for debugging stuck AI)
app.post('/api/debug/force-ai-turn/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = gameManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const currentPlayer = game.players[game.currentPlayerTurn];
    
    if (!currentPlayer || currentPlayer.type !== 'ai') {
      return res.status(400).json({ 
        error: 'Current player is not AI',
        currentPlayer: currentPlayer?.name,
        currentPlayerType: currentPlayer?.type
      });
    }
    
    if (gameManager.forceAIMove) {
      gameManager.forceAIMove(game, currentPlayer);
      
      res.json({ 
        message: `Forced move for AI player ${currentPlayer.name}`,
        nextPlayer: game.players[game.currentPlayerTurn]?.name
      });
    } else {
      res.status(500).json({ error: 'forceAIMove method not available' });
    }
    
  } catch (error) {
    logger.error('Debug force AI turn error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trigger AI turn manually
app.post('/api/debug/trigger-ai-turn/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = gameManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    if (gameManager.checkAndProcessAITurn) {
      gameManager.checkAndProcessAITurn(game);
      
      res.json({ 
        message: 'AI turn check triggered',
        currentPlayer: game.players[game.currentPlayerTurn]?.name,
        currentPlayerType: game.players[game.currentPlayerTurn]?.type
      });
    } else {
      res.status(500).json({ error: 'checkAndProcessAITurn method not available' });
    }
    
  } catch (error) {
    logger.error('Debug trigger AI turn error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get game statistics
app.get('/api/debug/game-stats', (req, res) => {
  try {
    const stats = gameManager.getGameStatistics();
    
    const enhancedStats = {
      ...stats,
      aiService: {
        enabled: aiService.isAvailable(),
        status: aiService.getStatus ? aiService.getStatus() : 'unknown'
      },
      serverUptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      socketConnections: io.engine.clientsCount,
      allowedOrigins: getAllowedOrigins(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.json(enhancedStats);
    
  } catch (error) {
    logger.error('Debug game stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed game state
app.get('/api/debug/game-state/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    
    const game = gameManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game);
    
  } catch (error) {
    logger.error('Debug game state error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint - Enhanced for production monitoring
app.get('/health', (req, res) => {
  const gameStats = gameManager.getGameStatistics();
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    socketConnections: io.engine.clientsCount,
    gameStats: gameStats,
    aiService: aiService.getStatus ? aiService.getStatus() : { enabled: aiService.isAvailable() },
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    allowedOrigins: getAllowedOrigins().length
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Player connected: ${socket.id} (Total connections: ${io.engine.clientsCount})`);

  socket.emit('connected', { 
    socketId: socket.id, 
    timestamp: new Date().toISOString(),
    serverVersion: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });

  // Enhanced join-game handler
  socket.on('join-game', async (data) => {
    try {
      const { gameId, playerName, playerType } = data;
      
      logger.info(`🎮 Player ${playerName} attempting to join game ${gameId}`);
      
      const existingGame = gameManager.activeGames.get(gameId);
      if (!existingGame) {
        logger.error(`❌ Game ${gameId} not found in GameManager`);
        socket.emit('join-game-error', { message: `Game ${gameId} not found. Please create a new game.` });
        return;
      }
      
	  // Check if player already exists in the game
	  let playerId = socket.id;
      const existingPlayer = existingGame.players.find(p => p.name === playerName);
      
	  if (existingPlayer) {
      // Player rejoining - update their ID to the new socket ID
		logger.info(`🔄 Player ${playerName} rejoining with new socket ID`);
      
		// Update the player ID in the game
		existingPlayer.id = socket.id;
		playerId = socket.id;
      
		// Store on socket
		socket.gameId = gameId;
		socket.playerId = playerId;
		socket.playerName = playerName;
      
		// Join the room
		socket.join(gameId);
		// Send success with existing game state
		socket.emit('join-game-success', {
		  gameId: gameId,
          playerId: playerId,
          gameState: existingGame,
          message: `Rejoined game as ${playerName}`
		});
		
		// Notify others
		socket.to(gameId).emit('player-rejoined', {
          player: existingPlayer,
          gameState: existingGame
		});
		return;
	  }
	  
	  // NEW PLAYER CASE - Keep your existing code for new players
	  logger.info(`✅ Game ${gameId} found, adding NEW player ${playerName}`);
      
      socket.join(gameId);
      
      //const playerId = socket.id;
      
      const gameState = await gameManager.addPlayerToGame(gameId, playerId, playerName, playerType);
      
      socket.gameId = gameId;
      socket.playerId = playerId;
      socket.playerName = playerName;
      
      socket.emit('join-game-success', {
        gameId: gameId,
        playerId: playerId,
        gameState: gameState,
        message: `Successfully joined game as ${playerName}. ${gameState.players.filter(p => p.type === 'ai').length} AI opponents ready!`
      });
      
      // FIXED: GameManager will handle broadcasting via broadcastGameState()
      
      socket.to(gameId).emit('player-joined', {
        player: { id: playerId, name: playerName, type: playerType },
        gameState: gameState
      });
      
      logger.info(`✅ Player ${playerName} successfully joined game ${gameId} with ${gameState.players.filter(p => p.type === 'ai').length} AI opponents`);
      
    } catch (error) {
      logger.error('Error joining game:', error);
      socket.emit('join-game-error', { message: error.message });
    }
  });

  // Enhanced player-move handler
  socket.on('player-move', async (data) => {
    try {
      const { gameId, move } = data;
      const playerId = socket.playerId || socket.id;
      
	  // Try to find player by socket ID first, then by name
	  const game = gameManager.activeGames.get(gameId);
      if (game) {
        let player = game.players.find(p => p.id === playerId);
      
      // If not found by ID, try to find by name and update the ID
        if (!player && socket.playerName) {
          player = game.players.find(p => p.name === socket.playerName);
          if (player) {
          // Update the player's ID to the new socket ID
            player.id = socket.id;
            logger.info(`🔄 Updated player ${player.name} ID to new socket ID: ${socket.id}`);
          }
        }
      
        if (!player) {
          socket.emit('move-error', { message: 'Player not found. Please rejoin the game.' });
          return;
		}
      }
	  
      logger.info(`🎯 Processing move from player ${playerId} (${socket.playerName || 'Unknown'}) in game ${gameId}:`, move);
      
      const result = await gameManager.processPlayerMove(gameId, playerId, move);
      
      if (result.success) {
        logger.info(`✅ Move successful for player ${playerId}, game state will be broadcast by GameManager`);
        
        // FIXED: GameManager handles broadcasting via broadcastGameState()
        
        socket.emit('move-success', { 
          gameState: result.gameState, 
          moveResult: { message: result.message || 'Move successful!' }
        });
        
        if (result.shouldTriggerAI) {
          logger.info('🤖 Triggering AI market event');
          try {
            const aiResponse = await aiService.generateMarketEvent(result.gameState);
            io.to(gameId).emit('ai-event', aiResponse);
          } catch (aiError) {
            logger.error('AI event generation failed:', aiError);
          }
        }
        
        if (result.gameComplete) {
          logger.info(`🏆 Game ${gameId} completed! Winner: ${result.winner?.name}`);
          io.to(gameId).emit('game-finished', {
            winner: result.winner,
            finalScores: result.gameState.players,
            gameState: result.gameState
          });
        }
        
      } else {
        logger.info(`❌ Move failed for player ${playerId}: ${result.error}`);
        socket.emit('move-error', { message: result.error });
      }
    } catch (error) {
      logger.error('Error processing move:', error);
      socket.emit('move-error', { message: error.message });
    }
  });

  // ENHANCED AI TUTORING REQUEST WITH PHASE-SPECIFIC CONTEXT
  socket.on('request-help', async (data) => {
    try {
      const { gameId, concept, context } = data;
      
      // Log the phase-specific context for debugging
      logger.info(`🤖 AI tutoring requested by ${socket.playerName || socket.id}`);
      logger.info(`📚 Concept: ${concept}`);
      logger.info(`📍 Phase: ${context?.currentPhase || 'unknown'}`);
      logger.info(`💰 Player Cash: $${context?.playerCash || 0}`);
      
      // Log phase-specific details if available
      if (context?.specificContext) {
        logger.info(`🎯 Phase-specific context provided:`, {
          phase: context.currentPhase,
          hasSpecificContext: true,
          contextKeys: Object.keys(context.specificContext)
        });
        
        // Log specific phase data for debugging
        if (context.currentPhase === 'production' && context.specificContext.canAffordQuantity !== undefined) {
          logger.info(`🏭 Production context: Can afford ${context.specificContext.canAffordQuantity} robots`);
        }
        if (context.currentPhase === 'funding' && context.specificContext.currentEquity !== undefined) {
          logger.info(`💼 Funding context: Current equity ${context.specificContext.currentEquity}%`);
        }
        if (context.currentPhase === 'growth' && context.specificContext.reputation !== undefined) {
          logger.info(`📈 Growth context: Current reputation ${context.specificContext.reputation}`);
        }
      }
      
      // Get the current game state for additional context
      const game = gameId ? gameManager.getGame(gameId) : null;
      
      // Enhance context with game data if available
      const enhancedContext = {
        ...context,
        gameRound: game?.currentRound,
        marketDemand: game?.marketConditions?.demand,
        playerCount: game?.players?.length
      };
      
      // Generate AI tutoring response with enhanced context
      const aiHelp = await aiService.generateTutoringResponse(concept, enhancedContext);
      
      // Emit the enhanced response
      socket.emit('ai-tutoring', {
        ...aiHelp,
        concept: concept,
        phaseContext: context?.currentPhase,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ AI tutoring provided for ${concept} in ${context?.currentPhase || 'general'} phase`);
      
      // Track tutoring metrics
      if (gameManager.trackTutoringRequest) {
        gameManager.trackTutoringRequest(gameId, concept, context?.currentPhase);
      }
      
    } catch (error) {
      logger.error('Error providing AI help:', error);
      
      // Send a helpful fallback response even on error
      const fallbackHelp = {
        explanation: `I can help you understand ${data.concept || 'this concept'}.`,
        immediateHelp: data.context?.specificContext ? 
          `You're in the ${data.context.currentPhase} phase with $${data.context.playerCash} available.` :
          'Let me help you with your current decision.',
        recommendation: 'Consider your available resources and plan ahead.',
        tip: 'Make decisions based on your current game state.',
        followUpQuestions: ['How does this affect my strategy?', 'What should I prioritize?'],
        error: true,
        errorMessage: 'AI service temporarily unavailable - showing basic help'
      };
      
      socket.emit('ai-tutoring', fallbackHelp);
      socket.emit('ai-tutoring-error', { 
        message: 'AI tutor is temporarily unavailable. Basic guidance provided.',
        concept: data.concept
      });
    }
  });

  // Player leaves game
  socket.on('leave-game', async (data) => {
    try {
      const { gameId } = data;
      const playerId = socket.playerId || socket.id;
      
      logger.info(`👋 Player ${socket.playerName || playerId} leaving game ${gameId}`);
      
      socket.leave(gameId);
      
      socket.to(gameId).emit('player-left', {
        player: { id: playerId, name: socket.playerName || 'Unknown' }
      });
      
      delete socket.gameId;
      delete socket.playerId;
      delete socket.playerName;
      
    } catch (error) {
      logger.error('Error leaving game:', error);
    }
  });

  // Chat message handling
  socket.on('chat-message', async (data) => {
    try {
      const { gameId, message } = data;
      const playerId = socket.playerId || socket.id;
      const playerName = socket.playerName || 'Unknown';
      
      socket.to(gameId).emit('chat-message', {
        playerId,
        playerName,
        message,
        timestamp: new Date()
      });
      
      logger.info(`💬 Chat message from ${playerName} in game ${gameId}: ${message}`);
    } catch (error) {
      logger.error('Error handling chat message:', error);
    }
  });

  // Player disconnection
  socket.on('disconnect', (reason) => {
    logger.info(`Player disconnected: ${socket.id}, reason: ${reason} (Remaining connections: ${io.engine.clientsCount - 1})`);
    
    if (socket.gameId && socket.playerId) {
      socket.to(socket.gameId).emit('player-disconnected', {
        playerId: socket.playerId,
        playerName: socket.playerName || 'Unknown',
        temporary: true
      });
      
      logger.info(`📤 Notified game ${socket.gameId} that player ${socket.playerName || socket.playerId} disconnected`);
    }
  });

  // Connection errors
  socket.on('connect_error', (error) => {
    logger.error('Socket connection error:', error);
  });

  // Generic error handler
  socket.on('error', (error) => {
    logger.error('Socket error:', error);
    socket.emit('error', { message: 'An unexpected error occurred' });
  });
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/game/create',
      'GET /api/debug/*'
    ]
  });
});

// Periodic cleanup of old games
setInterval(() => {
  try {
    gameManager.cleanupGames();
  } catch (error) {
    logger.error('Error during game cleanup:', error);
  }
}, 5 * 60 * 1000);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down server gracefully');
  server.close(() => {
    logger.info('Server shut down complete');
    // Clean up resources
    if (gameManager && gameManager.cleanup) {
      gameManager.cleanup();
    }
    process.exit(0);
  });
  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
  
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down server gracefully');
  server.close(() => {
    logger.info('Server shut down complete');
    if (gameManager && gameManager.cleanup) {
      gameManager.cleanup();
    }
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Give Railway time to log the error
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Give Railway time to log the error
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 RoboStartup AI server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌐 CORS enabled for: ${getAllowedOrigins().length} origins`);
  if (process.env.FRONTEND_URL) {
    logger.info(`🎯 Production frontend URL: ${process.env.FRONTEND_URL}`);
  }
  logger.info(`🔌 Socket.IO ready for connections`);
  logger.info(`🎮 GameManager initialized with 3 AI opponents per game`);
  logger.info(`🤖 AI Service initialized with OpenAI integration`);
  logger.info(`🔧 Debug routes available at /api/debug/*`);
  logger.info(`📡 GameManager connected to Socket.IO for real-time broadcasting`);
  logger.info(`📚 Phase-specific AI tutoring enabled for targeted help`);
  logger.info(`🚀 Server ready for both local development and external deployment`);
});

module.exports = { app, server, io };