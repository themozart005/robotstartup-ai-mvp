// backend/src/routes/aiRoutes.js
// Handles AI-related API endpoints

const express = require('express');
const router = express.Router();

// Get AI tutoring help for a specific concept
router.post('/tutoring', async (req, res) => {
  try {
    const { concept, context, gameState } = req.body;
    
    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    // Use the AI service from middleware
    const aiHelp = await req.aiService.generateTutoringResponse(concept, context, gameState);
    
    res.json({
      success: true,
      explanation: aiHelp.explanation,
      suggestions: aiHelp.suggestions,
      concept: concept
    });
    
  } catch (error) {
    console.error('AI tutoring error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI tutoring response',
      message: error.message 
    });
  }
});

// Get AI market analysis
router.post('/market-analysis', async (req, res) => {
  try {
    const { gameState, industry } = req.body;
    
    const analysis = await req.aiService.generateMarketAnalysis(gameState, industry);
    
    res.json({
      success: true,
      analysis: analysis
    });
    
  } catch (error) {
    console.error('Market analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to generate market analysis',
      message: error.message 
    });
  }
});

// Get AI strategic advice
router.post('/strategic-advice', async (req, res) => {
  try {
    const { gameState, playerData } = req.body;
    
    const advice = await req.aiService.generateStrategicAdvice(gameState, playerData);
    
    res.json({
      success: true,
      advice: advice
    });
    
  } catch (error) {
    console.error('Strategic advice error:', error);
    res.status(500).json({ 
      error: 'Failed to generate strategic advice',
      message: error.message 
    });
  }
});

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await req.aiService.checkHealth();
    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      service: 'AI Service',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;