// frontend/src/components/FinancialDashboard.tsx
// UPDATED VERSION - Now includes equity tracking and funding history
// Shows comprehensive financial analysis including venture capital and debt

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart,
  AlertTriangle,
  CheckCircle,
  Calculator,
  Target,
  HelpCircle,
  Download,
  Calendar,
  Building,
  Users,
  Clock,
  Zap
} from 'lucide-react';
import { Player, GameEvent, gameHelpers } from '../store/GameStore';

interface FinancialDashboardProps {
  player: Player;
  gameHistory: GameEvent[];
  isOpen: boolean;
  onClose: () => void;
  onRequestHelp: (concept: string) => void;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  player,
  gameHistory,
  isOpen,
  onClose,
  onRequestHelp
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'funding' | 'ratios'>('overview');

  if (!isOpen) return null;

  // Calculate financial metrics
  const totalAssets = gameHelpers.calculatePlayerAssets(player);
  const totalDebt = gameHelpers.calculatePlayerDebt(player);
  const netWorth = gameHelpers.calculatePlayerNetWorth(player);
  const robotValue = player.robots.filter(r => !r.sold).length * 100000;
  const techValue = player.technologies.reduce((sum, tech) => sum + 50000, 0);
  const companyValuation = gameHelpers.calculateCompanyValuation(player);
  
  // Equity and funding metrics
  const currentEquity = player.equity || 100;
  const fundingRounds = player.fundingRounds || [];
  const totalEquityRaised = fundingRounds
    .filter(f => f.type === 'equity')
    .reduce((sum, f) => sum + f.amount, 0);
  const totalDebtRaised = fundingRounds
    .filter(f => f.type === 'debt')
    .reduce((sum, f) => sum + f.amount, 0);

  // Performance metrics
  const totalRevenue = player.stats.totalRevenue;
  const totalProduction = player.stats.totalProduction;
  const averageRevenuePerRobot = totalProduction > 0 ? totalRevenue / totalProduction : 0;
  const riskLevel = gameHelpers.getRiskLevel(player);

  // Financial ratios
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;
  const cashRatio = totalAssets > 0 ? (player.cash / totalAssets) * 100 : 0;
  const productivityRatio = player.stats.roundsPlayed > 0 ? totalProduction / player.stats.roundsPlayed : 0;

  // Calculate burn rate and runway
  const calculateBurnRateAndRunway = () => {
    const recentRounds = gameHistory.filter(e => e.type === 'market').slice(-3);
    const averageSpending = recentRounds.length > 0 
      ? recentRounds.reduce((sum, round) => sum + (round.impact?.spending || 0), 0) / recentRounds.length
      : 0;
    
    const burnRate = averageSpending || 100000; // Default if no history
    const runway = burnRate > 0 ? Math.floor(player.cash / burnRate) : 999;
    
    return { burnRate, runway };
  };

  const { burnRate, runway } = calculateBurnRateAndRunway();

  // Recent financial events from game history
  const recentFinancialEvents = gameHistory
    .filter(event => event.type === 'market' || event.type === 'technology' || event.type === 'funding')
    .slice(-5);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Financial Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
          <DollarSign className="text-green-400 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-green-400">
            {gameHelpers.formatCurrency(player.cash)}
          </div>
          <div className="text-sm text-green-200">Available Cash</div>
        </div>

        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
          <Building className="text-blue-400 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-blue-400">
            {gameHelpers.formatCurrency(companyValuation)}
          </div>
          <div className="text-sm text-blue-200">Company Valuation</div>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
          <PieChart className="text-purple-400 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-purple-400">
            {currentEquity}%
          </div>
          <div className="text-sm text-purple-200">Your Equity</div>
          {currentEquity < 51 && currentEquity > 0 && (
            <div className="text-xs text-red-400 mt-1">⚠️ Lost control</div>
          )}
        </div>

        <div className={`border rounded-lg p-4 text-center ${
          riskLevel === 'low' ? 'bg-green-500/20 border-green-500/30' :
          riskLevel === 'medium' ? 'bg-yellow-500/20 border-yellow-500/30' :
          'bg-red-500/20 border-red-500/30'
        }`}>
          <AlertTriangle className={`mx-auto mb-2 ${
            riskLevel === 'low' ? 'text-green-400' :
            riskLevel === 'medium' ? 'text-yellow-400' :
            'text-red-400'
          }`} size={24} />
          <div className={`text-2xl font-bold capitalize ${
            riskLevel === 'low' ? 'text-green-400' :
            riskLevel === 'medium' ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {riskLevel}
          </div>
          <div className="text-sm text-gray-300">Risk Level</div>
        </div>
      </div>

      {/* Burn Rate & Runway */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="text-orange-400" size={20} />
              <span className="text-white font-semibold">Burn Rate</span>
            </div>
            <span className="text-2xl font-bold text-orange-400">
              {gameHelpers.formatCurrency(burnRate)}/round
            </span>
          </div>
          <p className="text-sm text-gray-300">
            Average spending per round based on recent activity
          </p>
        </div>

        <div className={`border rounded-lg p-4 ${
          runway > 5 ? 'bg-green-500/20 border-green-500/30' :
          runway > 2 ? 'bg-yellow-500/20 border-yellow-500/30' :
          'bg-red-500/20 border-red-500/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className={`${
                runway > 5 ? 'text-green-400' :
                runway > 2 ? 'text-yellow-400' :
                'text-red-400'
              }`} size={20} />
              <span className="text-white font-semibold">Cash Runway</span>
            </div>
            <span className={`text-2xl font-bold ${
              runway > 5 ? 'text-green-400' :
              runway > 2 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {runway} rounds
            </span>
          </div>
          <p className="text-sm text-gray-300">
            {runway > 5 ? 'Healthy cash position' :
             runway > 2 ? 'Consider raising funds soon' :
             'Urgent: Need funding immediately'}
          </p>
        </div>
      </div>

      {/* Asset Breakdown */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <PieChart className="text-blue-400" size={20} />
          Asset Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Cash</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full transition-all"
                  style={{ width: `${cashRatio}%` }}
                />
              </div>
              <span className="text-green-400 font-semibold w-20 text-right">
                {gameHelpers.formatCurrency(player.cash)}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Robot Inventory</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-orange-400 h-2 rounded-full transition-all"
                  style={{ width: `${totalAssets > 0 ? (robotValue / totalAssets) * 100 : 0}%` }}
                />
              </div>
              <span className="text-orange-400 font-semibold w-20 text-right">
                {gameHelpers.formatCurrency(robotValue)}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Technology Assets</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-purple-400 h-2 rounded-full transition-all"
                  style={{ width: `${totalAssets > 0 ? (techValue / totalAssets) * 100 : 0}%` }}
                />
              </div>
              <span className="text-purple-400 font-semibold w-20 text-right">
                {gameHelpers.formatCurrency(techValue)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Target className="text-green-400" size={20} />
          Performance Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">{totalProduction}</div>
            <div className="text-gray-300">Robots Produced</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">
              {gameHelpers.formatCurrency(averageRevenuePerRobot)}
            </div>
            <div className="text-gray-300">Avg Revenue/Robot</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">{player.stats.successfulInnovations}</div>
            <div className="text-gray-300">Successful R&D</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBreakdown = () => (
    <div className="space-y-6">
      {/* Detailed Financial Statement */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Calculator className="text-blue-400" size={20} />
          Balance Sheet
        </h3>
        <div className="space-y-4">
          {/* Assets */}
          <div>
            <h4 className="text-green-400 font-medium mb-2">Assets</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300 pl-4">Cash & Cash Equivalents</span>
                <span className="text-white">{gameHelpers.formatCurrency(player.cash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 pl-4">Robot Inventory ({player.robots.filter(r => !r.sold).length} units)</span>
                <span className="text-white">{gameHelpers.formatCurrency(robotValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 pl-4">Technology & IP ({player.technologies.length} active)</span>
                <span className="text-white">{gameHelpers.formatCurrency(techValue)}</span>
              </div>
              <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold">
                <span className="text-green-400">Total Assets</span>
                <span className="text-green-400">{gameHelpers.formatCurrency(totalAssets)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities */}
          <div>
            <h4 className="text-red-400 font-medium mb-2">Liabilities</h4>
            <div className="space-y-2 text-sm">
              {player.loans.length > 0 ? (
                <>
                  {player.loans.map((loan, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-gray-300 pl-4">Loan #{index + 1} ({loan.roundsRemaining} rounds)</span>
                      <span className="text-white">{gameHelpers.formatCurrency(loan.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold">
                    <span className="text-red-400">Total Liabilities</span>
                    <span className="text-red-400">{gameHelpers.formatCurrency(totalDebt)}</span>
                  </div>
                </>
              ) : (
                <div className="text-gray-400 pl-4 italic">No outstanding debts</div>
              )}
            </div>
          </div>

          {/* Equity */}
          <div>
            <h4 className="text-blue-400 font-medium mb-2">Shareholder's Equity</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-300 pl-4">Company Valuation</span>
                <span className="text-white">{gameHelpers.formatCurrency(companyValuation)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 pl-4">Your Ownership</span>
                <span className={`font-semibold ${
                  currentEquity >= 51 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentEquity}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 pl-4">Your Equity Value</span>
                <span className="text-blue-400 font-semibold">
                  {gameHelpers.formatCurrency(companyValuation * (currentEquity / 100))}
                </span>
              </div>
              <div className="border-t border-gray-600 pt-2 flex justify-between font-semibold">
                <span className="text-blue-400">Net Worth</span>
                <span className="text-blue-400">{gameHelpers.formatCurrency(netWorth)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Details */}
      {player.loans.length > 0 && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-red-400" size={20} />
            Debt Management
          </h3>
          <div className="space-y-3">
            {player.loans.map((loan, index) => (
              <div key={index} className="bg-red-600/20 rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-white font-medium">Loan #{index + 1}</span>
                  <span className="text-red-300 font-semibold">{gameHelpers.formatCurrency(loan.amount)}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-red-200">
                  <div>Interest Rate: {(loan.interestRate * 100).toFixed(1)}%</div>
                  <div>Rounds Remaining: {loan.roundsRemaining}</div>
                  <div>Monthly Payment: {gameHelpers.formatCurrency(loan.monthlyPayment)}</div>
                  <div>Total Remaining: {gameHelpers.formatCurrency(loan.monthlyPayment * loan.roundsRemaining)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFunding = () => (
    <div className="space-y-6">
      {/* Funding Overview */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Users className="text-purple-400" size={20} />
          Funding Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-purple-500/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">
              {gameHelpers.formatCurrency(totalEquityRaised)}
            </div>
            <div className="text-sm text-purple-200">Total Equity Raised</div>
          </div>
          
          <div className="text-center p-3 bg-orange-500/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">
              {gameHelpers.formatCurrency(totalDebtRaised)}
            </div>
            <div className="text-sm text-orange-200">Total Debt Raised</div>
          </div>
          
          <div className="text-center p-3 bg-blue-500/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {fundingRounds.length}
            </div>
            <div className="text-sm text-blue-200">Funding Rounds</div>
          </div>
        </div>

        {/* Funding History */}
        {fundingRounds.length > 0 ? (
          <div className="space-y-3">
            <h4 className="text-white font-medium">Funding History</h4>
            {fundingRounds.map((round, index) => (
              <div key={index} className={`p-3 rounded-lg ${
                round.type === 'equity' ? 'bg-purple-500/20' : 
                round.type === 'debt' ? 'bg-orange-500/20' :
                'bg-gray-500/20'
              }`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-white font-medium">
                      Round {round.round}: {round.type === 'pre-seed' ? 'Pre-Seed' : 
                                           round.type === 'equity' ? round.investor || 'Venture Capital' :
                                           round.type === 'debt' ? 'Debt Financing' :
                                           'Bootstrap'}
                    </span>
                    {round.takenInRound && (
                      <span className="text-gray-400 text-sm ml-2">(Round {round.takenInRound})</span>
                    )}
                  </div>
                  <span className={`font-semibold ${
                    round.type === 'equity' ? 'text-purple-400' :
                    round.type === 'debt' ? 'text-orange-400' :
                    'text-green-400'
                  }`}>
                    {gameHelpers.formatCurrency(round.amount)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                  {round.equityGiven && (
                    <>
                      <div>Equity Given: {round.equityGiven}%</div>
                      <div>Post-Money Equity: {round.postMoneyEquity}%</div>
                    </>
                  )}
                  {round.interestRate && (
                    <>
                      <div>Interest Rate: {(round.interestRate * 100).toFixed(1)}%</div>
                      <div>Term: {round.termRounds} rounds</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No funding rounds completed yet
          </div>
        )}
      </div>

      {/* Equity Dilution Analysis */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <PieChart className="text-blue-400" size={20} />
          Equity Dilution Analysis
        </h3>
        
        <div className="space-y-4">
          {/* Current Ownership */}
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white font-medium">Your Current Ownership</span>
              <span className={`text-2xl font-bold ${
                currentEquity >= 51 ? 'text-green-400' : 'text-red-400'
              }`}>
                {currentEquity}%
              </span>
            </div>
            {currentEquity < 51 && (
              <div className="text-sm text-red-300 flex items-center gap-2">
                <AlertTriangle size={14} />
                You've lost majority control of your company
              </div>
            )}
          </div>

          {/* Dilution Chart */}
          <div className="space-y-2">
            <div className="text-sm text-gray-400">Ownership Over Time</div>
            {fundingRounds.filter(r => r.type === 'equity').map((round, index, arr) => {
              const startEquity = index === 0 ? 100 : arr[index - 1].postMoneyEquity || 100;
              const endEquity = round.postMoneyEquity || startEquity;
              
              return (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-400 w-20">Round {round.round}:</span>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-gray-300">{startEquity}%</span>
                    <div className="flex-1 h-1 bg-gray-700 rounded">
                      <div className="h-1 bg-red-400 rounded" style={{ width: `${round.equityGiven}%` }} />
                    </div>
                    <span className={`font-medium ${endEquity >= 51 ? 'text-green-400' : 'text-red-400'}`}>
                      {endEquity}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Future Projections */}
          <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
            <h4 className="text-yellow-400 font-medium mb-2">Dilution Forecast</h4>
            <p className="text-sm text-yellow-200">
              {currentEquity >= 70 ? 'You have room for 2-3 more equity rounds while maintaining control.' :
               currentEquity >= 51 ? 'Be very careful - one more major equity round could lose you control.' :
               'Focus on profitability or debt financing to avoid further dilution.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRatios = () => (
    <div className="space-y-6">
      {/* Financial Ratios */}
      <div className="bg-white/5 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="text-blue-400" size={20} />
          Financial Ratios & Analysis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Liquidity Ratios */}
          <div>
            <h4 className="text-green-400 font-medium mb-3">Liquidity & Solvency</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white text-sm">Cash Ratio</div>
                  <div className="text-gray-400 text-xs">Cash / Total Assets</div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-semibold">{cashRatio.toFixed(1)}%</div>
                  <div className={`text-xs ${
                    cashRatio > 30 ? 'text-green-400' : 
                    cashRatio > 15 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {cashRatio > 30 ? 'Excellent' : cashRatio > 15 ? 'Good' : 'Concerning'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white text-sm">Debt-to-Asset Ratio</div>
                  <div className="text-gray-400 text-xs">Total Debt / Total Assets</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 font-semibold">{debtToAssetRatio.toFixed(1)}%</div>
                  <div className={`text-xs ${
                    debtToAssetRatio < 30 ? 'text-green-400' : 
                    debtToAssetRatio < 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {debtToAssetRatio < 30 ? 'Low Risk' : debtToAssetRatio < 60 ? 'Moderate' : 'High Risk'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white text-sm">Burn Rate</div>
                  <div className="text-gray-400 text-xs">Cash spent / Round</div>
                </div>
                <div className="text-right">
                  <div className="text-orange-400 font-semibold">{gameHelpers.formatCurrency(burnRate)}</div>
                  <div className={`text-xs ${
                    runway > 5 ? 'text-green-400' : 
                    runway > 2 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {runway} rounds runway
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Efficiency Ratios */}
          <div>
            <h4 className="text-purple-400 font-medium mb-3">Operational Efficiency</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white text-sm">Production Rate</div>
                  <div className="text-gray-400 text-xs">Robots / Round Played</div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-semibold">{productivityRatio.toFixed(1)}</div>
                  <div className={`text-xs ${
                    productivityRatio > 2 ? 'text-green-400' : 
                    productivityRatio > 1 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {productivityRatio > 2 ? 'High' : productivityRatio > 1 ? 'Average' : 'Low'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white text-sm">Revenue per Robot</div>
                  <div className="text-gray-400 text-xs">Total Revenue / Robots Made</div>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-semibold">
                    {gameHelpers.formatCurrency(averageRevenuePerRobot)}
                  </div>
                  <div className={`text-xs ${
                    averageRevenuePerRobot > 500000 ? 'text-green-400' : 
                    averageRevenuePerRobot > 300000 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {averageRevenuePerRobot > 500000 ? 'Excellent' : 
                     averageRevenuePerRobot > 300000 ? 'Good' : 'Needs Work'}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="text-white text-sm">Valuation Multiple</div>
                  <div className="text-gray-400 text-xs">Valuation / Assets</div>
                </div>
                <div className="text-right">
                  <div className="text-blue-400 font-semibold">2.5x</div>
                  <div className="text-xs text-blue-400">Industry Standard</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="text-blue-400" size={20} />
          Financial Health Recommendations
        </h3>
        <div className="space-y-2 text-sm">
          {cashRatio < 15 && (
            <div className="flex gap-2 text-yellow-300">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Consider maintaining higher cash reserves for financial stability</span>
            </div>
          )}
          {debtToAssetRatio > 50 && (
            <div className="flex gap-2 text-red-300">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>High debt ratio - focus on debt reduction or asset growth</span>
            </div>
          )}
          {runway < 3 && (
            <div className="flex gap-2 text-red-300">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Low cash runway - consider raising funds immediately</span>
            </div>
          )}
          {currentEquity < 51 && (
            <div className="flex gap-2 text-red-300">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>You've lost majority control - focus on profitability over growth</span>
            </div>
          )}
          {averageRevenuePerRobot < 300000 && totalProduction > 0 && (
            <div className="flex gap-2 text-orange-300">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Low revenue per robot - consider premium features or better market timing</span>
            </div>
          )}
          {productivityRatio < 1 && player.stats.roundsPlayed > 2 && (
            <div className="flex gap-2 text-purple-300">
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Low production rate - invest in production capacity or process improvements</span>
            </div>
          )}
          {riskLevel === 'low' && cashRatio > 50 && currentEquity > 70 && (
            <div className="flex gap-2 text-green-300">
              <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>Strong financial position - consider growth investments or expansion</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Financial Dashboard</h2>
                <p className="text-blue-100">Comprehensive financial analysis for {player.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mt-4">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'breakdown', label: 'Balance Sheet', icon: Calculator },
                { id: 'funding', label: 'Funding', icon: Users },
                { id: 'ratios', label: 'Analysis', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'text-blue-200 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'breakdown' && renderBreakdown()}
                {activeTab === 'funding' && renderFunding()}
                {activeTab === 'ratios' && renderRatios()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-700 p-4 flex justify-between items-center">
            <button
              onClick={() => onRequestHelp('financial-analysis')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <HelpCircle size={16} />
              Get AI Help
            </button>
            <div className="text-gray-400 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FinancialDashboard;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This enhanced FinancialDashboard component is like having a professional CFO
 * dashboard that shows all the money and ownership details. Here's what's new:
 * 
 * 1. EQUITY TRACKING:
 *    - Shows current ownership percentage
 *    - Tracks how equity changes with funding rounds
 *    - Warns when losing majority control (below 51%)
 * 
 * 2. FUNDING HISTORY:
 *    - Complete record of all funding rounds
 *    - Shows whether funds came from equity or debt
 *    - Tracks dilution over time
 * 
 * 3. BURN RATE & RUNWAY:
 *    - Calculates how fast you're spending money
 *    - Predicts how many rounds until you run out
 *    - Helps plan when to raise more funds
 * 
 * 4. VALUATION ANALYSIS:
 *    - Shows company worth based on assets
 *    - Calculates your equity value
 *    - Uses industry standard multipliers
 * 
 * 5. ENHANCED FINANCIAL METRICS:
 *    - Debt-to-asset ratio for risk assessment
 *    - Cash ratio for liquidity measurement
 *    - Production efficiency tracking
 *    - Revenue per unit analysis
 * 
 * NEW BUSINESS CONCEPTS TAUGHT:
 * - Equity dilution and control
 * - Venture capital vs debt financing
 * - Burn rate and cash runway
 * - Company valuation methods
 * - Financial health indicators
 * - Strategic funding decisions
 * 
 * This gives students real experience with the financial decisions that
 * startup founders face, including the critical trade-offs between
 * growth funding and maintaining control of their company.
 */