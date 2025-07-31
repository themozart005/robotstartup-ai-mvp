// frontend/src/components/GamePhasePanel.tsx
// COMPLETE VERSION - With bootstrap/funding/growth phase structure

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Cog, 
  Factory, 
  ShoppingCart, 
  CreditCard,
  HelpCircle,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  PieChart,
  Building,
  BarChart3,
  Target,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Player, GameSettings } from '../store/GameStore';
import FundingModal from './FundingModal';
import GrowthPhaseModal from './GrowthPhaseModal';

interface GamePhasePanelProps {
  phase: 'bootstrap' | 'funding' | 'r&d' | 'production' | 'sales' | 'growth';
  phaseInfo: {
    phase: string;
    description: string;
    actions: string[];
  };
  player: Player;
  gameSettings: GameSettings;
  marketConditions: any;
  isMyTurn: boolean;
  canMakeMove: boolean;
  currentRound: number;
  onMakeMove: (moveData: any) => void;
  onRequestHelp: (concept: string) => void;
  selectedAction: string | null;
  onSelectAction: (action: string | null) => void;
}

const GamePhasePanel: React.FC<GamePhasePanelProps> = ({
  phase,
  phaseInfo,
  player,
  gameSettings,
  marketConditions,
  isMyTurn,
  canMakeMove,
  currentRound,
  onMakeMove,
  onRequestHelp,
  selectedAction,
  onSelectAction
}) => {
  const [actionData, setActionData] = useState<any>({});
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);

  // Handle action selection
  const handleSelectAction = (action: string) => {
    if (!canMakeMove) return;
    
    if (selectedAction === action) {
      onSelectAction(null);
      setActionData({});
    } else {
      onSelectAction(action);
      setActionData({});
    }
  };

  // Handle funding selection from modal
  const handleFundingSelection = (option: any) => {
    onMakeMove({
      action: 'select_funding',
      data: {
        fundingType: option.type,
        amount: option.amount,
        equityGiven: option.equityGiven,
        interestRate: option.interestRate,
        termRounds: option.termRounds,
        investorName: option.name
      }
    });
    setShowFundingModal(false);
  };

  // Handle growth selection from modal
  const handleGrowthSelection = (option: any) => {
    onMakeMove({
      action: 'invest_marketing',
      data: {
        investmentType: option.investmentType,
        amount: option.amount
      }
    });
    setShowGrowthModal(false);
  };

  // UPDATED: Bootstrap Phase (Round 1 only)
  const renderBootstrapPhase = () => {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 rounded-lg">
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <DollarSign size={20} />
            Bootstrap Phase - Launch Your Startup
          </h3>
          <p className="text-green-100 mb-4">
            Secure your initial funding from friends & family to launch your robotics startup.
          </p>
          
          <div className="bg-green-600/30 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-200">Bootstrap Funding:</span>
                <div className="text-green-100 font-semibold">$50,000</div>
              </div>
              <div>
                <span className="text-green-200">Your Equity:</span>
                <div className="text-green-100 font-semibold">100%</div>
              </div>
              <div>
                <span className="text-green-200">Funding Source:</span>
                <div className="text-green-100 font-semibold">Friends & Family</div>
              </div>
              <div>
                <span className="text-green-200">Valuation:</span>
                <div className="text-green-100 font-semibold">Pre-revenue</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => onMakeMove({ action: 'collect_income', data: {} })}
              disabled={!canMakeMove}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                canMakeMove
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Accept Bootstrap Funding
            </button>
          </div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
          <h4 className="text-white font-medium mb-2">💡 Bootstrap Strategy</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• This is your initial capital to prove your concept</li>
            <li>• Focus on building an MVP and finding early customers</li>
            <li>• Manage cash carefully - you won't get more funding until Round 2</li>
          </ul>
        </div>
      </div>
    );
  };

  // UPDATED: Funding Phase (Round 2+ only)
  const renderFundingPhase = () => {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-lg">
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <TrendingUp size={20} />
            Funding Phase - Scale Your Proven Business
          </h3>
          <p className="text-purple-100 mb-4">
            You've proven your concept works. Now raise capital to scale your operations.
          </p>
          
          <div className="bg-purple-600/30 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-purple-200">Current Cash:</span>
                <div className="text-purple-100 font-semibold">${player.cash.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-purple-200">Your Equity:</span>
                <div className={`font-semibold ${
                  (player.equity || 100) >= 51 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {player.equity || 100}%
                </div>
              </div>
              <div>
                <span className="text-purple-200">Round:</span>
                <div className="text-purple-100 font-semibold">{currentRound}</div>
              </div>
              <div>
                <span className="text-purple-200">Funding History:</span>
                <div className="text-purple-100 font-semibold">
                  {(player.fundingRounds || []).length} rounds
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowFundingModal(true)}
              disabled={!canMakeMove}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                canMakeMove
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Choose Funding Strategy
            </button>
          </div>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
          <h4 className="text-white font-medium mb-2">💰 Funding Strategy</h4>
          <ul className="text-purple-200 text-sm space-y-1">
            <li>• Venture capital provides money + expertise but dilutes ownership</li>
            <li>• Business loans keep you in control but require regular payments</li>
            <li>• Consider your growth plans and risk tolerance</li>
          </ul>
        </div>
      </div>
    );
  };

  // R&D Phase: Invest in technology
  const renderRnDPhase = () => {
    const [selectedTech, setSelectedTech] = useState('');
    const [investment, setInvestment] = useState(100000);

    const technologies = [
      { name: 'AI Navigation', cost: 120000, benefit: 'Improves robot guidance systems' },
      { name: 'Advanced Arms', cost: 100000, benefit: 'Enhances robot manipulation' },
      { name: 'Battery Optimization', cost: 110000, benefit: 'Extends operational time' },
      { name: 'Autonomous System', cost: 150000, benefit: 'Enables minimal supervision' },
      { name: 'Sensor Technology', cost: 115000, benefit: 'Improves awareness and precision' }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Cog className="text-purple-400" size={24} />
            <div>
              <h3 className="text-white font-semibold">Research & Development</h3>
              <p className="text-purple-200 text-sm">
                {currentRound === 1 ? 'Develop your MVP and core technology' : 'Advance technology for competitive advantage'}
              </p>
            </div>
          </div>

          {/* Technology Selection */}
          <div className="space-y-2 mb-4">
            <label className="text-white text-sm font-medium">Select Technology:</label>
            <select
              value={selectedTech}
              onChange={(e) => {
                setSelectedTech(e.target.value);
                const tech = technologies.find(t => t.name === e.target.value);
                if (tech) setInvestment(tech.cost);
                setActionData({ technology: e.target.value, investment: tech?.cost || 100000 });
              }}
              className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
              disabled={!canMakeMove}
            >
              <option value="">Choose a technology...</option>
              {technologies.map(tech => (
                <option key={tech.name} value={tech.name} className="text-black">
                  {tech.name} - ${tech.cost.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {selectedTech && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-purple-600/20 rounded p-3 mb-4"
            >
              <div className="text-sm text-purple-100">
                <strong>{selectedTech}</strong>
                <p className="mt-1">{technologies.find(t => t.name === selectedTech)?.benefit}</p>
                <div className="flex justify-between mt-2 pt-2 border-t border-purple-500/30">
                  <span>Investment Cost:</span>
                  <span className="font-semibold">${investment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Cash:</span>
                  <span className={player.cash >= investment ? 'text-green-400' : 'text-red-400'}>
                    ${player.cash.toLocaleString()}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (selectedTech) {
                  onMakeMove({
                    action: 'invest_r&d',
                    data: { technology: selectedTech }
                  });
                }
              }}
              disabled={!canMakeMove || !selectedTech || player.cash < investment}
              className={`flex-1 py-2 px-4 rounded font-semibold transition-all ${
                canMakeMove && selectedTech && player.cash >= investment
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Invest in R&D
            </button>
            
            <button
              onClick={() => onMakeMove({ action: 'skip_r&d', data: { reason: 'player_choice' } })}
              disabled={!canMakeMove}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-100 text-sm">Need help with R&D strategy?</span>
            <button
              onClick={() => onRequestHelp('innovation-strategy')}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Ask AI Tutor
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Production Phase: Build robots
  const renderProductionPhase = () => {
    const [robotType, setRobotType] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [components, setComponents] = useState<string[]>([]);

    const robotTypes = [
      { name: 'Humanoid', baseCost: 150000, description: 'Advanced human-like robots' },
      { name: 'Industrial', baseCost: 130000, description: 'Heavy-duty industrial automation' },
      { name: 'Mobile', baseCost: 120000, description: 'Autonomous mobile platforms' },
      { name: 'Service', baseCost: 110000, description: 'Customer service robots' },
      { name: 'Medical', baseCost: 180000, description: 'Healthcare assistance robots' }
    ];

    const availableComponents = [
      { name: 'standard_motors', label: 'Standard Motors', cost: 25000 },
      { name: 'sensor_package', label: 'Sensor Package', cost: 30000 },
      { name: 'ai_processing', label: 'AI Processing Unit', cost: 40000 },
      { name: 'battery', label: 'High-Capacity Battery', cost: 35000 }
    ];

    const selectedRobotType = robotTypes.find(r => r.name === robotType);
    const componentCost = components.reduce((sum, comp) => {
      const component = availableComponents.find(c => c.name === comp);
      return sum + (component?.cost || 0);
    }, 0);
    const totalCost = selectedRobotType ? (selectedRobotType.baseCost + componentCost) * quantity : 0;

    const maxProduction = 3; // Simplified
    const canProduce = player.robotsBuiltThisRound + quantity <= maxProduction;

    return (
      <div className="space-y-4">
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Factory className="text-orange-400" size={24} />
            <div>
              <h3 className="text-white font-semibold">Robot Production</h3>
              <p className="text-orange-200 text-sm">
                {currentRound === 1 
                  ? 'Build your first products to test the market'
                  : 'Scale manufacturing to meet growing demand'
                } ({player.robotsBuiltThisRound}/{maxProduction} used)
              </p>
            </div>
          </div>

          {/* Robot Type Selection */}
          <div className="space-y-3 mb-4">
            <label className="text-white text-sm font-medium">Robot Type:</label>
            <div className="grid grid-cols-1 gap-2">
              {robotTypes.map(robot => (
                <button
                  key={robot.name}
                  onClick={() => {
                    setRobotType(robot.name);
                    setActionData({ robotType: robot.name, quantity, components });
                  }}
                  disabled={!canMakeMove}
                  className={`p-3 rounded border text-left transition-all ${
                    robotType === robot.name
                      ? 'bg-orange-600/30 border-orange-500/50 text-white'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{robot.name}</div>
                      <div className="text-sm opacity-75">{robot.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${robot.baseCost.toLocaleString()}</div>
                      <div className="text-xs opacity-75">base cost</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {robotType && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Quantity */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={maxProduction - player.robotsBuiltThisRound}
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value) || 1;
                    setQuantity(newQuantity);
                    setActionData({ robotType, quantity: newQuantity, components });
                  }}
                  disabled={!canMakeMove}
                  className="w-full p-2 bg-white/10 border border-white/20 rounded text-white"
                />
                {!canProduce && (
                  <p className="text-red-400 text-xs mt-1">
                    Exceeds production capacity ({maxProduction - player.robotsBuiltThisRound} remaining)
                  </p>
                )}
              </div>

              {/* Components */}
              <div>
                <label className="text-white text-sm font-medium mb-2 block">Optional Components:</label>
                <div className="space-y-2">
                  {availableComponents.map(component => (
                    <label key={component.name} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={components.includes(component.name)}
                        onChange={(e) => {
                          const newComponents = e.target.checked
                            ? [...components, component.name]
                            : components.filter(c => c !== component.name);
                          setComponents(newComponents);
                          setActionData({ robotType, quantity, components: newComponents });
                        }}
                        disabled={!canMakeMove}
                        className="rounded"
                      />
                      <span className="text-white">{component.label}</span>
                      <span className="text-gray-400">+${component.cost.toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Cost Summary */}
              <div className="bg-orange-600/20 rounded p-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-orange-100">Base Cost ({quantity}x):</span>
                    <span className="text-white">${(selectedRobotType.baseCost * quantity).toLocaleString()}</span>
                  </div>
                  {componentCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-orange-100">Components ({quantity}x):</span>
                      <span className="text-white">${(componentCost * quantity).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-orange-500/30 pt-1 flex justify-between font-semibold">
                    <span className="text-orange-100">Total Cost:</span>
                    <span className="text-white">${totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-100">Your Cash:</span>
                    <span className={player.cash >= totalCost ? 'text-green-400' : 'text-red-400'}>
                      ${player.cash.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                if (robotType) {
                  onMakeMove({
                    action: 'build_robots',
                    data: {
                      robotType: robotType,
                      quantity: quantity,
                      components: components
                    }
                  });
                }
              }}
              disabled={!canMakeMove || !robotType || player.cash < totalCost || !canProduce}
              className={`flex-1 py-2 px-4 rounded font-semibold transition-all ${
                canMakeMove && robotType && player.cash >= totalCost && canProduce
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Build Robots
            </button>
            
            <button
              onClick={() => onMakeMove({ action: 'skip_production', data: { reason: 'player_choice' } })}
              disabled={!canMakeMove}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Skip
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-100 text-sm">Need production planning help?</span>
            <button
              onClick={() => onRequestHelp('production-planning')}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Ask AI Tutor
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Sales Phase: Sell robots with quantity selection
  const renderSalesPhase = () => {
    const unsoldRobots = player.robots.filter(r => !r.sold);
    const [sellQuantity, setSellQuantity] = useState<number | 'all'>(unsoldRobots.length > 0 ? unsoldRobots.length : 'all');
    
    return (
      <div className="space-y-4">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="text-green-400" size={24} />
            <div>
              <h3 className="text-white font-semibold">Sales Phase</h3>
              <p className="text-green-200 text-sm">
                {currentRound === 1 
                  ? 'Prove market demand with early customers'
                  : 'Expand sales and capture market share'
                }
              </p>
            </div>
          </div>

          {unsoldRobots.length > 0 ? (
            <>
              <div className="bg-green-600/20 rounded p-3 mb-4">
                <h4 className="text-white font-medium mb-2">Robot Inventory ({unsoldRobots.length} available):</h4>
                <div className="space-y-2">
                  {unsoldRobots.slice(0, 5).map((robot, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-green-100">{robot.type} Robot</span>
                      <span className="text-green-300">
                        {robot.components?.length || 0} components
                      </span>
                    </div>
                  ))}
                  {unsoldRobots.length > 5 && (
                    <div className="text-green-200 text-xs">
                      +{unsoldRobots.length - 5} more robots...
                    </div>
                  )}
                </div>
              </div>

              {/* Quantity Selection */}
              <div className="bg-green-700/20 rounded p-3 mb-4">
                <label className="text-white text-sm font-medium mb-2 block">
                  How many robots to sell?
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSellQuantity('all')}
                    className={`px-3 py-2 rounded transition-all ${
                      sellQuantity === 'all'
                        ? 'bg-green-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    Sell All ({unsoldRobots.length})
                  </button>
                  {unsoldRobots.length > 1 && (
                    <input
                      type="number"
                      min="1"
                      max={unsoldRobots.length}
                      value={sellQuantity === 'all' ? unsoldRobots.length : sellQuantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val > 0 && val <= unsoldRobots.length) {
                          setSellQuantity(val);
                        }
                      }}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded text-white w-24"
                    />
                  )}
                </div>
                <p className="text-green-200 text-xs mt-2">
                  Tip: You can keep robots in inventory for future rounds if market conditions improve
                </p>
              </div>

              <button
                onClick={() => {
                  onMakeMove({
                    action: 'sell_robots',
                    data: {
                      quantity: sellQuantity,
                      robotIds: sellQuantity === 'all' 
                        ? unsoldRobots.map(r => r.id)
                        : unsoldRobots.slice(0, sellQuantity as number).map(r => r.id)
                    }
                  });
                }}
                disabled={!canMakeMove}
                className={`w-full py-3 px-4 rounded font-semibold transition-all ${
                  canMakeMove
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Sell {sellQuantity === 'all' ? 'All' : sellQuantity} Robot{sellQuantity !== 1 ? 's' : ''}
              </button>

              <button
                onClick={() => onMakeMove({ action: 'skip_sales', data: { reason: 'keep_inventory' } })}
                disabled={!canMakeMove}
                className="w-full mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Skip Sales (Keep Inventory)
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <Factory className="text-gray-400 mx-auto mb-3" size={48} />
              <p className="text-gray-400 text-lg mb-2">No robots to sell</p>
              <p className="text-gray-500 text-sm">
                Build robots in the production phase to have inventory for sales
              </p>
              <button
                onClick={() => onMakeMove({ action: 'skip_sales', data: { reason: 'no_robots_to_sell' } })}
                disabled={!canMakeMove}
                className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Skip Sales Phase
              </button>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-100 text-sm">Need sales strategy help?</span>
            <button
              onClick={() => onRequestHelp('sales-strategy')}
              className="text-blue-400 hover:text-blue-300 text-sm underline"
            >
              Ask AI Tutor
            </button>
          </div>
        </div>
      </div>
    );
  };

  // NEW: Growth Phase - replaces investment phase
  const renderGrowthPhase = () => {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-pink-600 to-orange-600 p-4 rounded-lg">
          <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
            <BarChart3 size={20} />
            Growth Phase - {currentRound === 1 ? 'Build Foundation' : 'Scale Operations'}
          </h3>
          <p className="text-pink-100 mb-4">
            {currentRound === 1
              ? 'Invest in building your market presence and operational foundation.'
              : 'Scale your marketing efforts and expand your market reach.'
            }
          </p>
          
          <div className="bg-pink-600/30 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-pink-200">Available Cash:</span>
                <div className="text-pink-100 font-semibold">${player.cash.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-pink-200">Current Reputation:</span>
                <div className="text-pink-100 font-semibold">{player.reputation}/100</div>
              </div>
              <div>
                <span className="text-pink-200">Growth Focus:</span>
                <div className="text-pink-100 font-semibold">
                  {currentRound === 1 ? 'Foundation Building' : 'Market Expansion'}
                </div>
              </div>
              <div>
                <span className="text-pink-200">Market Position:</span>
                <div className="text-pink-100 font-semibold">
                  {player.reputation >= 70 ? 'Strong' : player.reputation >= 40 ? 'Moderate' : 'Developing'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowGrowthModal(true)}
              disabled={!canMakeMove}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                canMakeMove
                  ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              Choose Growth Strategy
            </button>
          </div>
        </div>

        <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg p-3">
          <h4 className="text-white font-medium mb-2">📈 Growth Strategy</h4>
          <ul className="text-pink-200 text-sm space-y-1">
            {currentRound === 1 ? (
              <>
                <li>• Build brand awareness and market recognition</li>
                <li>• Research customer needs to guide product development</li>
                <li>• Establish partnerships for future growth</li>
              </>
            ) : (
              <>
                <li>• Scale marketing efforts for broader reach</li>
                <li>• Enter new markets and customer segments</li>
                <li>• Form strategic partnerships for expansion</li>
              </>
            )}
          </ul>
        </div>
      </div>
    );
  };

  // Main component return
  return (
    <>
      <div className="bg-gray-800 rounded-lg shadow-xl p-6">
        {/* Phase Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white capitalize">{phase} Phase</h2>
            <p className="text-gray-400 mt-1">{phaseInfo.description}</p>
          </div>
          {isMyTurn && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded">
              <Zap className="text-green-400" size={16} />
              <span className="text-green-300 text-sm font-medium">Your Turn</span>
            </div>
          )}
        </div>

        {/* Phase Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {phase === 'bootstrap' && renderBootstrapPhase()}
            {phase === 'funding' && renderFundingPhase()}
            {phase === 'r&d' && renderRnDPhase()}
            {phase === 'production' && renderProductionPhase()}
            {phase === 'sales' && renderSalesPhase()}
            {phase === 'growth' && renderGrowthPhase()}
          </motion.div>
        </AnimatePresence>

        {/* Turn Indicator */}
        {!isMyTurn && (
          <div className="mt-6 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="text-gray-400" size={16} />
              <span className="text-gray-300 text-sm">Waiting for other players...</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FundingModal
        isOpen={showFundingModal}
        currentRound={currentRound}
        player={player}
        onSelectFunding={handleFundingSelection}
        onRequestHelp={onRequestHelp}
      />

      <GrowthPhaseModal
        isOpen={showGrowthModal}
        currentRound={currentRound}
        player={player}
        onSelectGrowth={handleGrowthSelection}
        onRequestHelp={onRequestHelp}
      />
    </>
  );
};

export default GamePhasePanel;