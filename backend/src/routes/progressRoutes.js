// backend/src/routes/progressRoutes.js
// Handles learning progress and analytics

const express = require('express');
const router = express.Router();

// In-memory storage for MVP (replace with database later)
let playerProgress = {};
let gameHistory = [];

// Get player progress
router.get('/player/:playerId', (req, res) => {
  try {
    const { playerId } = req.params;
    
    const progress = playerProgress[playerId] || {
      playerId: playerId,
      gamesPlayed: 0,
      conceptsLearned: [],
      achievements: [],
      totalScore: 0,
      bestScore: 0,
      skillLevels: {
        financial: 0,
        strategic: 0,
        technical: 0,
        market: 0
      }
    };
    
    res.json({ success: true, progress });
    
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch player progress' });
  }
});

// Update player progress after game
router.post('/update', (req, res) => {
  try {
    const { playerId, gameData, conceptsLearned, score } = req.body;
    
    if (!playerId) {
      return res.status(400).json({ error: 'Player ID is required' });
    }
    
    // Initialize player progress if it doesn't exist
    if (!playerProgress[playerId]) {
      playerProgress[playerId] = {
        playerId: playerId,
        gamesPlayed: 0,
        conceptsLearned: [],
        achievements: [],
        totalScore: 0,
        bestScore: 0,
        skillLevels: {
          financial: 0,
          strategic: 0,
          technical: 0,
          market: 0
        }
      };
    }
    
    const progress = playerProgress[playerId];
    
    // Update progress
    progress.gamesPlayed += 1;
    progress.totalScore += score || 0;
    progress.bestScore = Math.max(progress.bestScore, score || 0);
    
    // Add new concepts learned
    if (conceptsLearned && Array.isArray(conceptsLearned)) {
      conceptsLearned.forEach(concept => {
        if (!progress.conceptsLearned.includes(concept)) {
          progress.conceptsLearned.push(concept);
        }
      });
    }
    
    // Check for new achievements
    const newAchievements = checkAchievements(progress);
    progress.achievements = [...new Set([...progress.achievements, ...newAchievements])];
    
    // Store game in history
    gameHistory.push({
      playerId,
      gameData,
      score,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      success: true, 
      progress,
      newAchievements 
    });
    
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const leaderboard = Object.values(playerProgress)
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 10)
      .map(player => ({
        playerId: player.playerId,
        bestScore: player.bestScore,
        gamesPlayed: player.gamesPlayed,
        conceptsLearned: player.conceptsLearned.length
      }));
    
    res.json({ success: true, leaderboard });
    
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get analytics summary
router.get('/analytics', (req, res) => {
  try {
    const totalPlayers = Object.keys(playerProgress).length;
    const totalGames = gameHistory.length;
    const totalConcepts = new Set(
      Object.values(playerProgress).flatMap(p => p.conceptsLearned)
    ).size;
    
    const averageScore = gameHistory.length > 0 
      ? gameHistory.reduce((sum, game) => sum + (game.score || 0), 0) / gameHistory.length
      : 0;
    
    res.json({
      success: true,
      analytics: {
        totalPlayers,
        totalGames,
        totalConcepts,
        averageScore: Math.round(averageScore)
      }
    });
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Helper function to check for achievements
function checkAchievements(progress) {
  const achievements = [];
  
  if (progress.gamesPlayed === 1) {
    achievements.push('First Game');
  }
  
  if (progress.gamesPlayed === 10) {
    achievements.push('Veteran Player');
  }
  
  if (progress.conceptsLearned.length >= 5) {
    achievements.push('Quick Learner');
  }
  
  if (progress.bestScore >= 1000) {
    achievements.push('High Achiever');
  }
  
  return achievements;
}

module.exports = router;