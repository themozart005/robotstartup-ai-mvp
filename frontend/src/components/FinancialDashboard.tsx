// frontend/src/components/FinancialDashboard.tsx
// This provides detailed financial analysis and reporting
// Like having a CFO dashboard that shows all the money details

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
  Calendar
} from 'lucide-react';
import { Player, GameEvent, gameHelpers } from '../store/gameStore';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'forecast' | 'ratios'>('overview');

  if (!isOpen) return null;

  // Calculate financial metrics
  const totalAssets = gameHelpers.calculatePlayerAssets(player);
  const totalDebt = gameHelpers.calculatePlayerDebt(player);
  const netWorth = gameHelpers.calculatePlayerNetWorth(player);
  const robotValue = player.robots.filter(r => !r.sold).length * 100000;
  const techValue = player.technologies.reduce((sum, tech) => sum + 50000, 0);

  // Performance metrics
  const totalRevenue = player.stats.totalRevenue;
  const totalProduction = player.stats.totalProduction;
  const averageRevenuePerRobot = totalProduction > 0 ? totalRevenue / totalProduction : 0;
  const riskLevel = gameHelpers.getRiskLevel(player);

  // Financial ratios
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;
  const cashRatio = totalAssets > 0 ? (player.cash / totalAssets) * 100 : 0;
  const productivityRatio = player.stats.roundsPlayed > 0 ? totalProduction / player.stats.roundsPlayed : 0;

  // Recent financial events from game history
  const recentFinancialEvents = gameHistory
    .filter(event => event.type === 'market' || event.type === 'technology')
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
          <TrendingUp className="text-blue-400 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-blue-400">
            {gameHelpers.formatCurrency(netWorth)}
          </div>
          <div className="text-sm text-blue-200">Net Worth</div>
        </div>

        <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
          <BarChart3 className="text-purple-400 mx-auto mb-2" size={24} />
          <div className="text-2xl font-bold text-purple-400">
            {gameHelpers.formatCurrency(totalRevenue)}
          </div>
          <div className="text-sm text-purple-200">Total Revenue</div>
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
            <h4 className="text-blue-400 font-medium mb-2">Owner's Equity</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between font-semibold">
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
          {riskLevel === 'low' && cashRatio > 50 && (
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
                { id: 'breakdown', label: 'Breakdown', icon: Calculator },
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
 * This FinancialDashboard component is like having a professional accounting
 * system that shows all the money details of the business. Here's what it teaches:
 * 
 * 1. FINANCIAL STATEMENTS:
 *    - Balance Sheet showing assets, liabilities, and equity
 *    - Clear breakdown of what the company owns vs owes
 *    - Real-world business document structure
 * 
 * 2. KEY FINANCIAL METRICS:
 *    - Net worth calculation (assets minus debts)
 *    - Cash flow and liquidity analysis
 *    - Revenue and profitability tracking
 * 
 * 3. FINANCIAL RATIOS:
 *    - Debt-to-asset ratio for risk assessment
 *    - Cash ratio for liquidity measurement
 *    - Productivity and efficiency metrics
 * 
 * 4. RISK ASSESSMENT:
 *    - Visual risk level indicators
 *    - Early warning signs for financial trouble
 *    - Recommendations for improvement
 * 
 * 5. PERFORMANCE ANALYSIS:
 *    - Revenue per robot (unit economics)
 *    - Production efficiency tracking
 *    - R&D investment return analysis
 * 
 * BUSINESS CONCEPTS TAUGHT:
 * - Reading and understanding financial statements
 * - Financial ratio analysis and interpretation
 * - Debt management and leverage
 * - Liquidity and solvency concepts
 * - Performance measurement and KPIs
 * - Financial planning and forecasting
 * 
 * This gives students experience with the same financial tools that real
 * business executives use to make decisions and track company health.
 */