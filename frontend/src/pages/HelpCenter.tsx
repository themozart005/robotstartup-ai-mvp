// frontend/src/pages/HelpCenter.tsx
// Updated with correct game phases and email contact

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  BookOpen, 
  Video, 
  FileText,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Play,
  Brain,
  Target,
  Lightbulb,
  Users,
  DollarSign,
  Cog,
  Factory,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Sparkles,
  Mail
} from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  content: string[];
  tips?: string[];
  example?: string;
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of playing RoboStartup AI',
    category: 'Basics',
    icon: Play,
    content: [
      'Welcome to RoboStartup AI! You\'re the CEO of a robotics startup, starting with $500,000.',
      'Your goal: Build a successful robotics company by making smart business decisions.',
      'Each game has 5 rounds, representing years of your company\'s growth.',
      'Each round has 5 phases where you make different business decisions.',
      'Win by reaching $7 million in total value or having the highest net worth when the game ends.'
    ],
    tips: [
      'Start small and learn from each decision',
      'Watch your cash - running out means game over!',
      'Balance risk and reward in your strategies'
    ],
    example: 'Example: In Round 1, you might build 2 simple robots for $200,000, sell them for $360,000, making a $160,000 profit!'
  },
  {
    id: 'game-phases',
    title: 'Understanding Game Phases',
    description: 'Learn what happens in each phase of the game',
    category: 'Gameplay',
    icon: Target,
    content: [
      'ROUND 1 - PROVING YOUR CONCEPT:',
      '• Bootstrap Phase: Collect $50,000 from friends & family (automatic)',
      '• R&D Phase: Research technologies to improve your robots',
      '• Production Phase: Build your first robots (limited capacity)',
      '• Sales Phase: Sell robots to early customers',
      '• Growth Phase: Invest in marketing and business development',
      '',
      'ROUNDS 2-5 - SCALING YOUR BUSINESS:',
      '• Funding Phase: Choose how to finance growth (venture capital or loans)',
      '• R&D Phase: Continue innovating with new technologies',
      '• Production Phase: Scale up manufacturing (increased capacity)',
      '• Sales Phase: Sell to growing customer base',
      '• Growth Phase: Expand market reach and operations'
    ],
    tips: [
      'Round 1 is about proving your idea works',
      'Later rounds focus on scaling and growth',
      'Each phase affects the next - plan ahead!'
    ],
    example: 'Example: In Round 2, you might take $250,000 in VC funding (giving up 20% equity) to build 10 robots instead of just 3!'
  },
  {
    id: 'bootstrap-funding',
    title: 'Bootstrap & Funding Phases',
    description: 'Understanding how to finance your startup',
    category: 'Finance',
    icon: DollarSign,
    content: [
      'BOOTSTRAP (Round 1 Only):',
      'You automatically receive $50,000 from "friends and family".',
      'This represents initial seed money to prove your concept.',
      'No equity given up, no debt incurred - it\'s a gift to get started!',
      '',
      'FUNDING (Rounds 2-5):',
      'VENTURE CAPITAL: Get large amounts of cash by selling company ownership',
      '• Pros: Big money, no monthly payments',
      '• Cons: You give up equity (ownership) in your company',
      '',
      'BUSINESS LOANS: Borrow money that must be repaid with interest',
      '• Pros: Keep full ownership of your company',
      '• Cons: Monthly payments reduce cash flow',
      '',
      'SKIP FUNDING: Continue with just your profits',
      '• Pros: No dilution, no debt',
      '• Cons: Limited growth potential'
    ],
    tips: [
      'VC funding is great when you need to scale fast',
      'Loans work well if you have steady revenue',
      'Don\'t give up too much equity early!'
    ],
    example: 'Example: Taking $500,000 from VCs for 30% equity means you now own 70% of your company, but have cash to grow 10x faster!'
  },
  {
    id: 'financial-literacy',
    title: 'Financial Concepts Explained',
    description: 'Simple explanations of business finance',
    category: 'Education',
    icon: DollarSign,
    content: [
      'CASH: Money you have right now to spend',
      'Think of it like your wallet - it\'s what you use to buy things.',
      '',
      'REVENUE: Money coming IN from selling robots',
      'If you sell a robot for $180,000, that\'s revenue.',
      '',
      'PROFIT: Revenue minus costs (what you actually keep)',
      'Sell robot for $180,000, cost was $100,000 = $80,000 profit!',
      '',
      'EQUITY: How much of the company you own',
      'Start with 100%. Give VCs 20%, you now have 80%.',
      '',
      'NET WORTH: Everything you own minus everything you owe',
      'Assets ($1M in cash + robots) - Debts ($200k loan) = $800k net worth',
      '',
      'BURN RATE: How fast you\'re spending money',
      'Spending $100,000 per round? That\'s your burn rate.'
    ],
    tips: [
      'Profit matters more than revenue',
      'Watch your cash - it\'s your lifeline',
      'Higher net worth = winning position'
    ],
    example: 'Example: You have $500,000 cash, own robots worth $300,000, owe $100,000 in loans. Your net worth is $700,000!'
  },
  {
    id: 'robot-production',
    title: 'Robot Production Strategy',
    description: 'How to decide what robots to build',
    category: 'Strategy',
    icon: Factory,
    content: [
      'ROBOT TYPES & COSTS:',
      '• Service Robot: $100,000 (sells for ~$180,000)',
      '• Mobile Robot: $120,000 (sells for ~$220,000)',
      '• Industrial Robot: $150,000 (sells for ~$280,000)',
      '• Humanoid Robot: $200,000 (sells for ~$400,000)',
      '• Medical Robot: $250,000 (sells for ~$500,000)',
      '',
      'PRODUCTION CAPACITY:',
      'Round 1: Limited to 3-5 robots (proving concept)',
      'Round 2+: Capacity grows with funding and success',
      'More cash = ability to build more robots',
      'Technologies increase your capacity',
      '',
      'STRATEGIC CHOICES:',
      '• Few expensive robots = Higher profit margins',
      '• Many cheap robots = Market dominance',
      '• Mixed approach = Balanced risk'
    ],
    tips: [
      'Start with service robots to learn',
      'Match production to market demand',
      'Don\'t build more than you can afford!'
    ],
    example: 'Example: With $400,000 cash, you could build 4 service robots or 2 humanoid robots. Which strategy fits your plan?'
  },
  {
    id: 'rd-investment',
    title: 'Research & Development (R&D)',
    description: 'Investing in technology to improve your robots',
    category: 'Strategy',
    icon: Cog,
    content: [
      'WHY R&D MATTERS:',
      'Technologies make your robots better and more valuable.',
      'Better robots = higher selling prices and happier customers.',
      '',
      'TECHNOLOGY OPTIONS:',
      '• Basic Sensors ($50,000): +10% robot value',
      '• Standard Motors ($75,000): +12% efficiency',
      '• Simple AI ($100,000): +15% value',
      '• Advanced Arms ($120,000): +15% capability',
      '• AI Navigation ($150,000): +20% premium pricing',
      '',
      'SUCCESS RATES:',
      'Beginner Mode: 80% chance of success',
      'Advanced Mode: 60% chance of success',
      'Failed R&D still gives you experience!',
      '',
      'STRATEGIC TIMING:',
      'Early R&D = Benefits for more rounds',
      'Late R&D = Less time to recoup investment'
    ],
    tips: [
      'Invest in R&D when you have spare cash',
      'Multiple technologies stack for bigger benefits',
      'Failed R&D isn\'t wasted - you learn from it!'
    ],
    example: 'Example: Investing $100,000 in Simple AI might fail this round, but if it succeeds, all your robots sell for 15% more!'
  },
  {
    id: 'growth-investments',
    title: 'Growth Phase Strategies',
    description: 'How to expand your business reach',
    category: 'Strategy',
    icon: TrendingUp,
    content: [
      'ROUND 1 GROWTH OPTIONS:',
      '• Brand Awareness ($25,000): Build market recognition',
      '• Market Research ($15,000): Understand customers better',
      '• Partnerships ($30,000): Create distribution channels',
      '• Skip Growth ($0): Save cash for production',
      '',
      'ROUNDS 2-5 GROWTH OPTIONS:',
      '• Digital Marketing ($75,000): Massive online presence',
      '• Trade Shows ($50,000): Direct customer acquisition',
      '• Strategic Partnerships ($100,000): Major market expansion',
      '• Conservative Growth ($0): Focus on operations',
      '',
      'GROWTH EFFECTS:',
      'Reputation increases = customers trust you more',
      'Sales boost = robots sell faster and for more',
      'Market expansion = access to more customers'
    ],
    tips: [
      'Early brand building pays off long-term',
      'Match growth spending to your cash reserves',
      'Partnerships can be more valuable than ads'
    ],
    example: 'Example: Spending $25,000 on brand awareness in Round 1 might boost all future sales by 10%!'
  },
  {
    id: 'market-analysis',
    title: 'Reading Market Conditions',
    description: 'How to respond to market changes',
    category: 'Strategy',
    icon: Brain,
    content: [
      'MARKET DEMAND LEVELS:',
      'HIGH DEMAND (Green): Customers want lots of robots!',
      '• Build more robots',
      '• Prices are 30% higher',
      '• Great time to maximize production',
      '',
      'MEDIUM DEMAND (Yellow): Steady, normal market',
      '• Build moderate amounts',
      '• Normal pricing',
      '• Balance production and R&D',
      '',
      'LOW DEMAND (Red): Customers aren\'t buying much',
      '• Build fewer robots',
      '• Prices are 30% lower',
      '• Focus on R&D and efficiency',
      '',
      'MARKET VOLATILITY:',
      'Low (0.1-0.3): Predictable, stable conditions',
      'Medium (0.4-0.6): Some surprises possible',
      'High (0.7-1.0): Expect rapid changes!'
    ],
    tips: [
      'Produce heavily in high demand',
      'Use low demand for R&D investment',
      'High volatility = keep cash reserves'
    ],
    example: 'Example: High demand with low volatility? Build maximum robots! Low demand with high volatility? Save cash and invest in R&D.'
  },
  {
    id: 'winning-strategies',
    title: 'How to Win',
    description: 'Proven strategies for success',
    category: 'Strategy',
    icon: Trophy,
    content: [
      'EARLY GAME (Rounds 1-2):',
      '• Prove your concept with small batches',
      '• Invest in 1-2 key technologies',
      '• Build cash reserves',
      '• Establish brand presence',
      '',
      'MID GAME (Rounds 3-4):',
      '• Scale production significantly',
      '• Take funding to accelerate growth',
      '• Dominate a robot category',
      '• Expand market reach',
      '',
      'LATE GAME (Round 5):',
      '• Maximize robot production',
      '• Sell everything you build',
      '• Avoid unnecessary spending',
      '• Sprint to $7 million',
      '',
      'WINNING CONDITIONS:',
      '1. First to $7 million total value wins immediately',
      '2. Highest net worth at game end wins',
      '3. In ties, highest cash reserves wins'
    ],
    tips: [
      'Balance growth with stability',
      'Don\'t neglect any phase',
      'Adapt strategy based on competition'
    ],
    example: 'Example winning path: Round 1-2 build foundation → Round 3-4 scale aggressively → Round 5 maximize value!'
  },
  {
    id: 'multiplayer-tips',
    title: 'Multiplayer Competition',
    description: 'Competing against other players',
    category: 'Multiplayer',
    icon: Users,
    content: [
      'READING COMPETITORS:',
      'Watch what others build and sell',
      'Notice their funding choices',
      'Adapt your strategy accordingly',
      '',
      'COMPETITIVE STRATEGIES:',
      'DIFFERENTIATION: Build different robot types',
      'PRICE WAR: Undercut competitors with volume',
      'PREMIUM: Focus on high-end with better tech',
      'FIRST MOVER: Dominate a niche early',
      '',
      'AI OPPONENT PERSONALITIES:',
      '• Conservative: Safe, steady growth',
      '• Aggressive: High risk, high reward',
      '• Balanced: Mixed strategies',
      '• Innovative: Heavy R&D focus'
    ],
    tips: [
      'Don\'t copy failing strategies',
      'Find market gaps competitors miss',
      'Time big moves when others are weak'
    ],
    example: 'Example: If everyone builds service robots, pivot to medical robots for less competition and higher margins!'
  }
];

const FAQ_ITEMS = [
  {
    question: 'How long does a typical game last?',
    answer: 'A beginner game (5 rounds) takes about 20-30 minutes. It\'s designed to fit in a class period or lunch break!'
  },
  {
    question: 'What happens if I run out of money?',
    answer: 'You can take emergency loans in the funding phase, or sell robots at a discount. The game helps prevent total bankruptcy with warnings.'
  },
  {
    question: 'How many robots can I build per round?',
    answer: 'Round 1: 3-5 robots (proving concept). Round 2+: Capacity grows with your success, funding, and technologies. Rich companies can build 20+ robots!'
  },
  {
    question: 'What\'s the difference between equity and loans?',
    answer: 'Equity = selling ownership (no payments but you own less). Loans = borrowing money (keep ownership but must repay with interest).'
  },
  {
    question: 'Can I play against my friends?',
    answer: 'Yes! Create a game and share the code. Up to 4 human players can compete, with AI filling empty slots.'
  },
  {
    question: 'How does market demand affect my strategy?',
    answer: 'High demand = build more robots at higher prices. Low demand = focus on R&D and efficiency. Always match production to demand!'
  },
  {
    question: 'Is there a way to practice without competition?',
    answer: 'Play against AI opponents first to learn. They have different difficulty levels and strategies to help you improve.'
  }
];

const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Get unique categories
  const categories = ['all', ...new Set(HELP_TOPICS.map(topic => topic.category))];

  // Filter topics based on search and category
  const filteredTopics = HELP_TOPICS.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter FAQ based on search
  const filteredFAQ = FAQ_ITEMS.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle contact support - UPDATED WITH EMAIL
  const handleContactSupport = () => {
    window.location.href = 'mailto:tjohn@levelupstem.academy?subject=RoboStartup AI Support Request';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="text-white" size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Help Center</h1>
            <p className="text-gray-300">Learn how to master business through gaming</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for help topics, concepts, or questions..."
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-blue-400 focus:outline-none"
          >
            {categories.map(category => (
              <option key={category} value={category} className="text-black">
                {category === 'all' ? 'All Topics' : category}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Topics List */}
        <div className="lg:col-span-3">
          {selectedTopic ? (
            // Topic Detail View
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20"
            >
              <button
                onClick={() => setSelectedTopic(null)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-4"
              >
                <ArrowLeft size={16} />
                Back to topics
              </button>

              {(() => {
                const topic = HELP_TOPICS.find(t => t.id === selectedTopic);
                if (!topic) return null;
                const Icon = topic.icon;

                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-500/20 rounded-lg">
                        <Icon className="text-blue-400" size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{topic.title}</h2>
                        <p className="text-gray-300">{topic.description}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      {topic.content.map((paragraph, index) => (
                        <p key={index} className="text-gray-200 leading-relaxed whitespace-pre-line">
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    {topic.example && (
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                        <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                          <Sparkles size={18} />
                          Example
                        </h3>
                        <p className="text-blue-100">{topic.example}</p>
                      </div>
                    )}

                    {topic.tips && (
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                        <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                          <Lightbulb size={18} />
                          Pro Tips
                        </h3>
                        <div className="space-y-2">
                          {topic.tips.map((tip, index) => (
                            <div key={index} className="flex gap-2">
                              <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-green-100 text-sm">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          ) : (
            // Topics Grid
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filteredTopics.map((topic, index) => {
                  const Icon = topic.icon;
                  return (
                    <motion.button
                      key={topic.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedTopic(topic.id)}
                      className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all text-left group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                          <Icon className="text-blue-400" size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-2 group-hover:text-blue-100">
                            {topic.title}
                          </h3>
                          <p className="text-gray-300 text-sm mb-2">
                            {topic.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded">
                              {topic.category}
                            </span>
                            <ChevronRight className="text-gray-400 group-hover:text-blue-400" size={16} />
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* FAQ Section */}
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <HelpCircle className="text-yellow-400" size={24} />
                  Frequently Asked Questions
                </h2>

                <div className="space-y-3">
                  {filteredFAQ.map((item, index) => (
                    <div key={index} className="border border-white/10 rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                        className="w-full p-4 text-left flex justify-between items-center hover:bg-white/5 transition-colors"
                      >
                        <span className="text-white font-medium">{item.question}</span>
                        <ChevronDown 
                          className={`text-gray-400 transition-transform ${
                            expandedFAQ === index ? 'transform rotate-180' : ''
                          }`} 
                          size={20} 
                        />
                      </button>
                      <AnimatePresence>
                        {expandedFAQ === index && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-4"
                          >
                            <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Start */}
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6">
            <h3 className="text-green-400 font-semibold mb-4 flex items-center gap-2">
              <Play className="text-green-400" size={20} />
              Quick Start Guide
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-green-100">Create or join a game</span>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-green-100">Start with $500,000 cash</span>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-green-100">Build and sell robots</span>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <span className="text-green-100">Reach $7 million to win!</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Start Playing Now
            </button>
          </div>

          {/* Learning Resources */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-6">
            <h3 className="text-blue-400 font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="text-blue-400" size={20} />
              Learning Resources
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left p-2 hover:bg-white/10 rounded transition-colors">
                <div className="flex items-center gap-2">
                  <Video className="text-purple-400" size={16} />
                  <span className="text-blue-100 text-sm">Video Tutorials</span>
                </div>
              </button>
              <button className="w-full text-left p-2 hover:bg-white/10 rounded transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="text-green-400" size={16} />
                  <span className="text-blue-100 text-sm">Business Glossary</span>
                </div>
              </button>
              <button 
                onClick={() => navigate('/progress')}
                className="w-full text-left p-2 hover:bg-white/10 rounded transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target className="text-yellow-400" size={16} />
                  <span className="text-blue-100 text-sm">Progress Tracking</span>
                </div>
              </button>
            </div>
          </div>

          {/* Contact Support - UPDATED */}
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-6">
            <h3 className="text-purple-400 font-semibold mb-4">Need More Help?</h3>
            <p className="text-purple-200 text-sm mb-4">
              Can't find what you're looking for? Contact us for personalized support.
            </p>
            <button 
              onClick={handleContactSupport}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Email Support
            </button>
            <p className="text-purple-300 text-xs mt-2 text-center">
              tjohn@levelupstem.academy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;