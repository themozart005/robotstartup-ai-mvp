// backend/src/services/AIService.js
// ENHANCED VERSION - With phase-specific tutoring and actionable advice
// Updated to latest OpenAI models (2025) — gpt-4.1 primary, gpt-4.1-mini fallback

const OpenAI = require('openai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    // Check if API key is configured FIRST
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not configured. AI features will be disabled.');
      this.isEnabled = false;
      this.openai = null;
      this.preferredModel = 'gpt-4.1';
      this.fallbackModel = 'gpt-4.1-mini';
      this.currentModel = this.preferredModel;
      return;
    }

    // Only create OpenAI client if API key exists
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // ─── Model selection ──────────────────────────────────────────────────────
    // gpt-4.1        — April 2025 release, June 2024 knowledge cutoff
    //                  Best instruction following, 1M context window, $2/$8 per 1M tokens
    //                  Ideal for structured game tutoring and business concept explanations
    //
    // gpt-4.1-mini   — Same knowledge cutoff, much cheaper at $0.40/$1.60 per 1M tokens
    //                  Fast and capable for high-volume tutoring fallback
    this.preferredModel = 'gpt-4.1';
    this.fallbackModel  = 'gpt-4.1-mini';

    this.currentModel = this.preferredModel;

    this.isEnabled = true;
    logger.info(`✅ AI Service initialized with OpenAI (preferred model: ${this.preferredModel})`);

    // Test connection on startup
    this.testConnection();
  }

  /**
   * Get information about available models
   * Updated April 2025 — reflects current OpenAI model lineup
   */
  getModelInfo() {
    const modelInfo = {

      // ── Current / Recommended ─────────────────────────────────────────────
      'gpt-4.1': {
        name: 'GPT-4.1',
        context: 1000000,
        knowledge_cutoff: 'June 2024',
        strengths: 'Best instruction following, 1M token context, cheaper than gpt-4o',
        cost_per_1M_tokens: { input: '$2.00', output: '$8.00' },
        speed: 'Fast',
        best_for: 'Game AI tutoring, structured business advice, phase-specific responses'
      },
      'gpt-4.1-mini': {
        name: 'GPT-4.1 Mini',
        context: 1000000,
        knowledge_cutoff: 'June 2024',
        strengths: 'Very cheap, fast, same knowledge cutoff as gpt-4.1',
        cost_per_1M_tokens: { input: '$0.40', output: '$1.60' },
        speed: 'Very Fast',
        best_for: 'High volume tutoring requests, market events, cost-sensitive tasks'
      },
      'gpt-4.1-nano': {
        name: 'GPT-4.1 Nano',
        context: 1000000,
        knowledge_cutoff: 'June 2024',
        strengths: 'Cheapest option, ultra-fast, simple tasks',
        cost_per_1M_tokens: { input: '$0.10', output: '$0.40' },
        speed: 'Ultra Fast',
        best_for: 'Simple lookups, high-frequency low-complexity tasks'
      },

      // ── Previous generation (kept for fallback reference) ─────────────────
      'gpt-4o': {
        name: 'GPT-4o (prev gen)',
        context: 128000,
        knowledge_cutoff: 'October 2023',
        strengths: 'Proven reliability, multimodal',
        cost_per_1M_tokens: { input: '$5.00', output: '$15.00' },
        speed: 'Fast',
        best_for: 'Legacy fallback only — gpt-4.1 is better and cheaper'
      },
      'gpt-4o-mini': {
        name: 'GPT-4o Mini (prev gen)',
        context: 128000,
        knowledge_cutoff: 'October 2023',
        strengths: 'Cheap and fast',
        cost_per_1M_tokens: { input: '$0.15', output: '$0.60' },
        speed: 'Very Fast',
        best_for: 'Legacy fallback only — gpt-4.1-mini has newer knowledge at similar cost'
      },

      // ── Frontier (available but high cost for this use case) ─────────────
      'gpt-4.5': {
        name: 'GPT-4.5',
        context: 128000,
        knowledge_cutoff: 'June 2024',
        strengths: 'Strongest reasoning, best EQ, lowest hallucination rate',
        cost_per_1M_tokens: { input: '$75.00', output: '$150.00' },
        speed: 'Moderate',
        best_for: 'Complex multi-step reasoning — overkill for game tutoring'
      }
    };

    return modelInfo[this.currentModel] || { name: this.currentModel };
  }

  /**
   * Make AI request with automatic fallback
   */
  async makeAIRequest(messages, options = {}) {
    if (!this.isEnabled || !this.openai) {
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
      // Handle model not available — fall back automatically
      if ((error.status === 404 || error.code === 'model_not_found') &&
          this.currentModel !== this.fallbackModel) {
        logger.warn(`${this.currentModel} not available, falling back to ${this.fallbackModel}`);
        this.currentModel = this.fallbackModel;

        try {
          const completion = await this.openai.chat.completions.create({
            model: this.currentModel,
            messages: messages,
            ...defaultOptions
          });

          return completion.choices[0].message.content.trim();

        } catch (fallbackError) {
          logger.error(`Both models failed. Primary: ${error.message}, Fallback: ${fallbackError.message}`);
          throw fallbackError;
        }
      } else {
        logger.error(`AI request failed with ${this.currentModel}:`, error.message);
        throw error;
      }
    }
  }

  /**
   * Generate personalized tutoring response with phase-specific context
   */
  async generateTutoringResponse(concept, context) {
    if (!this.isEnabled || !this.openai) {
      return this.getPhaseSpecificFallback(concept, context);
    }

    try {
      const hasSpecificContext = context.specificContext && Object.keys(context.specificContext).length > 0;
      const phase = context.currentPhase || 'general';

      let prompt = '';

      if (hasSpecificContext) {
        prompt = this.buildPhaseSpecificPrompt(phase, concept, context);
      } else {
        prompt = this.buildGeneralPrompt(concept, context);
      }

      const messages = [
        {
          role: "system",
          content: "You are a patient, encouraging AI tutor for a business simulation game. Provide specific, actionable advice using real numbers from the game. Be direct and practical."
        },
        {
          role: "user",
          content: prompt
        }
      ];

      const explanation = await this.makeAIRequest(messages, {
        max_tokens: 400,
        temperature: 0.6
      });

      if (hasSpecificContext) {
        return this.buildPhaseSpecificResponse(phase, concept, context, explanation);
      } else {
        return {
          explanation: explanation,
          example: this.getRelevantExample(concept),
          gameApplication: this.getPhaseSpecificApplication(phase, context),
          tip: this.getPhaseSpecificTip(phase, concept, context),
          followUpQuestions: this.getFollowUpQuestions(concept)
        };
      }

    } catch (error) {
      logger.error('Error generating tutoring response:', error.message);
      return this.getPhaseSpecificFallback(concept, context);
    }
  }

  /**
   * Build phase-specific prompt for AI
   */
  buildPhaseSpecificPrompt(phase, concept, context) {
    const specific = context.specificContext || {};

    const phasePrompts = {
      'production': `The student is in the PRODUCTION PHASE and needs immediate help deciding how many robots to build.

Current situation:
- Cash available: $${context.playerCash}
- Production capacity: ${specific.productionCapacity || 10} robots max
- Already built this round: ${specific.robotsBuiltThisRound || 0}
- Can afford to build: ${specific.canAffordQuantity || 0} basic robots at $110,000 each
- Round: ${context.round}

Provide SPECIFIC advice:
1. Exactly how many robots should they build? (give a number)
2. Which type of robot is best? (Service robots are cheapest at $110k)
3. How much cash will they have left?
4. Why this is the optimal choice

Be very specific with numbers. Don't give ranges, give exact recommendations.`,

      'r&d': `The student is in the R&D PHASE deciding which technology to research.

Current situation:
- Cash available: $${context.playerCash}
- Technologies they can afford: ${(specific.affordableTech || []).map(t => `${t.name} ($${t.cost})`).join(', ') || 'None'}
- Technologies already owned: ${(context.techCount || 0) > 0 ? context.techCount + ' technologies' : 'None'}
- Round: ${context.round}

Provide SPECIFIC advice:
1. Which exact technology should they buy? (name it)
2. If they can't afford any, should they skip?
3. How will this technology help them?
4. Cash remaining after purchase?`,

      'sales': `The student is in the SALES PHASE deciding whether to sell robots.

Current situation:
- Unsold robots: ${specific.unsoldRobots || 0}
- Robot types: ${(specific.robotTypes || []).join(', ') || 'None'}
- Market demand: ${specific.marketDemand || 'unknown'}
- Round: ${context.round}

Provide SPECIFIC advice:
1. Should they sell all robots or hold some? (give exact number)
2. What's the market timing consideration?
3. Expected revenue from selling?
4. Impact on next round?`,

      'funding': `The student is in the FUNDING PHASE choosing how to raise capital.

Current situation:
- Current equity ownership: ${specific.currentEquity || context.equity || 100}%
- Cash available: $${context.playerCash}
- Round: ${context.round}

Provide SPECIFIC advice:
1. Should they take equity or debt funding?
2. How much equity can they safely give up?
3. What amount should they raise?
4. Impact on control (staying above 51%)?`,

      'growth': `The student is in the GROWTH PHASE deciding on marketing investment.

Current situation:
- Cash available: $${context.playerCash}
- Current reputation: ${specific.reputation || context.reputation || 50}/100
- Round: ${context.round}

Provide SPECIFIC advice:
1. How much should they invest? (give exact amount or percentage)
2. Should they skip to preserve cash?
3. Expected ROI from the investment?
4. Cash remaining after investment?`
    };

    const basePrompt = phasePrompts[phase.toLowerCase()] || phasePrompts['production'];

    return basePrompt + `\n\nConcept to explain: ${concept}
Make the explanation relevant to their immediate decision. Use their actual numbers.`;
  }

  /**
   * Build general concept prompt
   */
  buildGeneralPrompt(concept, context) {
    return `You are an AI business tutor helping a student (age 12-18) understand business concepts through a robotics company simulation game.

Student needs help with: ${concept}

Current game context:
- Game phase: ${context.currentPhase || 'startup'}
- Student's cash: $${context.playerCash || 500000}
- Current round: ${context.round || 1}
- Robot count: ${context.robotCount || 0}
- Technologies owned: ${context.techCount || 0}
- Current equity: ${context.equity || 100}%

Provide a helpful, encouraging explanation that:
1. Explains the concept in simple, clear terms
2. Gives a relatable real-world example
3. Shows how it applies to their current game situation
4. Offers a practical, actionable tip
5. Encourages continued learning

Use encouraging, positive language. Be specific about their current situation. Keep explanations concise but complete.`;
  }

  /**
   * Build phase-specific response structure
   */
  buildPhaseSpecificResponse(phase, concept, context, aiExplanation) {
    const immediateHelp  = this.generateImmediateHelp(phase, context);
    const recommendation = this.generateRecommendation(phase, context);
    const calculation    = this.generateCalculation(phase, context);

    return {
      explanation:       aiExplanation,
      immediateHelp:     immediateHelp,
      recommendation:    recommendation,
      calculation:       calculation,
      example:           this.getRelevantExample(concept),
      gameApplication:   this.getPhaseSpecificApplication(phase, context),
      tip:               this.getPhaseSpecificTip(phase, concept, context),
      followUpQuestions: this.getFollowUpQuestions(concept),
      phaseSpecificTips: this.getPhaseSpecificTips(phase, context)
    };
  }

  /**
   * Generate immediate help based on phase
   */
  generateImmediateHelp(phase, context) {
    const specific = context.specificContext || {};

    const helpText = {
      'production': `You can afford to build ${specific.canAffordQuantity || 0} basic robots. You've used ${specific.robotsBuiltThisRound || 0} of ${specific.productionCapacity || 10} capacity.`,
      'r&d':        `You have $${context.playerCash} for technology. ${specific.affordableTech?.length || 0} technologies are within budget.`,
      'sales':      `You have ${specific.unsoldRobots || 0} robots ready to sell. Market demand is ${specific.marketDemand || 'unknown'}.`,
      'funding':    `You currently own ${specific.currentEquity || context.equity || 100}% of your company.`,
      'growth':     `You have $${context.playerCash} available for growth investments.`
    };

    return helpText[phase.toLowerCase()] || `You're in ${phase} phase with $${context.playerCash} available.`;
  }

  /**
   * Generate specific recommendation
   */
  generateRecommendation(phase, context) {
    const specific = context.specificContext || {};

    const recommendations = {
      'production': specific.canAffordQuantity > 5
        ? `Build 3-5 Service robots to maintain cash reserves`
        : specific.canAffordQuantity > 0
        ? `Build ${Math.min(2, specific.canAffordQuantity)} robots to test the market`
        : `Skip production this round - save cash for next round`,

      'r&d': specific.affordableTech?.length > 0
        ? `Invest in ${specific.affordableTech[0]?.name || 'the most affordable technology'}`
        : `Skip R&D this round - save cash for production`,

      'sales': specific.unsoldRobots > 3
        ? `Sell ${Math.floor(specific.unsoldRobots * 0.7)} robots now, hold ${Math.ceil(specific.unsoldRobots * 0.3)} for next round`
        : `Sell all ${specific.unsoldRobots || 0} robots to maximize cash`,

      'funding': (specific.currentEquity || 100) > 70
        ? `Consider equity funding - you have room to give up shares`
        : `Use debt financing to protect your ownership percentage`,

      'growth': context.playerCash > 200000
        ? `Invest $${Math.floor(context.playerCash * 0.25)} (25%) in marketing`
        : `Skip growth this round - preserve cash for production`
    };

    return recommendations[phase.toLowerCase()] || `Focus on your core business objectives this round.`;
  }

  /**
   * Generate calculation breakdown
   */
  generateCalculation(phase, context) {
    const specific = context.specificContext || {};

    const calculations = {
      'production': specific.canAffordQuantity > 0
        ? `${specific.canAffordQuantity} robots × $110,000 = $${(specific.canAffordQuantity * 110000).toLocaleString()} cost | Remaining: $${(context.playerCash - (Math.min(3, specific.canAffordQuantity) * 110000)).toLocaleString()}`
        : `Cash $${context.playerCash} ÷ $110,000 per robot = ${Math.floor(context.playerCash / 110000)} affordable`,

      'r&d': specific.affordableTech?.[0]
        ? `${specific.affordableTech[0].name}: $${specific.affordableTech[0].cost} | Remaining cash: $${(context.playerCash - specific.affordableTech[0].cost).toLocaleString()}`
        : `Available budget: $${context.playerCash}`,

      'sales': `${specific.unsoldRobots || 0} robots × estimated market price = potential revenue`,

      'funding': `Current equity: ${specific.currentEquity || 100}% | Safe to give up: ${Math.max(0, (specific.currentEquity || 100) - 51)}% more`,

      'growth': `$${context.playerCash} × 25% = $${Math.floor(context.playerCash * 0.25).toLocaleString()} recommended investment`
    };

    return calculations[phase.toLowerCase()] || `Available capital: $${context.playerCash}`;
  }

  /**
   * Get relevant real-world example for concept
   */
  getRelevantExample(concept) {
    const examples = {
      'cash-flow-management': "Amazon operated at a loss for years but managed cash flow perfectly, reinvesting every dollar into growth.",
      'innovation-strategy':  "Tesla invested heavily in battery R&D early, which now gives them a competitive advantage competitors can't easily match.",
      'production-planning':  "Toyota's Just-In-Time production system minimizes inventory costs while meeting demand precisely.",
      'pricing-strategy':     "Apple prices iPhones at a premium ($999+) because their brand and features justify the cost to customers.",
      'market-analysis':      "Netflix analyzed viewing data to predict that House of Cards would succeed before producing it.",
      'risk-management':      "SpaceX tests rockets extensively and accepts some failures as part of rapid innovation.",
      'venture-capital-vs-debt': "Uber used venture capital to grow fast without debt, while FedEx used loans to buy their first planes.",
      'equity-dilution':      "Mark Zuckerberg kept control of Facebook by maintaining over 50% voting power through multiple funding rounds.",
      'debt-financing':       "Airlines regularly use loans to purchase planes, paying them back with ticket revenue over many years.",
      'funding-strategy':     "SpaceX combined venture capital with NASA government contracts to fund development at different stages.",
      'financial-planning':   "Microsoft keeps $100B+ in cash reserves to weather economic downturns and fund acquisitions.",
      'strategic-planning':   "Amazon's long-term strategy was always to become the 'everything store', starting with just books.",
      'sales-strategy':       "Apple creates scarcity by controlling inventory carefully, which maintains premium pricing.",
      'growth-strategy':      "Airbnb invested heavily in marketing early to build brand recognition before competitors could react.",
      'general-strategy':     "Google's strategy focuses on organizing the world's information, which drives every product decision."
    };

    return examples[concept] || examples['general-strategy'];
  }

  /**
   * Get phase-specific game application advice
   */
  getPhaseSpecificApplication(phase, context) {
    const applications = {
      'production': `In production, balance building enough robots to meet demand without depleting cash reserves needed for future rounds.`,
      'r&d':        `R&D investments compound over time — technologies you buy now benefit every future production round.`,
      'sales':      `Timing your sales strategically based on market demand can significantly increase your revenue per robot.`,
      'funding':    `Every equity point you give up now reduces your control. Plan funding needs 2-3 rounds ahead.`,
      'growth':     `Brand reputation built through marketing creates compounding returns as customers prefer known companies.`
    };

    return applications[phase.toLowerCase()] || `Focus on sustainable growth while maintaining financial stability.`;
  }

  /**
   * Get phase and concept specific tip
   */
  getPhaseSpecificTip(phase, concept, context) {
    const tips = {
      'cash-flow-management':    "Always keep 20-30% of your cash as a reserve — unexpected opportunities and emergencies require liquidity.",
      'innovation-strategy':     "R&D investments in early rounds pay dividends in later rounds — don't skip research entirely.",
      'production-planning':     "Start conservative — build fewer robots until you understand demand patterns in your market.",
      'pricing-strategy':        "Higher quality robots from R&D investments command premium prices — invest early.",
      'market-analysis':         "Watch for market event announcements — they signal when to increase or decrease production.",
      'risk-management':         "Diversify your robot types to reduce exposure to any single market segment downturn.",
      'venture-capital-vs-debt': "Choose equity if you need guidance and connections, debt if you want to keep control.",
      'equity-dilution':         "Never give up more than 49% total equity to maintain control of your company.",
      'debt-financing':          "Only take loans if you can afford the payments from your expected revenue.",
      'funding-strategy':        "Raise money when you're in a position of strength, not when you're desperate.",
      'financial-planning':      "Plan your cash needs 2-3 rounds ahead to avoid emergency funding at bad terms.",
      'strategic-planning':      "Write down your 3-round plan at the start and adjust it as market conditions change.",
      'sales-strategy':          "Sometimes holding inventory for better market conditions pays off — patience has value.",
      'growth-strategy':         "Invest 20-30% of cash in marketing when you have sufficient reserves above $200k.",
      'general-strategy':        "Set specific goals each round and track your progress toward achieving them."
    };

    return tips[concept] || tips['general-strategy'];
  }

  /**
   * Get phase-specific tips array
   */
  getPhaseSpecificTips(phase, context) {
    const phaseTips = {
      'production': [
        "Build 3-5 robots for a balanced approach",
        "Keep at least $200k cash after production",
        "Service robots at $110k are the most cost-effective"
      ],
      'r&d': [
        "Automation tech pays off in 2+ future rounds",
        "Don't skip R&D entirely in early rounds",
        "Balance tech investment with production budget"
      ],
      'sales': [
        "Sell when market demand is high or medium",
        "Consider holding some inventory if demand is low",
        "Watch competitor inventory levels"
      ],
      'funding': [
        "Stay above 51% equity to keep control",
        "Debt is cheaper if you can afford payments",
        "Raise more than you think you need"
      ],
      'growth': [
        "Marketing builds reputation that compounds",
        "25% of cash is a good marketing investment",
        "Skip growth if cash drops below $150k"
      ]
    };

    return phaseTips[phase.toLowerCase()] || phaseTips['production'];
  }

  /**
   * Get relevant follow-up questions
   */
  getFollowUpQuestions(concept) {
    const questions = {
      'cash-flow-management':    ["How do loans affect cash flow?", "What's the difference between profit and cash flow?"],
      'innovation-strategy':     ["How do I choose which technologies to research?", "When should I focus on innovation vs. production?"],
      'production-planning':     ["How do I predict customer demand?", "What affects production capacity?"],
      'pricing-strategy':        ["How do competitors affect my pricing?", "What's the relationship between price and demand?"],
      'market-analysis':         ["What economic factors affect robotics demand?", "How do I identify market trends?"],
      'risk-management':         ["What are the biggest risks in the robotics industry?", "How do I balance risk and reward?"],
      'venture-capital-vs-debt': ["When is venture capital better than loans?", "What are the long-term effects of each funding type?"],
      'equity-dilution':         ["How much equity should founders keep?", "What happens if I lose majority control?"],
      'debt-financing':          ["How do interest rates affect my business?", "When is debt dangerous for a startup?"],
      'funding-strategy':        ["How do I know when to raise money?", "What's the best funding mix for growth?"],
      'financial-planning':      ["How far ahead should I plan financially?", "What are the warning signs of cash problems?"],
      'strategic-planning':      ["How do I adapt my strategy to market changes?", "What makes a business plan successful?"],
      'sales-strategy':          ["When should I sell vs hold inventory?", "How do I maximize revenue per robot?"],
      'growth-strategy':         ["How much should I invest in marketing?", "When should I skip growth investments?"],
      'general-strategy':        ["How do I develop a long-term business plan?", "What makes a strategy successful?"]
    };

    return questions[concept] || questions['general-strategy'];
  }

  /**
   * Generate dynamic market events using AI
   */
  async generateMarketEvent(context) {
    if (!this.isEnabled || !this.openai) {
      return this.getFallbackMarketEvent();
    }

    try {
      const prompt = `Generate a realistic market event for a robotics startup simulation game.

Context:
- Current Round: ${context.currentRound}
- Industry: ${context.industry}
- Current Market Demand: ${context.currentConditions.demand}
- Current Volatility: ${context.currentConditions.volatility}
- Active Trends: ${context.currentConditions.trends.join(', ')}
- Recent Player Activity: ${JSON.stringify(context.playerActions)}

Generate a market event that could realistically affect robot demand, pricing, or business conditions.

Respond with a JSON object containing:
- title: Short event headline (max 50 characters)
- description: Educational explanation (max 150 characters)
- demandChange: true/false if demand should change
- newDemand: "low"/"medium"/"high" (only if demandChange is true)
- volatilityChange: number between -0.3 and +0.3
- newTrends: array of trend strings (optional)
- impact: object describing effects on different robot types
- eventModifiers: array of temporary effects

Example events: supply chain disruptions, new tech breakthroughs, economic changes, regulatory updates, competitor actions, customer behavior shifts.

Keep it realistic and educational for business students.`;

      const messages = [
        {
          role: 'system',
          content: 'You are a business simulation AI that generates realistic market events for educational games. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.makeAIRequest(messages, {
        max_tokens: 800,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      try {
        const marketEvent = JSON.parse(response);

        if (!marketEvent.title || !marketEvent.description) {
          throw new Error('Invalid AI response format');
        }

        logger.info(`🤖 AI (${this.currentModel}) generated market event: ${marketEvent.title}`);
        return marketEvent;

      } catch (parseError) {
        logger.error('Failed to parse AI market event response:', parseError.message);
        return this.getFallbackMarketEvent();
      }

    } catch (error) {
      logger.error('Error generating AI market event:', error.message);
      return this.getFallbackMarketEvent();
    }
  }

  /**
   * Fallback market event when AI is unavailable
   */
  getFallbackMarketEvent() {
    const fallbackEvents = [
      {
        title: "Venture Capital Interest",
        description: "Robotics startups attracting investor attention. Good time to show growth!",
        impact: "positive", significance: "medium",
        educationalTip: "Strong performance attracts better funding terms"
      },
      {
        title: "Industry Conference",
        description: "Robotics experts share latest innovations. Great time for R&D investments.",
        impact: "positive", significance: "medium",
        educationalTip: "Industry events often signal good investment opportunities"
      },
      {
        title: "Supply Chain Adjustment",
        description: "Component costs fluctuate due to global supply changes. Plan production carefully.",
        impact: "neutral", significance: "medium",
        educationalTip: "Supply chain management affects all manufacturing businesses"
      },
      {
        title: "Customer Demand Shift",
        description: "Market preferences evolving toward smarter, more efficient robots.",
        impact: "neutral", significance: "high",
        educationalTip: "Successful companies adapt to changing customer preferences"
      },
      {
        title: "New Funding Opportunities",
        description: "Investors looking for promising robotics startups. Polish your pitch!",
        impact: "positive", significance: "low",
        educationalTip: "Access to capital helps companies grow and innovate"
      },
      {
        title: "Competitive Landscape",
        description: "New competitor enters market with innovative approach. Stay competitive!",
        impact: "negative", significance: "medium",
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
      'venture-capital-vs-debt': {
        explanation: "Venture capital means selling part of your company (equity) to investors for money. Debt means borrowing money that you must pay back with interest. Venture capital dilutes your ownership but provides expertise and connections. Debt keeps you in control but requires regular payments.",
        example: "Uber used venture capital to grow fast without debt, while FedEx used loans to buy trucks.",
        gameApplication: "Choose equity if you need lots of money and guidance, debt if you want to keep control.",
        tip: "Never give up more than 49% total equity to maintain control of your company.",
        followUpQuestions: ["When is venture capital better?", "How do I know if I can afford a loan?"]
      },
      'equity-dilution': {
        explanation: "Equity dilution happens when you sell shares of your company to raise money. If you own 100% and sell 20%, you now own 80%. The more equity you sell, the less control you have over your company's decisions.",
        example: "Mark Zuckerberg kept control of Facebook by maintaining over 50% voting power.",
        gameApplication: "Each funding round reduces your ownership percentage - plan carefully!",
        tip: "Keep at least 51% equity to maintain control of major decisions.",
        followUpQuestions: ["What happens if I lose majority control?", "How do founders stay in control?"]
      },
      'debt-financing': {
        explanation: "Debt financing means borrowing money that you must repay with interest. It's like taking a loan to buy a car - you get money now but must make regular payments. Unlike equity, you keep full ownership but have the obligation to repay.",
        example: "Airlines often use loans to buy planes, paying them back with passenger revenue.",
        gameApplication: "Loans give you cash without diluting equity, but you must afford the payments.",
        tip: "Only borrow what you can repay from your expected revenue.",
        followUpQuestions: ["How much debt is too much?", "What if I can't make payments?"]
      },
      'funding-strategy': {
        explanation: "Funding strategy is your plan for raising money to grow your business. Smart founders mix different funding sources - some equity for big growth, some debt for specific assets, and reinvesting profits for organic growth.",
        example: "SpaceX combined venture capital with government contracts to fund development.",
        gameApplication: "Plan your funding needs 2-3 rounds ahead to avoid desperate decisions.",
        tip: "Raise money when you're strong, not when you're desperate.",
        followUpQuestions: ["When should I raise money?", "How do I attract investors?"]
      },
      'financial-planning': {
        explanation: "Financial planning means looking ahead at your cash needs and making sure you'll have enough money for future rounds. It's like budgeting for a trip - you plan for gas, food, and emergencies before you leave.",
        example: "Microsoft keeps billions in cash reserves to weather any economic storm.",
        gameApplication: "Calculate how much cash you'll need for next 2-3 rounds of R&D and production.",
        tip: "Plan your cash needs 2-3 rounds ahead to avoid emergency funding.",
        followUpQuestions: ["How do I forecast future cash needs?", "What's a good cash reserve amount?"]
      },
      'strategic-planning': {
        explanation: "Strategic planning is creating a roadmap for your business success. It means setting goals, choosing focus areas, and planning how to beat competitors. Good strategy adapts to changing conditions while keeping long-term goals in mind.",
        example: "Amazon's strategy was always to become the 'everything store', starting with books.",
        gameApplication: "Create a 3-round plan: what to research, produce, and how to fund growth.",
        tip: "Write down your strategy and adjust it based on market conditions.",
        followUpQuestions: ["How often should I change my strategy?", "What makes a strategy successful?"]
      },
      'sales-strategy': {
        explanation: "Sales strategy is your plan for converting products into revenue. It includes timing (when to sell), pricing (how much to charge), and inventory management (what to keep vs sell). Smart sales maximize profit, not just revenue.",
        example: "Apple creates scarcity by controlling inventory, which keeps prices high.",
        gameApplication: "Decide whether to sell all robots now or save some for better market conditions.",
        tip: "Sometimes holding inventory for better market conditions pays off.",
        followUpQuestions: ["How do I know the right time to sell?", "Should I always sell everything?"]
      },
      'growth-strategy': {
        explanation: "Growth strategy focuses on scaling your business through marketing, partnerships, and market expansion. It's about building brand awareness, reputation, and customer loyalty to support long-term success.",
        example: "Airbnb invested heavily in marketing early to build brand recognition before competitors emerged.",
        gameApplication: "Invest 20-30% of cash in marketing when you have sufficient reserves.",
        tip: "Small, consistent growth investments beat sporadic large investments.",
        followUpQuestions: ["How much should I invest in growth?", "When should I skip growth investments?"]
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
   * Get phase-specific fallback (alias for backwards compatibility)
   */
  getPhaseSpecificFallback(concept, context) {
    return this.getFallbackTutoringResponse(concept);
  }

  /**
   * Test the OpenAI connection and model availability
   */
  async testConnection() {
    if (!this.isEnabled || !this.openai) {
      return { success: false, message: 'OpenAI API key not configured' };
    }

    try {
      logger.info(`🧪 Testing OpenAI connection with ${this.currentModel}...`);

      const completion = await this.openai.chat.completions.create({
        model: this.currentModel,
        messages: [{ role: "user", content: "Respond with exactly: 'Connection successful'" }],
        max_tokens: 20
      });

      const response  = completion.choices[0].message.content.trim();
      const modelInfo = this.getModelInfo();
      logger.info(`✅ OpenAI connection test successful: ${response} with ${modelInfo.name}`);

      return {
        success:   true,
        message:   response,
        model:     this.currentModel,
        modelInfo: modelInfo
      };

    } catch (error) {
      logger.error(`❌ OpenAI connection test failed with ${this.currentModel}:`, error.message);

      if (this.currentModel === this.preferredModel && this.preferredModel !== this.fallbackModel) {
        logger.info('🔄 Testing fallback model...');
        this.currentModel = this.fallbackModel;
        return this.testConnection();
      }

      return {
        success:    false,
        message:    error.message,
        model:      this.currentModel,
        suggestion: 'Check your OPENAI_API_KEY environment variable in Railway'
      };
    }
  }

  /**
   * Check if AI service is enabled and working
   */
  isAvailable() {
    return this.isEnabled && this.openai !== null;
  }

  /**
   * Get AI service status
   */
  getStatus() {
    const modelInfo = this.getModelInfo();
    return {
      enabled:              this.isEnabled,
      clientInitialized:    this.openai !== null,
      currentModel:         this.currentModel,
      currentModelInfo:     modelInfo,
      preferredModel:       this.preferredModel,
      fallbackModel:        this.fallbackModel,
      apiKeyConfigured:     !!process.env.OPENAI_API_KEY,
      estimatedCostPer1000Requests:
        this.currentModel === 'gpt-4.1'      ? '$2-8'    :
        this.currentModel === 'gpt-4.1-mini' ? '$0.40-1.60' :
        this.currentModel === 'gpt-4.1-nano' ? '$0.10-0.40' :
        '$1-5'
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