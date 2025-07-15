// frontend/src/components/TechnologyLab.tsx
// This component handles research and development investments
// Like a science lab where you invest in new innovations

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cog, 
  Zap, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Beaker,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { Technology, gameHelpers } from '../store/GameStore';

interface TechnologyLabProps {
  technologies: Technology[];
  cash: number;
  onInvestInTech: (techData: any) => void;
  onRequestHelp: () => void;
}

// Available technologies for research and development
const AVAILABLE_TECHNOLOGIES = [
  {
    id: 'ai_navigation',
    name: 'AI Navigation',
    baseCost: 120000,
    category: 'Software',
    description: 'Advanced pathfinding and obstacle avoidance algorithms',
    benefits: [
      '+20% robot efficiency in complex environments',
      'Reduces accident rates by 35%',
      'Enables autonomous operation in dynamic spaces'
    ],
    marketImpact: 'High demand for smart navigation in logistics',
    difficulty: 'Medium',
    researchTime: '2-3 rounds',
    icon: '🧠',
    color: 'bg-blue-500'
  },
  {
    id: 'advanced_arms',
    name: 'Advanced Manipulation',
    baseCost: 100000,
    category: 'Hardware',
    description: 'Precision robotic arms with enhanced dexterity',
    benefits: [
      '+15% manufacturing precision',
      'Enables delicate assembly tasks',
      'Reduces material waste by 20%'
    ],
    marketImpact: 'Essential for high-precision manufacturing',
    difficulty: 'Medium',
    researchTime: '2 rounds',
    icon: '🦾',
    color: 'bg-orange-500'
  },
  {
    id: 'battery_optimization',
    name: 'Power Management',
    baseCost: 110000,
    category: 'Energy',
    description: 'Extended battery life and charging efficiency',
    benefits: [
      '+50% operational time per charge',
      'Fast-charging capability (80% in 30 min)',
      'Reduces power consumption by 25%'
    ],
    marketImpact: 'Critical for mobile and service robots',
    difficulty: 'Low',
    researchTime: '1-2 rounds',
    icon: '🔋',
    color: 'bg-green-500'
  },
  {
    id: 'autonomous_systems',
    name: 'Full Autonomy',
    baseCost: 150000,
    category: 'AI',
    description: 'Complete autonomous decision-making capabilities',
    benefits: [
      '+30% productivity with minimal supervision',
      'Self-diagnostic and maintenance capabilities',
      'Adaptive learning from experience'
    ],
    marketImpact: 'Premium feature for enterprise clients',
    difficulty: 'High',
    researchTime: '3-4 rounds',
    icon: '🤖',
    color: 'bg-purple-500'
  },
  {
    id: 'sensor_fusion',
    name: 'Multi-Sensor Integration',
    baseCost: 115000,
    category: 'Perception',
    description: 'Advanced sensor integration for environmental awareness',
    benefits: [
      '+25% situational awareness accuracy',
      'Works in low-light and dusty conditions',
      'Predictive collision avoidance'
    ],
    marketImpact: 'Safety-critical applications value this highly',
    difficulty: 'Medium',
    researchTime: '2-3 rounds',
    icon: '👁️',
    color: 'bg-indigo-500'
  },
  {
    id: 'modular_design',
    name: 'Modular Architecture',
    baseCost: 90000,
    category: 'Design',
    description: 'Interchangeable components for customization',
    benefits: [
      'Reduces manufacturing costs by 15%',
      'Enables rapid customization for clients',
      'Easier maintenance and upgrades'
    ],
    marketImpact: 'Competitive advantage in custom solutions',
    difficulty: 'Low',
    researchTime: '1-2 rounds',
    icon: '🔧',
    color: 'bg-gray-500'
  }
];

const TechnologyLab: React.FC<TechnologyLabProps> = ({
  technologies,
  cash,
  onInvestInTech,
  onRequestHelp
}) => {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [investmentLevel, setInvestmentLevel] = useState<'basic' | 'advanced'>('basic');

  // Get active technology IDs
  const activeTechIds = technologies.map(tech => 
    tech.name.toLowerCase().replace(/\s+/g, '_')
  );

  // Calculate investment cost
  const selectedTechnology = AVAILABLE_TECHNOLOGIES.find(tech => tech.id === selectedTech);
  const investmentMultiplier = investmentLevel === 'advanced' ? 1.5 : 1;
  const totalCost = selectedTechnology ? Math.floor(selectedTechnology.baseCost * investmentMultiplier) : 0;

  // Check if can afford investment
  const canAfford = cash >= totalCost;
  const alreadyResearched = selectedTech ? activeTechIds.includes(selectedTech) : false;

  // Handle technology investment
  const handleInvest = () => {
    if (!selectedTechnology || !canAfford || alreadyResearched) return;

    onInvestInTech({
      technology: selectedTechnology.name,
      investment: totalCost,
      level: investmentLevel
    });

    // Reset selection
    setSelectedTech(null);
    setInvestmentLevel('basic');
  };

  // Get difficulty styling
  const getDifficultyStyling = (difficulty: string) => {
    switch (difficulty) {
      case 'Low': return 'text-green-400 bg-green-500/20';
      case 'Medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'High': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Technologies */}
      <div className="bg-white/5 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Beaker size={16} />
            Active Research
          </h4>
          <button
            onClick={onRequestHelp}
            className="text-blue-400 hover:text-blue-300"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {technologies.length > 0 ? (
          <div className="space-y-2">
            {technologies.map((tech, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                <div>
                  <div className="text-white text-sm font-medium">{tech.name}</div>
                  <div className="text-gray-400 text-xs">
                    Level: {tech.level} • {tech.rounds_remaining} rounds left
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 text-sm">+{(tech.benefit * 100).toFixed(0)}%</div>
                  <div className="text-gray-400 text-xs">active</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Lightbulb className="text-gray-400 mx-auto mb-2" size={24} />
            <p className="text-gray-400 text-sm">No active research projects</p>
          </div>
        )}
      </div>

      {/* Available Technologies */}
      <div>
        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
          <Cog size={16} />
          Research Opportunities
        </h4>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {AVAILABLE_TECHNOLOGIES.map((tech) => {
            const isActive = activeTechIds.includes(tech.id);
            const isSelected = selectedTech === tech.id;

            return (
              <motion.button
                key={tech.id}
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                whileTap={{ scale: isActive ? 1 : 0.98 }}
                onClick={() => !isActive && setSelectedTech(isSelected ? null : tech.id)}
                disabled={isActive}
                className={`w-full p-3 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-green-500/20 border-green-500/50 opacity-60'
                    : isSelected
                    ? 'bg-blue-500/20 border-blue-500/50 text-white'
                    : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{tech.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{tech.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyStyling(tech.difficulty)}`}>
                        {tech.difficulty}
                      </span>
                      {isActive && (
                        <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-75 mb-2">{tech.description}</p>
                    <div className="text-xs text-blue-300 mb-1">
                      <span className="font-medium">Market Impact:</span> {tech.marketImpact}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 font-semibold">
                        ${tech.baseCost.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock size={12} />
                        <span className="text-xs">{tech.researchTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Investment Configuration */}
      {selectedTech && selectedTechnology && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4"
        >
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <DollarSign size={16} />
            Investment Configuration
          </h4>

          {/* Investment Level */}
          <div className="mb-4">
            <label className="block text-white text-sm font-medium mb-2">
              Investment Level:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setInvestmentLevel('basic')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  investmentLevel === 'basic'
                    ? 'bg-green-600/30 border-green-500/50 text-white'
                    : 'bg-white/5 border-white/20 text-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Basic Research</div>
                <div className="text-xs opacity-75">Standard investment</div>
                <div className="text-green-400 font-semibold mt-1">
                  ${selectedTechnology.baseCost.toLocaleString()}
                </div>
              </button>
              <button
                onClick={() => setInvestmentLevel('advanced')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  investmentLevel === 'advanced'
                    ? 'bg-purple-600/30 border-purple-500/50 text-white'
                    : 'bg-white/5 border-white/20 text-gray-300'
                }`}
              >
                <div className="font-medium text-sm">Advanced Research</div>
                <div className="text-xs opacity-75">+50% investment, higher success rate</div>
                <div className="text-purple-400 font-semibold mt-1">
                  ${Math.floor(selectedTechnology.baseCost * 1.5).toLocaleString()}
                </div>
              </button>
            </div>
          </div>

          {/* Expected Benefits */}
          <div className="mb-4">
            <h5 className="text-white text-sm font-medium mb-2">Expected Benefits:</h5>
            <div className="space-y-1">
              {selectedTechnology.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <CheckCircle size={12} className="text-green-400" />
                  <span className="text-green-200">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-blue-600/20 rounded p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-100">Total Investment:</span>
              <span className="text-white font-semibold">${totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-100">Your Cash:</span>
              <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                ${cash.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Warning Messages */}
          {!canAfford && (
            <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg mb-4">
              <AlertTriangle className="text-red-400" size={16} />
              <span className="text-red-300 text-sm">
                Insufficient funds. Need ${(totalCost - cash).toLocaleString()} more.
              </span>
            </div>
          )}

          {alreadyResearched && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg mb-4">
              <AlertTriangle className="text-yellow-400" size={16} />
              <span className="text-yellow-300 text-sm">
                You already have this technology researched.
              </span>
            </div>
          )}

          {/* Investment Button */}
          <button
            onClick={handleInvest}
            disabled={!canAfford || alreadyResearched}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
              canAfford && !alreadyResearched
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {canAfford && !alreadyResearched ? (
              <>
                <Zap size={18} />
                Invest in {selectedTechnology.name}
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                Cannot Invest
              </>
            )}
          </button>

          {/* Research Risk Notice */}
          <div className="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-200">
            <strong>Note:</strong> R&D success depends on dice roll. {investmentLevel === 'advanced' ? 'Advanced' : 'Basic'} 
            investment {investmentLevel === 'advanced' ? 'increases' : 'provides standard'} success probability.
          </div>
        </motion.div>
      )}

      {/* Research Strategy Tips */}
      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="text-purple-400" size={16} />
          <span className="text-white text-sm font-medium">R&D Strategy Tips</span>
        </div>
        <div className="space-y-1 text-xs text-purple-200">
          <div>• Invest early in technologies that match your robot types</div>
          <div>• Advanced investment increases success probability</div>
          <div>• Consider market trends when choosing research focus</div>
          <div>• Balance risk vs reward based on your cash position</div>
        </div>
      </div>
    </div>
  );
};

export default TechnologyLab;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This TechnologyLab component simulates a research and development department
 * where students make innovation investments. Here's what it teaches:
 * 
 * 1. RESEARCH PORTFOLIO MANAGEMENT:
 *    - Shows active research projects and their progress
 *    - Tracks technology benefits and remaining duration
 *    - Helps students understand R&D as ongoing investment
 * 
 * 2. TECHNOLOGY SELECTION:
 *    - Different technologies with varying costs and benefits
 *    - Market impact information to guide investment decisions
 *    - Difficulty levels affecting success probability
 * 
 * 3. INVESTMENT STRATEGY:
 *    - Basic vs Advanced investment levels
 *    - Risk vs reward trade-offs in R&D spending
 *    - Expected return on investment calculations
 * 
 * 4. FINANCIAL PLANNING:
 *    - Cost-benefit analysis of research investments
 *    - Cash flow management for innovation funding
 *    - Opportunity cost of different research paths
 * 
 * 5. RISK MANAGEMENT:
 *    - Understanding that R&D success isn't guaranteed
 *    - Balancing innovation with financial stability
 *    - Portfolio diversification in research investments
 * 
 * BUSINESS CONCEPTS TAUGHT:
 * - Innovation as competitive advantage
 * - R&D investment planning and budgeting
 * - Technology roadmap development
 * - Risk assessment in new product development
 * - Time-to-market considerations
 * - ROI analysis for innovation projects
 * 
 * This helps students understand how real companies decide where to invest
 * their research dollars and how innovation drives business success.
 */