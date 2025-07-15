// frontend/src/components/MarketConditions.tsx
// This displays current market conditions and trends
// Like a stock ticker or business news feed that affects game strategy

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  Info,
  BarChart3,
  Zap,
  Globe
} from 'lucide-react';
import { MarketConditions as MarketConditionsType } from '../store/GameStore';

interface MarketConditionsProps {
  conditions: MarketConditionsType;
  onRequestAnalysis: () => void;
}

const MarketConditions: React.FC<MarketConditionsProps> = ({
  conditions,
  onRequestAnalysis
}) => {
  // Get demand level styling
  const getDemandStyling = (demand: string) => {
    switch (demand) {
      case 'high':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          icon: TrendingUp
        };
      case 'low':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          icon: TrendingDown
        };
      default: // medium
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          icon: Activity
        };
    }
  };

  // Get volatility level styling
  const getVolatilityStyling = (volatility: number) => {
    if (volatility >= 0.7) {
      return { color: 'text-red-400', label: 'Very High', description: 'Expect major swings' };
    } else if (volatility >= 0.5) {
      return { color: 'text-orange-400', label: 'High', description: 'Significant changes likely' };
    } else if (volatility >= 0.3) {
      return { color: 'text-yellow-400', label: 'Moderate', description: 'Some fluctuation expected' };
    } else {
      return { color: 'text-green-400', label: 'Low', description: 'Stable conditions' };
    }
  };

  const demandStyling = getDemandStyling(conditions.demand);
  const volatilityStyling = getVolatilityStyling(conditions.volatility);
  const DemandIcon = demandStyling.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="text-blue-400" size={18} />
          <h3 className="text-white font-semibold">Market Conditions</h3>
        </div>
        <button
          onClick={onRequestAnalysis}
          className="text-blue-400 hover:text-blue-300 text-sm underline"
        >
          Get Analysis
        </button>
      </div>

      {/* Market Demand */}
      <div className={`${demandStyling.bgColor} ${demandStyling.borderColor} border rounded-lg p-3 mb-3`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <DemandIcon className={demandStyling.color} size={18} />
            <span className="text-white font-medium">Market Demand</span>
          </div>
          <span className={`font-bold capitalize ${demandStyling.color}`}>
            {conditions.demand}
          </span>
        </div>
        <p className="text-sm text-gray-300">
          {conditions.demand === 'high' 
            ? 'Strong customer interest - premium pricing opportunities'
            : conditions.demand === 'low'
            ? 'Slow market - focus on cost efficiency and innovation'
            : 'Steady market conditions - balanced approach recommended'
          }
        </p>
      </div>

      {/* Market Volatility */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="text-orange-400" size={16} />
            <span className="text-white text-sm font-medium">Volatility</span>
          </div>
          <span className={`text-sm font-semibold ${volatilityStyling.color}`}>
            {volatilityStyling.label}
          </span>
        </div>
        
        {/* Volatility Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${conditions.volatility * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              conditions.volatility >= 0.7 ? 'bg-red-400' :
              conditions.volatility >= 0.5 ? 'bg-orange-400' :
              conditions.volatility >= 0.3 ? 'bg-yellow-400' : 'bg-green-400'
            }`}
          />
        </div>
        
        <p className="text-xs text-gray-400">{volatilityStyling.description}</p>
      </div>

      {/* Market Trends */}
      {conditions.trends.length > 0 && (
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-purple-400" size={16} />
            <span className="text-white text-sm font-medium">Active Trends</span>
          </div>
          <div className="space-y-1">
            {conditions.trends.map((trend, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                <span className="text-purple-200 text-sm capitalize">
                  {trend.replace('-', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Modifiers */}
      {conditions.eventModifiers.length > 0 && (
        <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-yellow-400" size={16} />
            <span className="text-white text-sm font-medium">Active Events</span>
          </div>
          <div className="space-y-1">
            {conditions.eventModifiers.map((modifier, index) => (
              <div key={index} className="text-yellow-200 text-sm">
                {modifier.description || `Event ${index + 1} active`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Tips */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Info className="text-blue-400" size={16} />
          <span className="text-white text-sm font-medium">Market Insight</span>
        </div>
        <p className="text-blue-200 text-sm">
          {getMarketInsight(conditions)}
        </p>
      </div>
    </motion.div>
  );
};

// Helper function to generate market insights
const getMarketInsight = (conditions: MarketConditionsType): string => {
  const { demand, volatility, trends } = conditions;
  
  // Generate insight based on current conditions
  if (demand === 'high' && volatility < 0.3) {
    return "Ideal conditions for aggressive expansion and premium pricing strategies.";
  } else if (demand === 'low' && volatility > 0.6) {
    return "Challenging market - focus on cost control and wait for stabilization.";
  } else if (volatility > 0.7) {
    return "High volatility detected - consider defensive strategies and cash preservation.";
  } else if (trends.includes('automation-growth')) {
    return "Automation trend growing - industrial robots may see increased demand.";
  } else if (trends.includes('ai-advancement')) {
    return "AI advancement trend - invest in smart robot technologies for competitive advantage.";
  } else if (demand === 'high') {
    return "Strong demand present - good time to maximize production and capture market share.";
  } else if (demand === 'low') {
    return "Soft demand conditions - focus on innovation and efficiency improvements.";
  } else {
    return "Balanced market conditions - maintain steady operations while watching for opportunities.";
  }
};

export default MarketConditions;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This MarketConditions component is like a business news ticker or economic
 * dashboard that shows the current state of the market. Here's what it displays:
 * 
 * 1. MARKET DEMAND:
 *    - Shows if customers want lots of robots (high), some robots (medium), or few robots (low)
 *    - Like checking if there's a lot of people shopping or if stores are empty
 *    - Affects how much money you can make selling robots
 * 
 * 2. MARKET VOLATILITY:
 *    - Shows how much conditions are changing
 *    - High volatility = lots of unpredictable changes
 *    - Low volatility = stable, predictable conditions
 *    - Like weather forecast - stormy vs calm
 * 
 * 3. MARKET TRENDS:
 *    - Shows what's popular or growing in the industry
 *    - Examples: "automation-growth" means more companies want automated solutions
 *    - Like fashion trends but for business technology
 * 
 * 4. ACTIVE EVENTS:
 *    - Special circumstances affecting the market
 *    - Could be supply shortages, new regulations, or breakthrough technologies
 *    - Like news events that affect business
 * 
 * 5. MARKET INSIGHTS:
 *    - AI-generated advice based on current conditions
 *    - Suggests strategies like "focus on cost control" or "time for expansion"
 *    - Like having a business advisor giving recommendations
 * 
 * KEY FEATURES:
 * - Color-coded indicators (green = good, red = challenging, yellow = caution)
 * - Visual bars and animations to show levels
 * - Click for detailed AI analysis
 * - Updates in real-time as market conditions change
 * 
 * This teaches students to consider external factors when making business decisions,
 * just like real companies must watch economic conditions and market trends.
 */