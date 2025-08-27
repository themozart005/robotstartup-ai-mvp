// backend/src/routes/aiRoutes.js
// Handles AI-related API endpoints with phase-specific tutoring

const express = require('express');
const router = express.Router();

// Get AI tutoring help for a specific concept with phase-specific context
router.post('/tutoring', async (req, res) => {
  try {
    const { concept, context } = req.body;
    
    if (!concept) {
      return res.status(400).json({ error: 'Concept is required' });
    }

    // Log the incoming context for debugging
    console.log('AI Tutoring Request:', {
      concept,
      phase: context?.currentPhase,
      hasSpecificContext: !!context?.specificContext
    });

    // Use the AI service from middleware with phase-specific context
    const aiHelp = await req.aiService.generateTutoringResponse(concept, context);
    
    res.json({
      success: true,
      explanation: aiHelp.explanation,
      immediateHelp: aiHelp.immediateHelp,
      recommendation: aiHelp.recommendation,
      calculation: aiHelp.calculation,
      example: aiHelp.example,
      gameApplication: aiHelp.gameApplication,
      tip: aiHelp.tip,
      followUpQuestions: aiHelp.followUpQuestions,
      phaseSpecificTips: aiHelp.phaseSpecificTips,
      suggestions: aiHelp.suggestions || [],
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

// Get AI strategic advice with phase context
router.post('/strategic-advice', async (req, res) => {
  try {
    const { gameState, playerData, phaseContext } = req.body;
    
    // Enhanced strategic advice with phase awareness
    const advice = await req.aiService.generateStrategicAdvice(gameState, playerData, phaseContext);
    
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
    const status = await req.aiService.getStatus();
    res.json({
      status: status.enabled ? 'healthy' : 'unhealthy',
      service: 'AI Service',
      model: status.currentModel,
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