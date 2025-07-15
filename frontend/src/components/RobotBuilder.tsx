// frontend/src/components/RobotBuilder.tsx
// This component handles robot production and manufacturing decisions
// Like a factory control panel where you decide what to make

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, 
  Cog, 
  Zap, 
  DollarSign, 
  Plus, 
  Minus,
  AlertCircle,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Robot, gameHelpers } from '../store/GameStore';

interface RobotBuilderProps {
  robots: Robot[];
  cash: number;
  productionCapacity: number;
  robotsBuiltThisRound: number;
  onBuildRobot: (robotData: any) => void;
  onRequestHelp: () => void;
}

// Robot types with their characteristics
const ROBOT_TYPES = [
  {
    name: 'Humanoid',
    baseCost: 150000,
    description: 'Advanced human-like robots for service and interaction',
    marketDemand: 'High in service industries',
    complexity: 'High',
    profitMargin: 'High',
    color: 'bg-blue-500'
  },
  {
    name: 'Industrial',
    baseCost: 130000,
    description: 'Heavy-duty robots for manufacturing and automation',
    marketDemand: 'Steady demand from factories',
    complexity: 'Medium',
    profitMargin: 'Medium',
    color: 'bg-orange-500'
  },
  {
    name: 'Mobile',
    baseCost: 120000,
    description: 'Autonomous mobile platforms for logistics',
    marketDemand: 'Growing with e-commerce',
    complexity: 'Medium',
    profitMargin: 'Medium',
    color: 'bg-green-500'
  },
  {
    name: 'Service',
    baseCost: 110000,
    description: 'Customer service and hospitality robots',
    marketDemand: 'Emerging market potential',
    complexity: 'Low',
    profitMargin: 'Low-Medium',
    color: 'bg-purple-500'
  },
  {
    name: 'Medical',
    baseCost: 180000,
    description: 'Specialized healthcare assistance robots',
    marketDemand: 'High-value niche market',
    complexity: 'Very High',
    profitMargin: 'Very High',
    color: 'bg-red-500'
  }
];

// Available components that can be added to robots
const ROBOT_COMPONENTS = [
  {
    id: 'standard_motors',
    name: 'Standard Motors',
    cost: 25000,
    benefit: 'Basic movement and manipulation',
    required: true
  },
  {
    id: 'sensor_package',
    name: 'Advanced Sensors',
    cost: 30000,
    benefit: '+15% efficiency and safety rating'
  },
  {
    id: 'ai_processing',
    name: 'AI Processing Unit',
    cost: 40000,
    benefit: '+25% autonomous operation capability'
  },
  {
    id: 'battery',
    name: 'Extended Battery',
    cost: 35000,
    benefit: '+50% operational time between charges'
  },
  {
    id: 'precision_arms',
    name: 'Precision Actuators',
    cost: 45000,
    benefit: '+20% precision and dexterity'
  },
  {
    id: 'communication',
    name: 'Communication Module',
    cost: 20000,
    benefit: 'Network connectivity and remote monitoring'
  }
];

const RobotBuilder: React.FC<RobotBuilderProps> = ({
  robots,
  cash,
  productionCapacity,
  robotsBuiltThisRound,
  onBuildRobot,
  onRequestHelp
}) => {
  const [selectedRobotType, setSelectedRobotType] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedComponents, setSelectedComponents] = useState<string[]>(['standard_motors']);
  const [showComponentDetails, setShowComponentDetails] = useState(false);

  // Calculate costs
  const selectedType = ROBOT_TYPES.find(type => type.name === selectedRobotType);
  const componentCost = selectedComponents.reduce((total, compId) => {
    const component = ROBOT_COMPONENTS.find(c => c.id === compId);
    return total + (component?.cost || 0);
  }, 0);
  const totalCostPerRobot = (selectedType?.baseCost || 0) + componentCost;
  const totalCost = totalCostPerRobot * quantity;

  // Check constraints
  const remainingCapacity = productionCapacity - robotsBuiltThisRound;
  const canAfford = cash >= totalCost;
  const withinCapacity = quantity <= remainingCapacity;
  const canBuild = canAfford && withinCapacity && selectedType && quantity > 0;

  // Handle component selection
  const toggleComponent = (componentId: string) => {
    const component = ROBOT_COMPONENTS.find(c => c.id === componentId);
    if (component?.required) return; // Can't remove required components

    if (selectedComponents.includes(componentId)) {
      setSelectedComponents(selectedComponents.filter(id => id !== componentId));
    } else {
      setSelectedComponents([...selectedComponents, componentId]);
    }
  };

  // Handle building robots
  const handleBuildRobots = () => {
    if (!canBuild || !selectedType) return;

    onBuildRobot({
      robotType: selectedType.name,
      quantity,
      components: selectedComponents
    });

    // Reset form after building
    setSelectedRobotType('');
    setQuantity(1);
    setSelectedComponents(['standard_motors']);
  };

  // Get robot inventory summary
  const robotInventory = robots.reduce((acc, robot) => {
    const key = robot.sold ? 'sold' : 'available';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Current Inventory */}
      <div className="bg-white/5 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-white font-medium flex items-center gap-2">
            <Factory size={16} />
            Production Status
          </h4>
          <button
            onClick={onRequestHelp}
            className="text-blue-400 hover:text-blue-300"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-300">Available:</span>
            <span className="text-green-400">{robotInventory.available || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Sold:</span>
            <span className="text-blue-400">{robotInventory.sold || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Capacity:</span>
            <span className="text-orange-400">{robotsBuiltThisRound}/{productionCapacity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Cash:</span>
            <span className="text-green-400">{gameHelpers.formatCurrency(cash)}</span>
          </div>
        </div>
      </div>

      {remainingCapacity > 0 ? (
        <>
          {/* Robot Type Selection */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Select Robot Type:
            </label>
            <div className="space-y-2">
              {ROBOT_TYPES.map((robotType) => (
                <motion.button
                  key={robotType.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRobotType(robotType.name)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedRobotType === robotType.name
                      ? 'bg-blue-500/20 border-blue-500/50 text-white'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${robotType.color}`} />
                        <span className="font-medium">{robotType.name}</span>
                        <span className="text-xs bg-gray-500/30 px-1.5 py-0.5 rounded">
                          {robotType.complexity}
                        </span>
                      </div>
                      <p className="text-xs opacity-75 mb-1">{robotType.description}</p>
                      <p className="text-xs text-blue-300">{robotType.marketDemand}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-400">
                        ${robotType.baseCost.toLocaleString()}
                      </div>
                      <div className="text-xs opacity-75">{robotType.profitMargin}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {selectedType && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Quantity Selection */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Quantity ({remainingCapacity} capacity remaining):
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-2 bg-white/10 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={16} className="text-white" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={remainingCapacity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(remainingCapacity, parseInt(e.target.value) || 1)))}
                    className="w-20 p-2 bg-white/10 border border-white/20 rounded text-white text-center"
                  />
                  <button
                    onClick={() => setQuantity(Math.min(remainingCapacity, quantity + 1))}
                    disabled={quantity >= remainingCapacity}
                    className="p-2 bg-white/10 rounded hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Component Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white text-sm font-medium">
                    Components & Upgrades:
                  </label>
                  <button
                    onClick={() => setShowComponentDetails(!showComponentDetails)}
                    className="text-blue-400 text-xs hover:text-blue-300"
                  >
                    {showComponentDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>
                
                <div className="space-y-2">
                  {ROBOT_COMPONENTS.map((component) => (
                    <div key={component.id} className="bg-white/5 rounded p-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedComponents.includes(component.id)}
                          onChange={() => toggleComponent(component.id)}
                          disabled={component.required}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">
                              {component.name}
                              {component.required && (
                                <span className="text-xs text-gray-400 ml-1">(Required)</span>
                              )}
                            </span>
                            <span className="text-green-400 text-sm">
                              +${component.cost.toLocaleString()}
                            </span>
                          </div>
                          {showComponentDetails && (
                            <p className="text-xs text-gray-300 mt-1">
                              {component.benefit}
                            </p>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  <DollarSign size={16} />
                  Cost Breakdown
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-100">Base Cost ({quantity}x):</span>
                    <span className="text-white">${(selectedType.baseCost * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Components ({quantity}x):</span>
                    <span className="text-white">${(componentCost * quantity).toLocaleString()}</span>
                  </div>
                  <div className="border-t border-blue-500/30 pt-1 flex justify-between font-semibold">
                    <span className="text-blue-100">Total Cost:</span>
                    <span className="text-white">${totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-100">Your Cash:</span>
                    <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                      ${cash.toLocaleString()}
                    </span>
                  </div>
                  {totalCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-100">Remaining:</span>
                      <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                        ${(cash - totalCost).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Messages */}
              {!canAfford && totalCost > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <AlertCircle className="text-red-400" size={16} />
                  <span className="text-red-300 text-sm">
                    Insufficient funds. Need ${(totalCost - cash).toLocaleString()} more.
                  </span>
                </div>
              )}

              {!withinCapacity && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                  <AlertCircle className="text-yellow-400" size={16} />
                  <span className="text-yellow-300 text-sm">
                    Exceeds production capacity. Can only build {remainingCapacity} more robot(s) this round.
                  </span>
                </div>
              )}

              {/* Build Button */}
              <button
                onClick={handleBuildRobots}
                disabled={!canBuild}
                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
                  canBuild
                    ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                {canBuild ? (
                  <>
                    <Factory size={18} />
                    Build {quantity} {selectedType.name} Robot{quantity > 1 ? 's' : ''}
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    Cannot Build
                  </>
                )}
              </button>
            </motion.div>
          )}
        </>
      ) : (
        // At capacity
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Factory className="text-orange-600" size={32} />
          </div>
          <h4 className="text-white font-medium mb-2">Production Capacity Reached</h4>
          <p className="text-gray-400 text-sm mb-4">
            You've built {robotsBuiltThisRound} of {productionCapacity} robots this round.
          </p>
          <p className="text-gray-300 text-xs">
            💡 Tip: Invest in production technology to increase capacity next round!
          </p>
        </div>
      )}

      {/* Production Tips */}
      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="text-purple-400" size={16} />
          <span className="text-white text-sm font-medium">Production Strategy Tips</span>
        </div>
        <div className="space-y-1 text-xs text-purple-200">
          <div>• Higher-end robots have better profit margins but cost more</div>
          <div>• Add components to increase robot value and market appeal</div>
          <div>• Balance quantity vs quality based on market demand</div>
          <div>• Save some production capacity for rush orders</div>
        </div>
      </div>
    </div>
  );
};

export default RobotBuilder;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This RobotBuilder component is like a factory control panel where students
 * make production decisions. Here's what each part does:
 * 
 * 1. PRODUCTION STATUS:
 *    - Shows current robot inventory (available vs sold)
 *    - Displays production capacity usage
 *    - Shows available cash for manufacturing
 * 
 * 2. ROBOT TYPE SELECTION:
 *    - Different robot types with varying costs and complexity
 *    - Market demand information for each type
 *    - Profit margin indicators to guide decisions
 * 
 * 3. QUANTITY CONTROLS:
 *    - Adjustable quantity with capacity constraints
 *    - Visual controls to increase/decrease production
 *    - Real-time validation of production limits
 * 
 * 4. COMPONENT UPGRADES:
 *    - Optional components to enhance robot capabilities
 *    - Required vs optional component distinction
 *    - Cost-benefit information for each upgrade
 * 
 * 5. COST BREAKDOWN:
 *    - Transparent pricing showing base cost + components
 *    - Total cost calculation with affordability check
 *    - Remaining cash after purchase preview
 * 
 * 6. VALIDATION & FEEDBACK:
 *    - Real-time error messages for invalid configurations
 *    - Clear indicators when production isn't possible
 *    - Helpful tips for production strategy
 * 
 * BUSINESS CONCEPTS TAUGHT:
 * - Production planning and capacity management
 * - Cost-benefit analysis of product features
 * - Quality vs quantity trade-offs
 * - Market positioning (premium vs budget products)
 * - Resource allocation and cash flow management
 * 
 * This helps students understand how manufacturing companies make decisions
 * about what to produce, how much to make, and what features to include.
 */