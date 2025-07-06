// backend/src/routes/debugRoutes.js
// Debug endpoints to monitor AI status and game state

const express = require('express');
const router = express.Router();

/**
 * Get AI status for a specific game
 */
router.get('/ai-status/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const gameManager = req.gameManager;
    
    const game = gameManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const aiStatus = gameManager.getAIStatus(gameId);
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
        robots: p.robots.length
      })),
      gamePhase: game.currentPhase,
      gameRound: game.currentRound,
      gameStatus: game.status,
      lastActivity: game.lastActivity
    };
    
    res.json(status);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Force AI turn (for debugging stuck AI)
 */
router.post('/force-ai-turn/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const gameManager = req.gameManager;
    
    const game = gameManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const currentPlayer = game.players[game.currentPlayerTurn];
    
    if (!currentPlayer || currentPlayer.type !== 'ai') {
      return res.status(400).json({ error: 'Current player is not AI' });
    }
    
    // Force the AI move
    gameManager.forceAIMove(game, currentPlayer);
    
    res.json({ 
      message: `Forced move for AI player ${currentPlayer.name}`,
      gameState: game
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get game statistics
 */
router.get('/game-stats', (req, res) => {
  try {
    const gameManager = req.gameManager;
    const stats = gameManager.getGameStatistics();
    
    res.json(stats);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get detailed game state
 */
router.get('/game-state/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const gameManager = req.gameManager;
    
    const game = gameManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger AI turn manually
 */
router.post('/trigger-ai-turn/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const gameManager = req.gameManager;
    
    const game = gameManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Trigger AI turn check
    gameManager.checkAndProcessAITurn(game);
    
    res.json({ 
      message: 'AI turn check triggered',
      currentPlayer: game.players[game.currentPlayerTurn]?.name
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;