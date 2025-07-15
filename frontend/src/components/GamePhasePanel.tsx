// frontend/src/components/GamePhasePanel.tsx
// COMPLETE FIXED VERSION - All phases with proper event handling

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
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Player, GameSettings } from '../store/GameStore';

interface GamePhasePanelProps {
  phase: 'startup' | 'r&d' | 'production' | 'sales' | 'investment';
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
  onMakeMove,
  onRequestHelp,
  selectedAction,
  onSelectAction
}) => {
  const [actionData, setActionData] = useState<any>({});

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

  // Startup Phase: Collect income and plan
  const renderStartupPhase = () => (
    <div className="space-y-4">
      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="text-green-400" size={24} />
          <div>
            <h3 className="text-white font-semibold">Round Income</h3>
            <p className="text-green-200 text-sm">Collect your $50,000 round income</p>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.preventDefault();
            onMakeMove({
              action: 'collect_income',
              data: {}
            });
          }}
          disabled={!canMakeMove}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
            canMakeMove
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
          }`}
        >
          {selectedAction === 'collect_income' ? 'Confirm Collection' : 'Collect Income'}
        </button>
        
        {selectedAction === 'collect_income' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-green-600/20 rounded border border-green-500/30"
          >
            <div className="flex justify-between items-center">
              <span className="text-green-100">Income to collect:</span>
              <span className="text-green-100 font-bold">$50,000</span>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                onMakeMove({
                  action: 'collect_income',
                  data: {}
                });
              }}
              className="w-full mt-2 bg-green-700 hover:bg-green-800 text-white py-2 rounded transition-colors"
            >
              Confirm & Continue
            </button>
          </motion.div>
        )}
      </div>

      {/* Strategy Planning */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2">Strategy Planning</h3>
        <p className="text-blue-200 text-sm mb-3">
          Use this time to plan your moves for this round
        </p>
        <button
          onClick={() => onRequestHelp('strategic-planning')}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          <HelpCircle size={16} />
          Get Strategy Tips
        </button>
      </div>
    </div>
  );

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
              <p className="text-purple-200 text-sm">Invest in new technologies</p>
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
              onClick={(e) => {
                e.preventDefault();
                if (selectedTech) {
                  onMakeMove({
                    action: 'invest_r&d',
                    data: {
                      technology: selectedTech
                    }
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
              onClick={(e) => {
                e.preventDefault();
                onMakeMove({
                  action: 'skip_r&d',
                  data: {
                    reason: 'player_choice'
                  }
                });
              }}
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
                Build robots for market demand ({player.robotsBuiltThisRound}/{maxProduction} used)
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
              onClick={(e) => {
                e.preventDefault();
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
              onClick={(e) => {
                e.preventDefault();
                onMakeMove({
                  action: 'skip_production',
                  data: {
                    reason: 'player_choice'
                  }
                });
              }}
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

  // Sales Phase: Sell robots - FIXED VERSION
  const renderSalesPhase = () => {
    const unsoldRobots = player.robots.filter(r => !r.sold);
    
    return (
      <div className="space-y-4">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="text-green-400" size={24} />
            <div>
              <h3 className="text-white font-semibold">Sales Phase</h3>
              <p className="text-green-200 text-sm">Sell your robots to customers</p>
            </div>
          </div>

          {unsoldRobots.length > 0 ? (
            <>
              <div className="bg-green-600/20 rounded p-3 mb-4">
                <h4 className="text-white font-medium mb-2">Available Robots ({unsoldRobots.length}):</h4>
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

              <button
                onClick={(e) => {
                  e.preventDefault();
                  onMakeMove({
                    action: 'sell_robots',
                    data: {
                      robotIds: unsoldRobots.map(r => r.id)
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
                Sell All Robots
              </button>

              {selectedAction === 'sell_robots' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-3 bg-green-700/30 rounded border border-green-500/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-green-400" size={16} />
                    <span className="text-white font-semibold">Market Sales</span>
                  </div>
                  <p className="text-green-100 text-sm mb-3">
                    Sales prices depend on current market demand and your robot quality.
                  </p>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onMakeMove({
                        action: 'sell_robots',
                        data: {
                          robotIds: unsoldRobots.map(r => r.id)
                        }
                      });
                    }}
                    className="w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded transition-colors"
                  >
                    Complete Sales
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Factory className="text-gray-400 mx-auto mb-3" size={48} />
              <p className="text-gray-400 text-lg mb-2">No robots to sell</p>
              <p className="text-gray-500 text-sm">
                Build robots in the production phase to have inventory for sales
              </p>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onMakeMove({
                    action: 'skip_sales',
                    data: {
                      reason: 'no_robots_to_sell'
                    }
                  });
                }}
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

  // Investment Phase: Manage finances
  const renderInvestmentPhase = () => (
    <div className="space-y-4">
      <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="text-indigo-400" size={24} />
          <div>
            <h3 className="text-white font-semibold">Investment Phase</h3>
            <p className="text-indigo-200 text-sm">Manage your finances and seek funding</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              onMakeMove({
                action: 'take_loan',
                data: {
                  amount: 100000
                }
              });
            }}
            disabled={!canMakeMove}
            className={`w-full p-3 rounded border text-left transition-all ${
              selectedAction === 'take_loan'
                ? 'bg-indigo-600/30 border-indigo-500/50 text-white'
                : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Take Business Loan</div>
                <div className="text-sm opacity-75">Get $100,000 with 10% interest</div>
              </div>
              <CreditCard size={20} />
            </div>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              onMakeMove({
                action: 'skip_investment',
                data: {
                  reason: 'player_choice'
                }
              });
            }}
            disabled={!canMakeMove}
            className="w-full p-3 rounded border text-left bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 transition-all"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium">Skip Investment</div>
                <div className="text-sm opacity-75">Continue with current funds</div>
              </div>
              <CheckCircle size={20} />
            </div>
          </button>
        </div>

        {selectedAction === 'take_loan' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 bg-indigo-700/30 rounded border border-indigo-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-yellow-400" size={16} />
              <span className="text-white font-semibold">Loan Terms</span>
            </div>
            <div className="text-indigo-100 text-sm space-y-1 mb-3">
              <div>Amount: $100,000</div>
              <div>Interest Rate: 10% per round</div>
              <div>Must be repaid within 5 rounds</div>
            </div>
            <button
              onClick={(e) => {
                e.preventDefault();
                onMakeMove({
                  action: 'take_loan',
                  data: {
                    amount: 100000
                  }
                });
              }}
              className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-2 rounded transition-colors"
            >
              Accept Loan Terms
            </button>
          </motion.div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-blue-100 text-sm">Need financial planning help?</span>
          <button
            onClick={() => onRequestHelp('financial-planning')}
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            Ask AI Tutor
          </button>
        </div>
      </div>
    </div>
  );

  // Render different content based on current phase
  const renderPhaseContent = () => {
    switch (phase) {
      case 'startup':
        return renderStartupPhase();
      case 'r&d':
        return renderRnDPhase();
      case 'production':
        return renderProductionPhase();
      case 'sales':
        return renderSalesPhase();
      case 'investment':
        return renderInvestmentPhase();
      default:
        return <div>Unknown phase</div>;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 p-6">
      {/* Phase Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white capitalize">{phase} Phase</h2>
          <p className="text-gray-300 text-sm mt-1">{phaseInfo.description}</p>
        </div>
        
        {isMyTurn && (
          <div className="flex items-center gap-2 text-green-400">
            <Clock size={16} />
            <span className="text-sm font-medium">Your Turn</span>
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
          {renderPhaseContent()}
        </motion.div>
      </AnimatePresence>

      {/* Turn Status */}
      {!isMyTurn && (
        <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-200">
            <Clock size={16} />
            <span className="text-sm">Waiting for other players to complete their moves...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GamePhasePanel;