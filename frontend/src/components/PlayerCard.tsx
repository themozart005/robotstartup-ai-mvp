// frontend/src/components/PlayerCard.tsx
// This shows information about each player in the game
// Like player cards or scorecards that show everyone's status

import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bot, 
  Crown, 
  DollarSign, 
  Factory, 
  Cog, 
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Player, gameHelpers } from '../store/gameStore';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean; // Is it this player's turn?
  isMe: boolean; // Is this the current user?
  showDetailedInfo?: boolean; // Show extra details for own card
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isCurrentPlayer,
  isMe,
  showDetailedInfo = false
}) => {
  // Calculate player metrics
  const netWorth = gameHelpers.calculatePlayerNetWorth(player);
  const totalDebt = gameHelpers.calculatePlayerDebt(player);
  const riskLevel = gameHelpers.getRiskLevel(player);
  const unsoldRobots = player.robots.filter(r => !r.sold).length;

  // Get risk level color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get player type icon
  const PlayerIcon = player.type === 'ai' ? Bot : User;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-lg border transition-all duration-300 ${
        isCurrentPlayer
          ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
          : isMe
          ? 'bg-green-500/20 border-green-500/50'
          : 'bg-white/10 border-white/20'
      }`}
    >
      {/* Turn Indicator */}
      {isCurrentPlayer && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-3 h-3 border-2 border-white border-t-transparent rounded-full"
          />
        </motion.div>
      )}

      {/* Me Indicator */}
      {isMe && !isCurrentPlayer && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <User size={12} className="text-white" />
        </div>
      )}

      <div className="p-4">
        {/* Player Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${
            player.type === 'ai' 
              ? 'bg-purple-500/20 text-purple-400' 
              : 'bg-blue-500/20 text-blue-400'
          }`}>
            <PlayerIcon size={18} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold truncate ${
                isMe ? 'text-green-100' : 'text-white'
              }`}>
                {player.name}
                {isMe && <span className="text-green-400 text-sm ml-1">(You)</span>}
              </h3>
              {player.type === 'ai' && (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                  AI
                </span>
              )}
            </div>
            
            {player.businessModel && (
              <p className="text-xs text-gray-300 truncate">
                {player.businessModel.name}
              </p>
            )}
          </div>

          {/* Reputation/Status */}
          <div className="text-right">
            <div className="flex items-center gap-1">
              {player.reputation >= 80 ? (
                <CheckCircle size={14} className="text-green-400" />
              ) : player.reputation <= 40 ? (
                <AlertCircle size={14} className="text-red-400" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-400" />
              )}
              <span className="text-xs text-gray-300">{player.reputation}</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-2">
          {/* Cash */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-green-400" />
              <span className="text-sm text-gray-300">Cash</span>
            </div>
            <span className="text-sm font-semibold text-green-400">
              {gameHelpers.formatCurrency(player.cash)}
            </span>
          </div>

          {/* Net Worth (for detailed view) */}
          {showDetailedInfo && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-400" />
                <span className="text-sm text-gray-300">Net Worth</span>
              </div>
              <span className="text-sm font-semibold text-blue-400">
                {gameHelpers.formatCurrency(netWorth)}
              </span>
            </div>
          )}

          {/* Robots */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Factory size={14} className="text-orange-400" />
              <span className="text-sm text-gray-300">Robots</span>
            </div>
            <span className="text-sm text-orange-300">
              {unsoldRobots} active
            </span>
          </div>

          {/* Technologies */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cog size={14} className="text-purple-400" />
              <span className="text-sm text-gray-300">Tech</span>
            </div>
            <span className="text-sm text-purple-300">
              {player.technologies.length}
            </span>
          </div>

          {/* Risk Level (for detailed view) */}
          {showDetailedInfo && totalDebt > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className={getRiskColor(riskLevel)} />
                <span className="text-sm text-gray-300">Risk</span>
              </div>
              <span className={`text-sm font-medium capitalize ${getRiskColor(riskLevel)}`}>
                {riskLevel}
              </span>
            </div>
          )}
        </div>

        {/* Detailed Information (expanded view) */}
        {showDetailedInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 pt-3 border-t border-white/20 space-y-2"
          >
            {/* Recent Performance */}
            <div className="text-xs">
              <div className="flex justify-between text-gray-400">
                <span>Total Revenue:</span>
                <span className="text-green-400">
                  {gameHelpers.formatCurrency(player.stats.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Robots Produced:</span>
                <span className="text-orange-400">{player.stats.totalProduction}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Innovations:</span>
                <span className="text-purple-400">{player.stats.successfulInnovations}</span>
              </div>
            </div>

            {/* Active Loans */}
            {player.loans.length > 0 && (
              <div className="text-xs">
                <div className="text-gray-400 mb-1">Active Loans:</div>
                {player.loans.slice(0, 2).map((loan, index) => (
                  <div key={index} className="flex justify-between text-gray-400">
                    <span>Loan #{index + 1}:</span>
                    <span className="text-red-400">
                      {gameHelpers.formatCurrency(loan.amount)}
                    </span>
                  </div>
                ))}
                {player.loans.length > 2 && (
                  <div className="text-gray-500 text-center">
                    +{player.loans.length - 2} more...
                  </div>
                )}
              </div>
            )}

            {/* Active Technologies */}
            {player.technologies.length > 0 && (
              <div className="text-xs">
                <div className="text-gray-400 mb-1">Technologies:</div>
                <div className="flex flex-wrap gap-1">
                  {player.technologies.slice(0, 3).map((tech, index) => (
                    <span
                      key={index}
                      className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs"
                    >
                      {tech.name.split(' ')[0]}
                    </span>
                  ))}
                  {player.technologies.length > 3 && (
                    <span className="text-gray-500">+{player.technologies.length - 3}</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* AI Personality (for AI players) */}
        {player.type === 'ai' && player.aiPersonality && (
          <div className="mt-3 pt-2 border-t border-white/20">
            <div className="flex items-center gap-2">
              <Bot size={12} className="text-purple-400" />
              <span className="text-xs text-purple-300">
                {player.aiPersonality.strategy.replace('-', ' ')} • {player.aiPersonality.riskTolerance} risk
              </span>
            </div>
          </div>
        )}

        {/* Current Action Status */}
        {isCurrentPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 pt-2 border-t border-blue-500/30"
          >
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-2 h-2 bg-blue-400 rounded-full"
              />
              <span className="text-xs text-blue-300 font-medium">
                Making decision...
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerCard;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This PlayerCard component is like a trading card or player profile that shows
 * important information about each person playing the game. Here's what it displays:
 * 
 * 1. BASIC INFO:
 *    - Player name and whether they're human or AI
 *    - Business model specialization
 *    - Current reputation score
 * 
 * 2. FINANCIAL STATUS:
 *    - Current cash available
 *    - Net worth (total value minus debts)
 *    - Risk level based on debt-to-assets ratio
 * 
 * 3. BUSINESS ASSETS:
 *    - Number of robots currently owned
 *    - Active technologies and innovations
 *    - Outstanding loans and payments
 * 
 * 4. PERFORMANCE METRICS:
 *    - Total revenue earned
 *    - Total robots produced
 *    - Successful innovations completed
 * 
 * 5. VISUAL INDICATORS:
 *    - Different colors for different player states
 *    - Animation when it's someone's turn
 *    - Special highlighting for the current user
 *    - AI personality traits for computer players
 * 
 * KEY FEATURES:
 * - Compact design that fits multiple players on screen
 * - Expandable detailed view for more information
 * - Real-time updates when player status changes
 * - Color-coded risk levels and status indicators
 * - Smooth animations to show turn progression
 * 
 * This helps students track everyone's progress and understand how different
 * business strategies are performing in real-time.
 */