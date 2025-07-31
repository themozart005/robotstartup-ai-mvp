// frontend/src/components/PlayerCard.tsx
// UPDATED VERSION - Shows equity, valuation, and funding status

import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Bot, 
  DollarSign, 
  Cog, 
  Factory,
  TrendingUp,
  TrendingDown,
  PieChart,
  AlertTriangle,
  Crown,
  Building
} from 'lucide-react';
import { Player, gameHelpers } from '../store/GameStore';

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer?: boolean;
  isMe?: boolean;
  showDetailed?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  isCurrentPlayer = false, 
  isMe = false,
  showDetailed = false 
}) => {
  // Calculate financial metrics
  const netWorth = gameHelpers.calculatePlayerNetWorth(player);
  const companyValuation = gameHelpers.calculateCompanyValuation(player);
  const equity = player.equity || 100;
  const riskLevel = gameHelpers.getRiskLevel(player);
  
  // Determine if player has majority control
  const hasMajorityControl = equity >= 51;
  
  // Get funding rounds info
  const fundingRounds = player.fundingRounds || [];
  const hasRaisedFunding = fundingRounds.length > 0;
  const totalEquityRaised = fundingRounds
    .filter(f => f.type === 'equity')
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-3 border transition-all ${
        isMe 
          ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
          : isCurrentPlayer 
          ? 'bg-green-500/20 border-green-500/50 shadow-md'
          : 'bg-white/5 border-white/20 hover:bg-white/10'
      }`}
    >
      {/* Player Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {player.type === 'ai' ? (
            <Bot className={`${isCurrentPlayer ? 'text-green-400' : 'text-purple-400'}`} size={18} />
          ) : (
            <User className={`${isMe ? 'text-blue-400' : isCurrentPlayer ? 'text-green-400' : 'text-gray-400'}`} size={18} />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${
                isMe ? 'text-blue-100' : isCurrentPlayer ? 'text-green-100' : 'text-white'
              }`}>
                {player.name}
              </span>
              {isMe && <span className="text-xs text-blue-400 font-medium">(You)</span>}
              {hasMajorityControl && equity < 100 && (
                <Crown className="text-yellow-400" size={14} title="Majority Control" />
              )}
            </div>
            {player.type === 'ai' && player.aiPersonality && (
              <div className="text-xs text-purple-300">
                {player.aiPersonality.strategy.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        </div>
        
        {isCurrentPlayer && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-500/30 rounded text-xs">
            <TrendingUp size={12} />
            <span className="text-green-200">Turn</span>
          </div>
        )}
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Cash */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="text-green-400" size={14} />
            <span className="text-xs text-gray-400">Cash</span>
          </div>
          <div className="text-sm font-semibold text-green-400">
            {gameHelpers.formatCurrency(player.cash)}
          </div>
        </div>

        {/* Net Worth */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Building className="text-blue-400" size={14} />
            <span className="text-xs text-gray-400">Net Worth</span>
          </div>
          <div className="text-sm font-semibold text-blue-400">
            {gameHelpers.formatCurrency(netWorth)}
          </div>
        </div>
      </div>

      {/* Equity & Valuation */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Equity Ownership */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <PieChart className="text-purple-400" size={14} />
            <span className="text-xs text-gray-400">Equity</span>
          </div>
          <div className={`text-sm font-semibold ${
            equity >= 51 ? 'text-green-400' : equity >= 25 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {equity}%
            {!hasMajorityControl && equity > 0 && (
              <AlertTriangle className="inline ml-1" size={10} />
            )}
          </div>
        </div>

        {/* Company Valuation */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="text-orange-400" size={14} />
            <span className="text-xs text-gray-400">Valuation</span>
          </div>
          <div className="text-sm font-semibold text-orange-400">
            {gameHelpers.formatCurrency(companyValuation)}
          </div>
        </div>
      </div>

      {/* Assets Overview */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Robots */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Factory className="text-orange-400" size={12} />
            <span className="text-xs text-gray-400">Robots</span>
          </div>
          <div className="text-xs text-orange-300">
            {player.robots.filter(r => !r.sold).length}
          </div>
        </div>

        {/* Technologies */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Cog className="text-purple-400" size={12} />
            <span className="text-xs text-gray-400">Tech</span>
          </div>
          <div className="text-xs text-purple-300">
            {player.technologies.length}
          </div>
        </div>

        {/* Reputation */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <User className="text-blue-400" size={12} />
            <span className="text-xs text-gray-400">Rep</span>
          </div>
          <div className={`text-xs font-medium ${
            player.reputation >= 70 ? 'text-green-400' : 
            player.reputation >= 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {player.reputation}
          </div>
        </div>
      </div>

      {/* Funding Status */}
      {hasRaisedFunding && (
        <div className="border-t border-white/10 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Funding:</span>
            <span className="text-xs text-purple-300">
              {fundingRounds.length} round{fundingRounds.length !== 1 ? 's' : ''}
            </span>
          </div>
          {totalEquityRaised > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Raised:</span>
              <span className="text-xs text-green-300">
                {gameHelpers.formatCurrency(totalEquityRaised)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Risk Indicator */}
      <div className="border-t border-white/10 pt-2 mt-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Risk Level:</span>
          <span className={`text-xs font-medium capitalize ${
            riskLevel === 'low' ? 'text-green-400' : 
            riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {riskLevel}
          </span>
        </div>
      </div>

      {/* Detailed Information (if enabled) */}
      {showDetailed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-white/10 pt-2 mt-2 space-y-1"
        >
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Total Revenue:</span>
            <span className="text-green-300">{gameHelpers.formatCurrency(player.stats.totalRevenue)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Robots Built:</span>
            <span className="text-orange-300">{player.stats.totalProduction}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Innovations:</span>
            <span className="text-purple-300">{player.stats.successfulInnovations}</span>
          </div>
          {player.loans.length > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Active Loans:</span>
              <span className="text-red-300">{player.loans.length}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* Control Warning */}
      {!hasMajorityControl && equity > 0 && (
        <div className="border-t border-red-500/30 pt-2 mt-2">
          <div className="flex items-center gap-1">
            <AlertTriangle className="text-red-400" size={12} />
            <span className="text-xs text-red-300">Lost majority control</span>
          </div>
        </div>
      )}
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
