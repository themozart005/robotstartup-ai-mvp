// frontend/src/pages/HelpCenter.tsx
// This page provides tutorials, help documentation, and learning resources
// Like an instruction manual and learning center combined

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
  CreditCard
} from 'lucide-react';

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  content: string[];
  tips?: string[];
}

const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Learn the basics of playing RoboStartup AI',
    category: 'Basics',
    icon: Play,
    content: [
      'Welcome to RoboStartup AI! This game teaches business and financial concepts through an interactive robotics company simulation.',
      'You\'ll start with $500,000 in cash and build your robotics empire through smart decisions.',
      'The game has 5 phases each round: Startup, R&D, Production, Sales, and Investment.',
      'Your goal is to reach $7 million in total assets or have the highest net worth when the game ends.',
      'Make decisions about what robots to build, which technologies to research, and how to finance your growth.'
    ],
    tips: [
      'Start with simple robots to learn the mechanics',
      'Always keep some cash for unexpected opportunities',
      'Pay attention to market conditions when making decisions'
    ]
  },
  {
    id: 'game-phases',
    title: 'Understanding Game Phases',
    description: 'Learn what happens in each phase of the game',
    category: 'Gameplay',
    icon: Target,
    content: [
      'STARTUP PHASE: Collect your $50,000 round income and plan your strategy.',
      'R&D PHASE: Invest in new technologies to improve your robots. Success depends on dice rolls.',
      'PRODUCTION PHASE: Build robots based on market predictions. Choose types and components wisely.',
      'SALES PHASE: Sell your robots to customers. Prices depend on market demand and robot quality.',
      'INVESTMENT PHASE: Manage financing through loans, pay debts, and plan for growth.'
    ],
    tips: [
      'Each phase builds on the previous one',
      'Planning ahead across phases is key to success',
      'Market conditions can change between rounds'
    ]
  },
  {
    id: 'financial-literacy',
    title: 'Financial Concepts',
    description: 'Understanding money, profits, and business finances',
    category: 'Education',
    icon: DollarSign,
    content: [
      'CASH FLOW: Track money coming in (revenue) and going out (expenses).',
      'PROFIT: Revenue minus costs. This is how much money you actually make.',
      'NET WORTH: Total assets (what you own) minus total debts (what you owe).',
      'DEBT-TO-ASSET RATIO: How much you owe compared to what you own. Lower is usually better.',
      'ROI (Return on Investment): How much profit you get compared to what you invested.'
    ],
    tips: [
      'Keep track of your cash flow to avoid running out of money',
      'Profit is more important than revenue',
      'Don\'t take on too much debt relative to your assets'
    ]
  },
  {
    id: 'robot-production',
    title: 'Robot Production Strategy',
    description: 'How to decide what robots to build and when',
    category: 'Strategy',
    icon: Factory,
    content: [
      'Different robot types have different costs and profit potential.',
      'Humanoid robots are expensive but have high profit margins.',
      'Industrial robots have steady demand from manufacturing companies.',
      'Service robots are cheaper to make but have lower selling prices.',
      'Components add cost but increase robot value and market appeal.'
    ],
    tips: [
      'Match your robot production to market demand',
      'Higher-end robots need higher-end components',
      'Don\'t overproduce - you can only sell what customers want'
    ]
  },
  {
    id: 'rd-investment',
    title: 'Research & Development',
    description: 'When and how to invest in new technologies',
    category: 'Strategy',
    icon: Cog,
    content: [
      'R&D investments improve your robots but success isn\'t guaranteed.',
      'Advanced investment (150% cost) increases your success probability.',
      'Technologies provide ongoing benefits for several rounds.',
      'AI Navigation improves robot efficiency and reduces accidents.',
      'Battery Optimization extends operational time and reduces power consumption.'
    ],
    tips: [
      'Invest in R&D early when you have cash to spare',
      'Choose technologies that match your robot types',
      'Advanced investment is worth it for critical technologies'
    ]
  },
  {
    id: 'market-analysis',
    title: 'Reading Market Conditions',
    description: 'How to interpret and respond to market changes',
    category: 'Strategy',
    icon: Brain,
    content: [
      'HIGH DEMAND: Great time to sell, premium pricing possible.',
      'MEDIUM DEMAND: Steady market, balanced approach recommended.',
      'LOW DEMAND: Focus on efficiency and cost reduction.',
      'VOLATILITY: How much market conditions change. High volatility means unpredictable swings.',
      'TRENDS: Long-term directions like "automation growth" or "AI advancement".'
    ],
    tips: [
      'Build more robots when demand is high',
      'Focus on R&D and efficiency when demand is low',
      'High volatility means be ready for rapid changes'
    ]
  },
  {
    id: 'multiplayer-tips',
    title: 'Multiplayer Strategy',
    description: 'Competing effectively against other players',
    category: 'Multiplayer',
    icon: Users,
    content: [
      'Watch what other players are doing and adapt your strategy.',
      'Don\'t always copy successful players - find your own niche.',
      'Communication is allowed - consider forming temporary alliances.',
      'AI opponents have different personalities and strategies.',
      'The first player to $7 million wins, regardless of round number.'
    ],
    tips: [
      'Specialize in different robot types than your competitors',
      'Time your big moves when others are struggling',
      'Don\'t reveal your strategy too early'
    ]
  },
  {
    id: 'ai-tutor',
    title: 'Using the AI Tutor',
    description: 'Getting the most out of personalized learning help',
    category: 'Learning',
    icon: Lightbulb,
    content: [
      'Click the "AI Help" button whenever you need explanation of business concepts.',
      'The AI tutor provides personalized explanations based on your current situation.',
      'Take the quizzes to reinforce your learning and track progress.',
      'The AI adapts its explanations to your age and experience level.',
      'Don\'t hesitate to ask for help - that\'s how you learn!'
    ],
    tips: [
      'Use AI help when you encounter new terms',
      'Try to answer quiz questions before looking up answers',
      'Ask for specific examples related to your current game situation'
    ]
  }
];

const FAQ_ITEMS = [
  {
    question: 'How long does a typical game last?',
    answer: 'A beginner game (5 rounds) takes about 30-45 minutes. Advanced games (10 rounds) can take 60-90 minutes.'
  },
  {
    question: 'Can I pause and resume a game later?',
    answer: 'Single-player games can be paused. Multiplayer games continue in real-time, but you can reconnect if disconnected.'
  },
  {
    question: 'What happens if I run out of money?',
    answer: 'You can take loans to continue playing. The game tracks your financial health and provides warnings.'
  },
  {
    question: 'How do I invite friends to play?',
    answer: 'Create a game and share the game code with friends. They can join using the code in the lobby.'
  },
  {
    question: 'Are there different difficulty levels?',
    answer: 'Yes! Beginner mode (ages 12-15) has simpler mechanics. Advanced mode (ages 16+) includes complex financial management.'
  },
  {
    question: 'How does the AI opponent work?',
    answer: 'AI opponents have different personalities and strategies. They make realistic business decisions to provide competition.'
  },
  {
    question: 'Can teachers use this in classrooms?',
    answer: 'Absolutely! The game includes progress tracking and educational reports perfect for classroom use.'
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
                        <p key={index} className="text-gray-200 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>

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
              Quick Start
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <span className="text-green-100">Create your first game</span>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <span className="text-green-100">Learn the 5 game phases</span>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <span className="text-green-100">Use AI tutor when stuck</span>
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                <span className="text-green-100">Track your progress</span>
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

          {/* Contact Support */}
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-6">
            <h3 className="text-purple-400 font-semibold mb-4">Need More Help?</h3>
            <p className="text-purple-200 text-sm mb-4">
              Can't find what you're looking for? Our AI tutor is available in-game for personalized help.
            </p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This HelpCenter component is like a comprehensive instruction manual and
 * learning resource center. Here's what each section provides:
 * 
 * 1. SEARCH AND FILTER:
 *    - Students can search for specific topics or questions
 *    - Filter by category (Basics, Gameplay, Strategy, etc.)
 *    - Real-time filtering as they type
 * 
 * 2. HELP TOPICS:
 *    - Detailed explanations of game mechanics
 *    - Business concept explanations
 *    - Strategic guidance and tips
 *    - Step-by-step instructions
 * 
 * 3. FAQ SECTION:
 *    - Common questions and answers
 *    - Expandable/collapsible format
 *    - Covers technical and gameplay issues
 * 
 * 4. QUICK START GUIDE:
 *    - Step-by-step onboarding
 *    - Essential concepts for new players
 *    - Direct links to start playing
 * 
 * 5. LEARNING RESOURCES:
 *    - Links to additional educational content
 *    - Progress tracking access
 *    - Video tutorials and glossaries
 * 
 * EDUCATIONAL VALUE:
 * - Self-service learning support
 * - Comprehensive coverage of business concepts
 * - Multiple learning formats (text, tips, examples)
 * - Encourages independent problem-solving
 * - Scaffolded learning from basic to advanced
 * 
 * This creates a comprehensive support system where students can find
 * answers to questions and deepen their understanding of business concepts.
 */