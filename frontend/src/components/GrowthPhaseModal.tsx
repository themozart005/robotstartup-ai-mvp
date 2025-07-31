// frontend/src/components/GrowthPhaseModal.tsx
// Modal for selecting growth investments in the growth phase

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Info,
  Users,
  BarChart3,
  HelpCircle,
  Zap,
  X,
  Target,
  Building,
  Globe
} from 'lucide-react';
import { Player } from '../store/GameStore';

interface GrowthOption {
  id: string;
  name: string;
  cost: number;
  description: string;
  effects: Record<string, any>;
  icon: string;
  category: string;
  longDescription: string;
}

interface GrowthPhaseModalProps {
  isOpen: boolean;
  currentRound: number;
  player: Player;
  onSelectGrowth: (option: { investmentType: string; amount: number }) => void;
  onRequestHelp: (concept: string) => void;
}

const GrowthPhaseModal: React.FC<GrowthPhaseModalProps> = ({
  isOpen,
  currentRound,
  player,
  onSelectGrowth,
  onRequestHelp
}) => {
  const [selectedOption, setSelectedOption] = useState<GrowthOption | null>(null);

  // Growth options based on round
  const getGrowthOptions = (round: number): GrowthOption[] => {
    if (round === 1) {
      return [
        {
          id: 'brand_awareness',
          name: 'Brand Awareness Campaign',
          cost: 25000,
          description: 'Build market recognition and customer trust through targeted marketing',
          longDescription: 'Launch a comprehensive brand awareness campaign across digital and traditional media. This investment will increase your company\'s visibility in the robotics market and build trust with potential customers.',
          effects: { reputation: '+5', futuresalesBoost: '+10%' },
          icon: '📢',
          category: 'Marketing'
        },
        {
          id: 'market_research',
          name: 'Market Research',
          cost: 15000,
          description: 'Deep customer insights to guide product development and strategy',
          longDescription: 'Conduct thorough market research to understand customer needs, competitive landscape, and market opportunities. This data will inform better decision-making in future rounds.',
          effects: { reputation: '+2', rdEfficiency: '+10%' },
          icon: '📊',
          category: 'Strategy'
        },
        {
          id: 'partnerships',
          name: 'Partnership Development',
          cost: 30000,
          description: 'Strategic partnerships for distribution and market access',
          longDescription: 'Establish strategic partnerships with distributors, system integrators, and complementary technology companies to expand your market reach and capabilities.',
          effects: { reputation: '+3', salesChannels: '+1' },
          icon: '🤝',
          category: 'Business Development'
        },
        {
          id: 'skip_growth',
          name: 'Focus on Operations',
          cost: 0,
          description: 'Skip growth investments and focus on core business operations',
          longDescription: 'Conserve cash for future rounds and focus on operational efficiency rather than growth investments.',
          effects: {},
          icon: '⚡',
          category: 'Conservative'
        }
      ];
    } else {
      return [
        {
          id: 'digital_marketing',
          name: 'Digital Marketing Campaign',
          cost: 75000,
          description: 'Comprehensive online marketing and lead generation strategy',
          longDescription: 'Launch a sophisticated digital marketing campaign including SEO, content marketing, social media, and online advertising to generate high-quality leads and build market presence.',
          effects: { reputation: '+8', futuresalesBoost: '+15%' },
          icon: '💻',
          category: 'Digital Marketing'
        },
        {
          id: 'trade_shows',
          name: 'Trade Show Presence',
          cost: 50000,
          description: 'Industry visibility and direct customer acquisition at major events',
          longDescription: 'Participate in major robotics and automation trade shows to demonstrate your products, meet potential customers, and establish thought leadership in the industry.',
          effects: { reputation: '+6', customerAcquisition: '+20%' },
          icon: '🏢',
          category: 'Events'
        },
        {
          id: 'strategic_partnerships',
          name: 'Strategic Partnerships',
          cost: 100000,
          description: 'Joint ventures and market expansion initiatives with industry leaders',
          longDescription: 'Form strategic alliances with major industry players for joint technology development, market expansion, and access to enterprise customers.',
          effects: { reputation: '+10', salesMultiplier: 'x1.2' },
          icon: '🌟',
          category: 'Strategic'
        },
        {
          id: 'international_expansion',
          name: 'International Expansion',
          cost: 120000,
          description: 'Enter new geographic markets with localized strategies',
          longDescription: 'Expand into international markets with dedicated sales teams, local partnerships, and region-specific product adaptations.',
          effects: { reputation: '+7', marketExpansion: 'International', salesBoost: '0.25' },
          icon: '🌍',
          category: 'Expansion'
        },
        {
          id: 'skip_growth',
          name: 'Conservative Growth',
          cost: 0,
          description: 'Maintain current operations without additional investment',
          longDescription: 'Focus on organic growth and operational efficiency without making additional marketing investments.',
          effects: {},
          icon: '⚡',
          category: 'Conservative'
        }
      ];
    }
  };

  const growthOptions = getGrowthOptions(currentRound);

  const handleConfirmGrowth = () => {
    if (selectedOption) {
      onSelectGrowth({
        investmentType: selectedOption.id,
        amount: selectedOption.cost
      });
    }
  };

  const canAfford = (cost: number) => player.cash >= cost;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
            <button
              onClick={() => setSelectedOption(null)}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Growth Phase - Round {currentRound}
                </h2>
                <p className="text-purple-100">
                  {currentRound === 1 
                    ? 'Build your foundation and market presence'
                    : 'Scale your operations and expand market reach'
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-purple-200">Available Cash</div>
                <div className="text-2xl font-bold">${player.cash.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-purple-500/20 border-b border-purple-500/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="text-purple-400" size={20} />
                <span className="text-white font-semibold">Current Status</span>
              </div>
              <div className="text-right text-purple-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Reputation: {player.reputation}/100</div>
                  <div>Round: {currentRound} - {currentRound === 1 ? 'Prove Concept' : 'Scale Business'}</div>
                  <div>Robots: {player.robots.filter(r => !r.sold).length} active</div>
                  <div>Technologies: {player.technologies.length} owned</div>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Options */}
          <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
            {growthOptions.map((option) => {
              const isSelected = selectedOption?.id === option.id;
              const affordable = canAfford(option.cost);

              return (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedOption(option)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-500/20'
                      : affordable
                      ? 'border-gray-600 bg-white/5 hover:border-gray-500'
                      : 'border-red-600/50 bg-red-500/10 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-2xl">{option.icon}</div>
                        <div>
                          <h3 className="text-white font-semibold text-lg">{option.name}</h3>
                          <p className="text-gray-300 text-sm">{option.category}</p>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-3">{option.description}</p>

                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="text-green-400" size={16} />
                          <span className={`font-semibold ${
                            affordable ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {option.cost === 0 ? 'Free' : `$${option.cost.toLocaleString()}`}
                          </span>
                        </div>

                        {Object.keys(option.effects).length > 0 && (
                          <div className="flex items-center gap-2">
                            <BarChart3 className="text-blue-400" size={16} />
                            <span className="text-blue-300 text-sm">
                              {Object.entries(option.effects).map(([key, value]) => 
                                `${key}: ${value}`
                              ).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>

                      {!affordable && option.cost > 0 && (
                        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded flex items-center gap-2">
                          <AlertTriangle className="text-red-400" size={16} />
                          <span className="text-red-200 text-sm">
                            Need ${(option.cost - player.cash).toLocaleString()} more
                          </span>
                        </div>
                      )}

                      {/* Show detailed description for selected option */}
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 p-3 bg-purple-600/20 rounded-lg border border-purple-500/30"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="text-purple-400" size={16} />
                            <span className="text-purple-200 font-medium">Detailed Overview</span>
                          </div>
                          <p className="text-purple-100 text-sm">{option.longDescription}</p>
                        </motion.div>
                      )}
                    </div>

                    {isSelected && (
                      <div className="ml-4">
                        <CheckCircle className="text-purple-400" size={24} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Educational Tip */}
          <div className="border-t border-gray-700 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <Target className="text-blue-400 mt-1" size={20} />
              <div>
                <h4 className="text-blue-300 font-medium mb-1">Growth Strategy Tip</h4>
                <p className="text-blue-200 text-sm">
                  {currentRound === 1 
                    ? 'In Round 1, focus on building your market presence and understanding customer needs. Brand awareness and partnerships are crucial for long-term success.'
                    : 'In later rounds, scale your proven strategies. Digital marketing and strategic partnerships can accelerate growth, while international expansion opens new markets.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <button
                onClick={() => onRequestHelp('growth-strategy')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <HelpCircle size={16} />
                Growth Strategy Help
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleConfirmGrowth}
                  disabled={!selectedOption}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    selectedOption
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {selectedOption?.cost === 0 ? 'Continue' : 'Invest'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GrowthPhaseModal;