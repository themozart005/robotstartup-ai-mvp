// frontend/src/components/RobotBuilder.tsx
// ENHANCED VERSION - With robot type images and visual improvements

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, 
  Plus, 
  Minus, 
  DollarSign, 
  Zap, 
  Info,
  Star,
  Truck,
  Wrench,
  Users,
  Heart,
  Smartphone
} from 'lucide-react';
import { Robot } from '../store/GameStore';

interface RobotBuilderProps {
  robots: Robot[];
  cash: number;
  productionCapacity?: number;
  robotsBuiltThisRound?: number;
  onBuildRobot: (robotData: any) => void;
  onRequestHelp: () => void;
}

// Robot type data with images and detailed info
const ROBOT_TYPES = {
  service: {
    name: 'Service Robot',
    icon: '🤖',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop&crop=center',
    fallbackColor: 'from-blue-500 to-cyan-500',
    description: 'Customer service and hospitality robots',
    baseCost: 100000,
    marketDemand: 'High',
    applications: ['Reception', 'Customer Support', 'Cleaning'],
    complexity: 'Basic',
    leadTime: '2 weeks',
    components: {
      'Standard Motors': 25000,
      'Basic Sensors': 20000,
      'AI Processing Unit': 40000,
      'High-Capacity Battery': 35000
    }
  },
  mobile: {
    name: 'Mobile Robot',
    icon: '🚛',
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop&crop=center',
    fallbackColor: 'from-orange-500 to-red-500',
    description: 'Autonomous delivery and transportation',
    baseCost: 120000,
    marketDemand: 'Very High',
    applications: ['Delivery', 'Warehouse', 'Transport'],
    complexity: 'Medium',
    leadTime: '3 weeks',
    components: {
      'Standard Motors': 25000,
      'Sensor Package': 30000,
      'AI Processing Unit': 40000,
      'High-Capacity Battery': 35000
    }
  },
  industrial: {
    name: 'Industrial Robot',
    icon: '🏭',
    image: 'https://images.unsplash.com/photo-1565192727964-6a5b8c5b0a5a?w=400&h=300&fit=crop&crop=center',
    fallbackColor: 'from-gray-600 to-gray-800',
    description: 'Heavy-duty manufacturing and automation',
    baseCost: 150000,
    marketDemand: 'High',
    applications: ['Manufacturing', 'Assembly', 'Welding'],
    complexity: 'High',
    leadTime: '4 weeks',
    components: {
      'Standard Motors': 25000,
      'Sensor Package': 30000,
      'AI Processing Unit': 40000,
      'High-Capacity Battery': 35000
    }
  },
  humanoid: {
    name: 'Humanoid Robot',
    icon: '🦾',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&h=300&fit=crop&crop=center',
    fallbackColor: 'from-purple-500 to-indigo-500',
    description: 'Advanced human-like interaction robots',
    baseCost: 200000,
    marketDemand: 'Medium',
    applications: ['Healthcare', 'Education', 'Companion'],
    complexity: 'Very High',
    leadTime: '6 weeks',
    components: {
      'Standard Motors': 25000,
      'Sensor Package': 30000,
      'AI Processing Unit': 40000,
      'High-Capacity Battery': 35000
    }
  },
  medical: {
    name: 'Medical Robot',
    icon: '🏥',
    image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop&crop=center',
    fallbackColor: 'from-green-500 to-teal-500',
    description: 'Precision healthcare and surgical assistance',
    baseCost: 250000,
    marketDemand: 'High',
    applications: ['Surgery', 'Patient Care', 'Diagnostics'],
    complexity: 'Extremely High',
    leadTime: '8 weeks',
    components: {
      'Standard Motors': 25000,
      'Sensor Package': 30000,
      'AI Processing Unit': 40000,
      'High-Capacity Battery': 35000
    }
  }
};

const RobotBuilder: React.FC<RobotBuilderProps> = ({
  robots,
  cash,
  productionCapacity = 3,
  robotsBuiltThisRound = 0,
  onBuildRobot,
  onRequestHelp
}) => {
  const [selectedRobotType, setSelectedRobotType] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const robotTypes = Object.keys(ROBOT_TYPES) as Array<keyof typeof ROBOT_TYPES>;
  const availableCapacity = productionCapacity - robotsBuiltThisRound;

  // Helper function to calculate component cost
  const calculateComponentCost = () => {
    if (!selectedRobotType) return 0;
    
    const robotData = ROBOT_TYPES[selectedRobotType as keyof typeof ROBOT_TYPES];
    return selectedComponents.reduce((sum, component) => {
      const cost = robotData.components[component as keyof typeof robotData.components];
      return sum + (cost || 0);
    }, 0);
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    if (!selectedRobotType) return 0;
    
    const robotData = ROBOT_TYPES[selectedRobotType as keyof typeof ROBOT_TYPES];
    const baseCost = robotData.baseCost;
    const componentCost = calculateComponentCost();
    
    return (baseCost + componentCost) * quantity;
  };

  const totalCost = calculateTotalCost();
  const canAfford = cash >= totalCost;
  const canBuild = availableCapacity >= quantity && canAfford;

  // Handle robot selection
  const handleRobotSelect = (robotType: string) => {
    setSelectedRobotType(robotType);
    setSelectedComponents([]);
    setQuantity(1);
  };

  // Handle component toggle
  const toggleComponent = (component: string) => {
    setSelectedComponents(prev => 
      prev.includes(component) 
        ? prev.filter(c => c !== component)
        : [...prev, component]
    );
  };

  // Handle quantity change
  const adjustQuantity = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(availableCapacity, quantity + delta));
    setQuantity(newQuantity);
  };

  // Handle build robot
  const handleBuild = () => {
    if (!selectedRobotType || !canBuild) return;
    
    onBuildRobot({
      robotType: selectedRobotType,
      quantity: quantity,
      components: selectedComponents
    });
    
    // Reset form
    setSelectedRobotType(null);
    setQuantity(1);
    setSelectedComponents([]);
  };

  // Robot image component with fallback
  const RobotImage: React.FC<{ robotType: keyof typeof ROBOT_TYPES; size?: 'small' | 'large' }> = ({ 
    robotType, 
    size = 'small' 
  }) => {
    const robot = ROBOT_TYPES[robotType];
    const [imageError, setImageError] = useState(false);

    if (imageError) {
      // Fallback to gradient background with icon
      return (
        <div className={`
          ${size === 'small' ? 'w-16 h-16' : 'w-32 h-32'} 
          bg-gradient-to-br ${robot.fallbackColor} 
          rounded-lg flex items-center justify-center
        `}>
          <span className={`${size === 'small' ? 'text-2xl' : 'text-4xl'}`}>
            {robot.icon}
          </span>
        </div>
      );
    }

    return (
      <img
        src={robot.image}
        alt={robot.name}
        className={`
          ${size === 'small' ? 'w-16 h-16' : 'w-32 h-32'} 
          object-cover rounded-lg shadow-md
        `}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Factory className="text-blue-400" size={20} />
          <span className="text-white font-semibold">Robot Production</span>
        </div>
        <div className="text-right text-sm">
          <div className="text-gray-300">
            Capacity: {robotsBuiltThisRound}/{productionCapacity}
          </div>
          <div className="text-green-400">
            Available: {availableCapacity}
          </div>
        </div>
      </div>

      {/* Robot Type Selection */}
      <div className="space-y-3">
        <h4 className="text-white font-medium">Select Robot Type:</h4>
        <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
          {robotTypes.map(robotType => {
            const robot = ROBOT_TYPES[robotType];
            const isSelected = selectedRobotType === robotType;
            const isAffordable = cash >= robot.baseCost;
            
            return (
              <motion.div
                key={robotType}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => isAffordable && handleRobotSelect(robotType)}
                className={`
                  p-3 rounded-lg border-2 cursor-pointer transition-all relative
                  ${isSelected 
                    ? 'border-blue-500 bg-blue-500/20' 
                    : isAffordable 
                    ? 'border-gray-600 bg-white/5 hover:border-gray-500' 
                    : 'border-gray-700 bg-gray-800/50 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Robot Image */}
                  <RobotImage robotType={robotType} size="small" />
                  
                  {/* Robot Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-white font-semibold truncate">
                        {robot.name}
                      </h5>
                      <div className="text-right">
                        <div className={`font-semibold ${isAffordable ? 'text-green-400' : 'text-red-400'}`}>
                          ${robot.baseCost.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">base cost</div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mt-1 truncate">
                      {robot.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-1 rounded ${
                          robot.marketDemand === 'Very High' ? 'bg-green-500/20 text-green-400' :
                          robot.marketDemand === 'High' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {robot.marketDemand} Demand
                        </span>
                        <span className="text-gray-400">{robot.complexity}</span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails(showDetails === robotType ? null : robotType);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detailed View */}
                <AnimatePresence>
                  {showDetails === robotType && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-gray-600"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {/* Large Image */}
                        <div className="flex justify-center">
                          <RobotImage robotType={robotType} size="large" />
                        </div>
                        
                        {/* Details */}
                        <div className="space-y-3">
                          <div>
                            <h6 className="text-white font-medium mb-1">Applications:</h6>
                            <div className="flex flex-wrap gap-1">
                              {robot.applications.map(app => (
                                <span key={app} className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                  {app}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Lead Time:</span>
                              <span className="text-white">{robot.leadTime}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Complexity:</span>
                              <span className="text-white">{robot.complexity}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Configuration Panel */}
      {selectedRobotType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 rounded-lg p-4 border border-gray-600"
        >
          <h4 className="text-white font-medium mb-3">
            Configure {ROBOT_TYPES[selectedRobotType as keyof typeof ROBOT_TYPES].name}
          </h4>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-300">Quantity:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustQuantity(-1)}
                disabled={quantity <= 1}
                className="p-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus size={16} className="text-white" />
              </button>
              <span className="text-white font-semibold w-8 text-center">{quantity}</span>
              <button
                onClick={() => adjustQuantity(1)}
                disabled={quantity >= availableCapacity}
                className="p-1 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Optional Components */}
          <div className="mb-4">
            <h5 className="text-gray-300 mb-2">Optional Components:</h5>
            <div className="space-y-2">
              {Object.entries(ROBOT_TYPES[selectedRobotType as keyof typeof ROBOT_TYPES].components).map(([component, cost]) => (
                <div key={component} className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedComponents.includes(component)}
                      onChange={() => toggleComponent(component)}
                      className="rounded"
                    />
                    <span className="text-gray-300 text-sm">{component}</span>
                  </label>
                  <span className="text-green-400 text-sm">+${cost.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-gray-900/50 rounded p-3 mb-4">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-400">Base Cost ({quantity}x):</span>
              <span className="text-white">
                ${(ROBOT_TYPES[selectedRobotType as keyof typeof ROBOT_TYPES].baseCost * quantity).toLocaleString()}
              </span>
            </div>
            {selectedComponents.length > 0 && (
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">Components ({quantity}x):</span>
                <span className="text-white">
                  ${(calculateComponentCost() * quantity).toLocaleString()}
                </span>
              </div>
            )}
            <div className="border-t border-gray-600 pt-2 flex justify-between items-center font-semibold">
              <span className="text-white">Total Cost:</span>
              <span className={canAfford ? 'text-green-400' : 'text-red-400'}>
                ${totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Build Button */}
          <div className="flex gap-2">
            <button
              onClick={handleBuild}
              disabled={!canBuild}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                canBuild
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {!canAfford ? `Need ${(totalCost - cash).toLocaleString()} more` :
               availableCapacity < quantity ? `Need ${quantity - availableCapacity} more capacity` :
               'Build Robots'}
            </button>
            
            <button
              onClick={onRequestHelp}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <Info size={16} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Current Inventory */}
      {robots.length > 0 && (
        <div className="bg-gray-800/30 rounded-lg p-3">
          <h5 className="text-gray-300 mb-2">Current Inventory:</h5>
          <div className="text-sm space-y-1">
            {Object.entries(
              robots.reduce((acc, robot) => {
                const type = robot.type;
                acc[type] = (acc[type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="text-gray-400 capitalize">{type} Robots:</span>
                <span className="text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RobotBuilder;