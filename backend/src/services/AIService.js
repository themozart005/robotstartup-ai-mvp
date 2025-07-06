// backend/src/services/AIService.js
// ENHANCED VERSION - Uses GPT-4 with fallback to GPT-3.5-turbo and safety checks

const OpenAI = require('openai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Model preference order
    this.preferredModel = 'gpt-4';
    this.fallbackModel = 'gpt-3.5-turbo';
    this.currentModel = this.preferredModel;
    
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured. AI features will be disabled.');
      this.isEnabled = false;
    } else {
      this.isEnabled = true;
      logger.info(`✅ AI Service initialized with OpenAI (preferred model: ${this.preferredModel})`);
      
      // Test connection on startup
      this.testConnection();
    }
  }

  /**
   * Make AI request with automatic fallback
   */
  async makeAIRequest(messages, options = {}) {
    if (!this.isEnabled) {
      throw new Error('AI service is disabled');
    }

    const defaultOptions = {
      max_tokens: 300,
      temperature: 0.7,
      ...options
    };

    // Try preferred model first
    try {
      logger.info(`🤖 Making AI request with ${this.currentModel}`);
      
      const completion = await this.openai.chat.completions.create({
        model: this.currentModel,
        messages: messages,
        ...defaultOptions
      });

      return completion.choices[0].message.content.trim();

    } catch (error) {
      // If GPT-4 fails, try GPT-3.5-turbo
      if (this.currentModel === this.preferredModel && error.status === 404) {
        logger.warn(`${this.preferredModel} not available, falling back to ${this.fallbackModel}`);
        this.currentModel = this.fallbackModel;
        
        try {
          const completion = await this.openai.chat.completions.create({
            model: this.currentModel,
            messages: messages,
            ...defaultOptions
          });

          return completion.choices[0].message.content.trim();

        } catch (fallbackError) {
          logger.error(`Both models failed. GPT-4 error: ${error.message}, GPT-3.5 error: ${fallbackError.message}`);
          throw fallbackError;
        }
      } else {
        logger.error(`AI request failed with ${this.currentModel}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Generate a market event based on game state
   */
  async generateMarketEvent(gameState) {
    if (!this.isEnabled) {
      return this.getFallbackMarketEvent();
    }

    try {
      const prompt = `You are an AI tutor for a business education game about robotics companies. 

Current game situation:
- Round: ${gameState.currentRound} of ${gameState.gameSettings.maxRounds}
- Phase: ${gameState.currentPhase}
- Market demand: ${gameState.marketConditions.demand}
- Active players: ${gameState.players.length}
- Industry focus: ${gameState.gameSettings.industry}
- Difficulty: ${gameState.gameSettings.difficulty}

Generate a realistic business market event that would affect robotics companies. Keep it educational and age-appropriate for students aged 12-18. The event should be relevant to the current game phase and round.

Respond with a JSON object containing:
- title: Brief event title (max 50 characters)
- description: Educational explanation (max 150 characters)  
- impact: How this affects the game ("positive", "negative", or "neutral")
- significance: How important this is ("low", "medium", or "high")
- educationalTip: Brief learning point for students (max 100 characters)

Example format:
{"title": "Tech Breakthrough in AI", "description": "New AI chip technology reduces robot manufacturing costs by 15%", "impact": "positive", "significance": "medium", "educationalTip": "Innovation can create competitive advantages"}`;

      const messages = [
        {
          role: "system",
          content: "You are an educational AI assistant that creates realistic business scenarios for a robotics company simulation game. Always respond with valid JSON only, no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const response = await this.makeAIRequest(messages, { max_tokens: 250, temperature: 0.8 });
      
      try {
        const eventData = JSON.parse(response);
        
        // Validate required fields
        if (!eventData.title || !eventData.description || !eventData.impact) {
          throw new Error('Invalid AI response format');
        }
        
        logger.info(`✅ AI market event generated with ${this.currentModel}:`, eventData.title);
        return eventData;
        
      } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError.message);
        logger.debug('Raw AI response:', response);
        return this.getFallbackMarketEvent();
      }

    } catch (error) {
      logger.error('Error generating market event:', error.message);
      return this.getFallbackMarketEvent();
    }
  }

  /**
   * Generate personalized tutoring response
   */
  async generateTutoringResponse(concept, context) {
    if (!this.isEnabled) {
      return this.getFallbackTutoringResponse(concept);
    }

    try {
      const prompt = `You are an AI business tutor helping a student (age 12-18) understand business concepts through a robotics company simulation game.

Student needs help with: ${concept}

Current game context:
- Game phase: ${context.currentPhase || 'startup'}
- Student's cash: $${context.playerCash || 500000}
- Current round: ${context.round || 1}
- Robot count: ${context.robotCount || 0}
- Technologies owned: ${context.techCount || 0}

Provide a helpful, encouraging explanation that:
1. Explains the concept in simple, clear terms
2. Gives a relatable real-world example 
3. Shows how it applies to their current game situation
4. Offers a practical, actionable tip
5. Encourages continued learning

Use encouraging, positive language. Be specific about their current situation. Keep explanations concise but complete.`;

      const messages = [
        {
          role: "system", 
          content: "You are a patient, encouraging AI tutor that explains business concepts to young students in simple, practical terms. You make learning fun and relatable."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const explanation = await this.makeAIRequest(messages, { max_tokens: 350, temperature: 0.6 });
      
      const response = {
        explanation: explanation,
        example: this.getRelevantExample(concept),
        gameApplication: `With your current $${context.playerCash || '500K'} and ${context.robotCount || 0} robots, ${this.getGameApplication(concept, context)}`,
        tip: this.getActionableTip(concept),
        followUpQuestions: this.getFollowUpQuestions(concept)
      };

      logger.info(`✅ AI tutoring response generated with ${this.currentModel} for:`, concept);
      return response;

    } catch (error) {
      logger.error('Error generating tutoring response:', error.message);
      return this.getFallbackTutoringResponse(concept);
    }
  }

  /**
   * Get relevant real-world examples for concepts
   */
  getRelevantExample(concept) {
    const examples = {
      'cash-flow-management': "Tesla carefully manages cash flow to fund both current operations and future R&D investments",
      'innovation-strategy': "Boston Dynamics invests heavily in R&D to create robots that competitors can't match",
      'production-planning': "Toyota's 'just-in-time' production system minimizes waste while meeting customer demand",
      'pricing-strategy': "Apple prices products at premium levels because of their brand value and innovation",
      'market-analysis': "Amazon studies customer data to predict which products will be popular",
      'risk-management': "Diversified companies like General Electric spread risk across multiple business areas",
      'general-strategy': "Netflix pivoted from DVDs to streaming when they saw technology trends changing"
    };
    
    return examples[concept] || examples['general-strategy'];
  }

  /**
   * Get game-specific application advice
   */
  getGameApplication(concept, context) {
    const phase = context.currentPhase || 'startup';
    
    const applications = {
      'startup': "this is perfect timing to plan your strategy for the round",
      'r&d': "you can apply this when deciding which technologies to invest in",
      'production': "this helps you decide how many robots to build",
      'sales': "this guides your pricing and sales strategy",
      'investment': "this informs your financing and growth decisions"
    };
    
    return applications[phase] || applications['startup'];
  }

  /**
   * Get actionable tips for concepts
   */
  getActionableTip(concept) {
    const tips = {
      'cash-flow-management': "Keep at least 20% of your cash as emergency reserves",
      'innovation-strategy': "Start with cheaper technologies and reinvest profits in advanced research",
      'production-planning': "Build slightly less than maximum capacity until you understand demand",
      'pricing-strategy': "Price 10-20% above costs initially, then adjust based on sales results",
      'market-analysis': "Watch the market demand indicator to time your production",
      'risk-management': "Diversify your robot types to reduce dependence on one market",
      'general-strategy': "Set specific goals each round and track your progress toward them"
    };
    
    return tips[concept] || tips['general-strategy'];
  }

  /**
   * Get relevant follow-up questions
   */
  getFollowUpQuestions(concept) {
    const questions = {
      'cash-flow-management': ["How do loans affect cash flow?", "What's the difference between profit and cash flow?"],
      'innovation-strategy': ["How do I choose which technologies to research?", "When should I focus on innovation vs. production?"],
      'production-planning': ["How do I predict customer demand?", "What affects production capacity?"],
      'pricing-strategy': ["How do competitors affect my pricing?", "What's the relationship between price and demand?"],
      'market-analysis': ["What economic factors affect robotics demand?", "How do I identify market trends?"],
      'risk-management': ["What are the biggest risks in the robotics industry?", "How do I balance risk and reward?"],
      'general-strategy': ["How do I develop a long-term business plan?", "What makes a strategy successful?"]
    };
    
    return questions[concept] || questions['general-strategy'];
  }

  /**
   * Fallback market event when AI is unavailable
   */
  getFallbackMarketEvent() {
    const fallbackEvents = [
      {
        title: "Industry Conference",
        description: "Robotics experts share latest innovations. Great time for R&D investments.",
        impact: "positive",
        significance: "medium",
        educationalTip: "Industry events often signal good investment opportunities"
      },
      {
        title: "Supply Chain Adjustment",
        description: "Component costs fluctuate due to global supply changes. Plan production carefully.",
        impact: "neutral",
        significance: "medium",
        educationalTip: "Supply chain management affects all manufacturing businesses"
      },
      {
        title: "Customer Demand Shift",
        description: "Market preferences evolving toward smarter, more efficient robots.",
        impact: "neutral",
        significance: "high",
        educationalTip: "Successful companies adapt to changing customer preferences"
      },
      {
        title: "Funding Opportunity",
        description: "New investment capital available for innovative robotics companies.",
        impact: "positive",
        significance: "low",
        educationalTip: "Access to capital helps companies grow and innovate"
      },
      {
        title: "Competitive Landscape",
        description: "New competitor enters market with innovative approach. Stay competitive!",
        impact: "negative",
        significance: "medium",
        educationalTip: "Competition drives innovation and efficiency improvements"
      }
    ];

    const randomEvent = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
    logger.info('📋 Using fallback market event:', randomEvent.title);
    return randomEvent;
  }

  /**
   * Fallback tutoring response when AI is unavailable
   */
  getFallbackTutoringResponse(concept) {
    const fallbackResponses = {
      'cash-flow-management': {
        explanation: "Cash flow is the lifeblood of your business - it's tracking money coming in from sales and money going out for expenses. Positive cash flow means you're earning more than you're spending, which is essential for growth and stability.",
        example: "Think of it like your bank account - you want more deposits than withdrawals!",
        gameApplication: "Track your robot sales income versus your production and research costs each round.",
        tip: "Always keep some cash saved for unexpected opportunities or emergencies.",
        followUpQuestions: ["How do I improve my cash flow?", "What's the difference between profit and cash flow?"]
      },
      'innovation-strategy': {
        explanation: "Innovation strategy is your plan for developing new technologies and improving your products. It's about investing in research and development (R&D) to create competitive advantages that make your robots better than competitors'.",
        example: "Apple's innovation strategy focuses on user-friendly design and premium features.",
        gameApplication: "Choose R&D investments that align with market demand and your business goals.",
        tip: "Balance innovation spending with other business needs - don't spend everything on research!",
        followUpQuestions: ["Which technologies should I prioritize?", "How much should I spend on R&D?"]
      },
      'production-planning': {
        explanation: "Production planning involves deciding how many robots to build, when to build them, and what types to focus on. Good planning considers market demand, your production capacity, and available resources.",
        example: "Tesla plans production based on pre-orders and market analysis to avoid overproduction.",
        gameApplication: "Look at market demand indicators to guide your production decisions each round.",
        tip: "Start conservative - build fewer robots until you understand demand patterns.",
        followUpQuestions: ["How do I predict demand?", "What affects production capacity?"]
      },
      'general-strategy': {
        explanation: "Business strategy is your overall plan for success - how you'll compete, grow, and achieve your goals. It involves making smart decisions about production, pricing, innovation, and resource allocation.",
        example: "Amazon's strategy focuses on customer service and operational efficiency.",
        gameApplication: "Develop a clear plan for each game phase and adapt based on results.",
        tip: "Set specific goals each round and track your progress toward achieving them.",
        followUpQuestions: ["How do I set business goals?", "What makes a strategy successful?"]
      }
    };

    const response = fallbackResponses[concept] || fallbackResponses['general-strategy'];
    logger.info('📋 Using fallback tutoring response for:', concept);
    return response;
  }

  /**
   * Test the OpenAI connection and model availability
   */
  async testConnection() {
    if (!this.isEnabled) {
      return { success: false, message: 'OpenAI API key not configured' };
    }

    try {
      logger.info('🧪 Testing OpenAI connection...');
      
      const completion = await this.openai.chat.completions.create({
        model: this.currentModel,
        messages: [
          {
            role: "user",
            content: "Respond with exactly: 'Connection successful with [model_name]'"
          }
        ],
        max_tokens: 20
      });

      const response = completion.choices[0].message.content.trim();
      logger.info(`✅ OpenAI connection test successful: ${response}`);
      return { success: true, message: response, model: this.currentModel };

    } catch (error) {
      logger.error(`❌ OpenAI connection test failed with ${this.currentModel}:`, error.message);
      
      // If GPT-4 test fails, try GPT-3.5-turbo
      if (this.currentModel === this.preferredModel) {
        logger.info('🔄 Testing fallback model...');
        this.currentModel = this.fallbackModel;
        return this.testConnection();
      }
      
      return { success: false, message: error.message, model: this.currentModel };
    }
  }

  /**
   * Check if AI service is enabled and working
   */
  isAvailable() {
    return this.isEnabled;
  }

  /**
   * Get AI service status
   */
  getStatus() {
    return {
      enabled: this.isEnabled,
      currentModel: this.currentModel,
      preferredModel: this.preferredModel,
      fallbackModel: this.fallbackModel,
      apiKeyConfigured: !!process.env.OPENAI_API_KEY
    };
  }

  /**
   * Force switch to fallback model
   */
  useFallbackModel() {
    this.currentModel = this.fallbackModel;
    logger.info(`🔄 Switched to fallback model: ${this.currentModel}`);
  }

  /**
   * Reset to preferred model
   */
  resetToPreferredModel() {
    this.currentModel = this.preferredModel;
    logger.info(`🔄 Reset to preferred model: ${this.currentModel}`);
  }
}

module.exports = AIService;